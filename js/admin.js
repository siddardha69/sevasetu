/* ===== ADMIN DASHBOARD LOGIC ===== */

const Admin = {
    init() {
        this.user = GrievanceDesk.checkAuth('admin');
        if (!this.user) return;

        this.tbody = document.getElementById('complaints-tbody');
        this.statusFilter = document.getElementById('status-filter');
        this.searchInput = document.getElementById('table-search-input');
        
        this.currentAssignId = null;

        this.loadDashboard();
        this.setupEventListeners();
    },

    loadDashboard() {
        const complaints = GrievanceDesk.getComplaints();
        this.updateStats(complaints);
        this.renderTable(complaints);
        this.loadOfficers();
    },

    updateStats(complaints) {
        const stats = {
            total: complaints.length,
            pending: complaints.filter(c => c.status === 'Pending').length,
            progress: complaints.filter(c => c.status === 'In Progress').length,
            resolved: complaints.filter(c => c.status === 'Resolved').length
        };

        this.animateValue('stat-total', 0, stats.total, 1000);
        this.animateValue('stat-pending', 0, stats.pending, 1000);
        this.animateValue('stat-progress', 0, stats.progress, 1000);
        this.animateValue('stat-resolved', 0, stats.resolved, 1000);
    },

    animateValue(id, start, end, duration) {
        const obj = document.getElementById(id);
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start).toLocaleString();
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    },

    renderTable(complaints) {
        this.tbody.innerHTML = '';
        complaints.forEach(c => {
            const row = document.createElement('tr');
            
            // Extract AI data or fallback
            const aiClass = c.aiData ? c.aiData.aiClassification : c.department;
            const cluster = c.aiData ? c.aiData.aiClusteringTag : 'N/A';
            const score = c.aiData ? c.aiData.aiPriorityScore : '-';
            const priorityLevel = c.aiData ? c.aiData.aiPriorityLevel : c.priority;

            // Phase 4: Critical row highlight
            if (priorityLevel === 'Critical') {
                row.classList.add('critical-row');
            }
            
            // Color code the priority score
            let scoreBadge = '-';
            if (score !== '-') {
                const color = priorityLevel === 'Critical' ? '#7f1d1d' : (score >= 8 ? 'var(--danger-red)' : (score >= 5 ? '#f39c12' : 'var(--success-green)'));
                const label = priorityLevel === 'Critical' ? `🚨 ${score}/10 (Critical)` : `${score}/10 (${priorityLevel})`;
                scoreBadge = `<span style="background: ${color}; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">${label}</span>`;
            }

            row.innerHTML = `
                <td><strong>${c.id}</strong></td>
                <td>${c.name}</td>
                <td><span style="font-size: 13px; background: #eef2ff; color: var(--primary-blue); padding: 4px 8px; border-radius: 4px;">${aiClass}</span></td>
                <td><span style="font-size: 12px; color: var(--muted-gray-text);">#${cluster}</span></td>
                <td><span class="status-pill ${c.status.toLowerCase().replace(' ', '-')}">${c.status}</span></td>
                <td>${scoreBadge}</td>
                <td>
                    <span class="action-btn" onclick="Admin.viewComplaint('${c.id}')">View</span>
                    ${c.officer === 'Unassigned' ? `<button class="assign-btn-small" onclick="Admin.openAssignModal('${c.id}')">Assign</button>` : ''}
                </td>
            `;
            this.tbody.appendChild(row);
        });
    },

    loadOfficers() {
        const officers = GrievanceDesk.getOfficers();
        const select = document.getElementById('officer-select');
        select.innerHTML = '<option value="" disabled selected>Select Officer</option>';
        officers.forEach(o => {
            select.innerHTML += `<option value="${o.name}">${o.name} (${o.department})</option>`;
        });
    },

    setupEventListeners() {
        this.statusFilter.addEventListener('change', () => this.filterTable());
        this.searchInput.addEventListener('input', () => this.filterTable());
        
        document.getElementById('logout-btn').addEventListener('click', () => GrievanceDesk.logout());
        
        // Modal events
        document.querySelector('.close-modal').addEventListener('click', () => this.closeModal());
        document.getElementById('confirm-assign').addEventListener('click', () => this.assignOfficer());
    },

    filterTable() {
        const status = this.statusFilter.value;
        const search = this.searchInput.value.toLowerCase();
        let complaints = GrievanceDesk.getComplaints();

        // Phase 4: Critical filter
        if (status === 'Critical') {
            complaints = complaints.filter(c => (c.aiData?.aiPriorityLevel || c.priority) === 'Critical');
        } else if (status !== 'All') {
            complaints = complaints.filter(c => c.status === status);
        }

        if (search) {
            complaints = complaints.filter(c => 
                c.id.toLowerCase().includes(search) || 
                c.name.toLowerCase().includes(search) || 
                c.department.toLowerCase().includes(search)
            );
        }

        this.renderTable(complaints);
    },

    openAssignModal(id) {
        this.currentAssignId = id;
        document.getElementById('assign-id').innerText = id;
        document.getElementById('assign-modal').classList.add('active');
        // Clear old recommendations
        const recContainer = document.getElementById('ai-officer-rec');
        if (recContainer) recContainer.innerHTML = '<div style="color:#6b7280;font-size:13px;padding:8px 0">🤖 Loading AI recommendations...</div>';
        this.fetchOfficerRecommendations(id);
    },

    async fetchOfficerRecommendations(complaintId) {
        const recContainer = document.getElementById('ai-officer-rec');
        if (!recContainer) return;

        try {
            const complaints = GrievanceDesk.getComplaints();
            const complaint = complaints.find(c => c.id === complaintId);
            const officers = GrievanceDesk.getOfficers();

            const response = await fetch('http://localhost:3000/api/recommend-officer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ complaint, officers, allComplaints: complaints })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.recommendations && result.recommendations.length > 0) {
                    const top = result.recommendations.slice(0, 2);
                    recContainer.innerHTML = `
                        <div style="font-size:12px;font-weight:600;color:#1a56db;margin-bottom:8px;">🤖 AI Recommendations</div>
                        ${top.map((r, i) => `
                            <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:${i === 0 ? '#eff6ff' : '#f8fafc'};border-radius:8px;margin-bottom:6px;cursor:pointer;border:1.5px solid ${i === 0 ? '#bfdbfe' : '#e2e8f0'};" onclick="document.getElementById('officer-select').value='${r.name}'">
                                <span style="background:${i === 0 ? '#1a56db' : '#6b7280'};color:white;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">${r.score}/10</span>
                                <div>
                                    <div style="font-size:13px;font-weight:600;color:#1e293b">${i === 0 ? '⭐ ' : ''}${r.name}</div>
                                    <div style="font-size:11px;color:#64748b">${r.reason}</div>
                                </div>
                            </div>
                        `).join('')}
                    `;
                } else {
                    recContainer.innerHTML = '<div style="color:#6b7280;font-size:13px;padding:8px 0">No AI recommendations available.</div>';
                }
            } else {
                recContainer.innerHTML = '<div style="color:#9ca3af;font-size:13px;padding:8px 0">⚠️ AI offline — select manually below.</div>';
            }
        } catch (e) {
            if (recContainer) recContainer.innerHTML = '<div style="color:#9ca3af;font-size:13px;padding:8px 0">⚠️ Backend not running — select manually.</div>';
        }
    },

    closeModal() {
        document.getElementById('assign-modal').classList.remove('active');
    },

    assignOfficer() {
        const officerName = document.getElementById('officer-select').value;
        if (!officerName) {
            GrievanceDesk.showToast('Please select an officer', 'error');
            return;
        }

        const complaints = GrievanceDesk.getComplaints();
        const complaint = complaints.find(c => c.id === this.currentAssignId);
        
        complaint.officer = officerName;
        complaint.status = 'In Progress'; // Automatically move to In Progress when assigned
        complaint.timeline.push({
            status: 'Assigned',
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            note: `Assigned to ${officerName}`
        });

        GrievanceDesk.saveComplaint(complaint);
        GrievanceDesk.showToast(`Complaint assigned to ${officerName}`);
        this.closeModal();
        this.loadDashboard();
    },

    viewComplaint(id) {
        window.location.href = `track-complaint.html?id=${id}`;
    }
};

document.addEventListener('DOMContentLoaded', () => Admin.init());
window.Admin = Admin; // For onclick handlers
