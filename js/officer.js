/* ===== OFFICER DASHBOARD LOGIC ===== */

const Officer = {
    init() {
        this.user = GrievanceDesk.checkAuth('officer');
        if (!this.user) return;

        this.tbody = document.getElementById('complaints-tbody');
        this.statusFilter = document.getElementById('status-filter');
        this.searchInput = document.getElementById('table-search-input');
        
        this.currentComplaintId = null;

        this.setupProfile();
        this.loadDashboard();
        this.setupEventListeners();
    },

    setupProfile() {
        document.getElementById('officer-name-display').innerText = this.user.name;
        document.getElementById('officer-dept-badge').innerText = this.user.department;
        
        const initials = this.user.name.split(' ').map(n => n[0]).join('');
        document.getElementById('officer-avatar').innerText = initials;
    },

    loadDashboard() {
        const complaints = GrievanceDesk.getComplaints();
        const myComplaints = complaints.filter(c => c.officer === this.user.name);
        
        this.updateStats(myComplaints);
        this.renderTable(myComplaints);
    },

    updateStats(complaints) {
        const stats = {
            assigned: complaints.length,
            progress: complaints.filter(c => c.status === 'In Progress').length,
            resolved: complaints.filter(c => c.status === 'Resolved').length
        };

        this.animateValue('stat-assigned', 0, stats.assigned, 1000);
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
            row.innerHTML = `
                <td><strong>${c.id}</strong></td>
                <td><div style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.description}</div></td>
                <td>${c.area}</td>
                <td>${GrievanceDesk.formatDate(c.dateSubmitted)}</td>
                <td><span class="priority-pill ${c.priority.toLowerCase()}">${c.priority}</span></td>
                <td><span class="status-pill ${c.status.toLowerCase().replace(' ', '-')}">${c.status}</span></td>
                <td>
                    <span class="action-link" onclick="Officer.openDetailPanel('${c.id}')">View Details</span>
                </td>
            `;
            this.tbody.appendChild(row);
        });
    },

    setupEventListeners() {
        this.statusFilter.addEventListener('change', () => this.filterTable());
        this.searchInput.addEventListener('input', () => this.filterTable());
        
        document.getElementById('logout-btn').addEventListener('click', () => GrievanceDesk.logout());
        
        // Panel events
        document.querySelector('.close-panel').addEventListener('click', () => this.closePanel());
        document.getElementById('detail-panel').addEventListener('click', (e) => {
            if (e.target === document.getElementById('detail-panel')) this.closePanel();
        });
        
        document.getElementById('save-update-btn').addEventListener('click', () => this.saveUpdate());
    },

    filterTable() {
        const status = this.statusFilter.value;
        const search = this.searchInput.value.toLowerCase();
        const complaints = GrievanceDesk.getComplaints().filter(c => c.officer === this.user.name);
        
        let filtered = complaints;

        if (status !== 'All') {
            filtered = filtered.filter(c => c.status === status);
        }

        if (search) {
            filtered = filtered.filter(c => 
                c.id.toLowerCase().includes(search) || 
                c.area.toLowerCase().includes(search) ||
                c.description.toLowerCase().includes(search)
            );
        }

        this.renderTable(filtered);
    },

    openDetailPanel(id) {
        this.currentComplaintId = id;
        const complaint = GrievanceDesk.getComplaints().find(c => c.id === id);
        
        document.getElementById('detail-id').innerText = complaint.id;
        document.getElementById('detail-name').innerText = complaint.name;
        document.getElementById('detail-mobile').innerText = complaint.mobile;
        document.getElementById('detail-desc').innerText = complaint.description;
        document.getElementById('detail-area').innerText = complaint.area;
        document.getElementById('detail-date').innerText = GrievanceDesk.formatDate(complaint.dateSubmitted);
        
        // Update status select
        document.getElementById('update-status-select').value = complaint.status === 'Resolved' ? 'Resolved' : 'In Progress';
        
        // Render timeline history
        this.renderPanelTimeline(complaint.timeline);
        
        document.getElementById('detail-panel').classList.add('active');
    },

    closePanel() {
        document.getElementById('detail-panel').classList.remove('active');
    },

    renderPanelTimeline(timeline) {
        const container = document.getElementById('panel-timeline');
        container.innerHTML = '';
        
        [...timeline].reverse().forEach(t => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML = `
                <div class="timeline-dot"></div>
                <div class="timeline-status">${t.status}</div>
                <div class="timeline-info">${t.date} | ${t.time}</div>
                ${t.note ? `<div class="timeline-note">${t.note}</div>` : ''}
            `;
            container.appendChild(item);
        });
    },

    saveUpdate() {
        const note = document.getElementById('update-note').value.trim();
        const status = document.getElementById('update-status-select').value;
        
        if (!note) {
            GrievanceDesk.showToast('Please add a response note', 'error');
            return;
        }

        const complaint = GrievanceDesk.getComplaints().find(c => c.id === this.currentComplaintId);
        
        complaint.status = status;
        complaint.timeline.push({
            status: status,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            note: note
        });

        GrievanceDesk.saveComplaint(complaint);
        GrievanceDesk.showToast('Status updated successfully!');
        
        document.getElementById('update-note').value = '';
        this.loadDashboard();
        this.openDetailPanel(this.currentComplaintId); // Refresh panel
    }
};

document.addEventListener('DOMContentLoaded', () => Officer.init());
window.Officer = Officer;
