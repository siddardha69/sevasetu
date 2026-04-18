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
            
            // Color code the priority score
            let scoreBadge = '-';
            if (score !== '-') {
                const color = score >= 8 ? 'var(--danger-red)' : (score >= 5 ? '#f39c12' : 'var(--success-green)');
                scoreBadge = `<span style="background: ${color}; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">${score}/10 (${priorityLevel})</span>`;
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

        if (status !== 'All') {
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
