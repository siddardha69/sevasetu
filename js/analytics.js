/* ===== AI ANALYTICS DASHBOARD ===== */

const Analytics = {
    charts: {},

    init() {
        this.complaints = GrievanceDesk.getComplaints();
        this.computeStats();
        this.renderKPIs();
        this.renderCharts();
        this.renderTopTags();
        this.generateAIReport();
    },

    computeStats() {
        const c = this.complaints;

        // Department breakdown (use AI classification if available)
        this.deptStats = {};
        c.forEach(comp => {
            const dept = comp.aiData?.aiClassification || comp.department || 'Other';
            this.deptStats[dept] = (this.deptStats[dept] || 0) + 1;
        });

        // Status breakdown
        this.statusStats = {
            'Received': c.filter(x => x.status === 'Received').length,
            'Pending': c.filter(x => x.status === 'Pending').length,
            'In Progress': c.filter(x => x.status === 'In Progress').length,
            'Resolved': c.filter(x => x.status === 'Resolved').length
        };

        // Priority breakdown
        this.priorityStats = {
            'Critical': c.filter(x => (x.aiData?.aiPriorityLevel || x.priority) === 'Critical').length,
            'High': c.filter(x => (x.aiData?.aiPriorityLevel || x.priority) === 'High').length,
            'Medium': c.filter(x => (x.aiData?.aiPriorityLevel || x.priority) === 'Medium').length,
            'Low': c.filter(x => (x.aiData?.aiPriorityLevel || x.priority) === 'Low').length
        };

        // Top cluster tags
        this.tagStats = {};
        c.forEach(comp => {
            const tag = comp.aiData?.aiClusteringTag || 'General';
            this.tagStats[tag] = (this.tagStats[tag] || 0) + 1;
        });

        const resolved = c.filter(x => x.status === 'Resolved').length;
        this.summary = {
            total: c.length,
            resolved,
            pending: c.filter(x => x.status === 'Pending' || x.status === 'Received').length,
            inProgress: c.filter(x => x.status === 'In Progress').length,
            resolutionRate: c.length ? Math.round((resolved / c.length) * 100) : 0,
            highPriority: c.filter(x => ['Critical', 'High'].includes(x.aiData?.aiPriorityLevel || x.priority)).length,
            deptStats: this.deptStats,
            priorityStats: this.priorityStats,
            statusStats: this.statusStats,
            tagStats: this.tagStats
        };
    },

    renderKPIs() {
        const kpis = document.getElementById('analytics-kpis');
        if (!kpis) return;

        kpis.innerHTML = `
            <div class="kpi-card">
                <div class="kpi-icon">📋</div>
                <div class="kpi-value">${this.summary.total}</div>
                <div class="kpi-label">Total Complaints</div>
            </div>
            <div class="kpi-card green">
                <div class="kpi-icon">✅</div>
                <div class="kpi-value">${this.summary.resolutionRate}%</div>
                <div class="kpi-label">Resolution Rate</div>
            </div>
            <div class="kpi-card red">
                <div class="kpi-icon">🚨</div>
                <div class="kpi-value">${this.summary.highPriority}</div>
                <div class="kpi-label">High/Critical Priority</div>
            </div>
            <div class="kpi-card blue">
                <div class="kpi-icon">✔️</div>
                <div class="kpi-value">${this.summary.resolved}</div>
                <div class="kpi-label">Resolved</div>
            </div>
        `;
    },

    renderCharts() {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded');
            return;
        }

        // Department Bar Chart
        const deptCtx = document.getElementById('dept-chart');
        if (deptCtx) {
            if (this.charts.dept) this.charts.dept.destroy();
            const deptLabels = Object.keys(this.deptStats);
            const deptData = Object.values(this.deptStats);
            this.charts.dept = new Chart(deptCtx, {
                type: 'bar',
                data: {
                    labels: deptLabels,
                    datasets: [{
                        label: 'Complaints',
                        data: deptData,
                        backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#ef4444'],
                        borderRadius: 8,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } },
                        x: { grid: { display: false }, ticks: { font: { size: 11 } } }
                    }
                }
            });
        }

        // Status Doughnut Chart
        const statusCtx = document.getElementById('status-chart');
        if (statusCtx) {
            if (this.charts.status) this.charts.status.destroy();
            this.charts.status = new Chart(statusCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(this.statusStats),
                    datasets: [{
                        data: Object.values(this.statusStats),
                        backgroundColor: ['#6366f1', '#f59e0b', '#3b82f6', '#10b981'],
                        borderWidth: 3,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                        legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 }, boxWidth: 12 } }
                    }
                }
            });
        }

        // Priority Bar Chart
        const priorityCtx = document.getElementById('priority-chart');
        if (priorityCtx) {
            if (this.charts.priority) this.charts.priority.destroy();
            this.charts.priority = new Chart(priorityCtx, {
                type: 'bar',
                data: {
                    labels: ['Critical', 'High', 'Medium', 'Low'],
                    datasets: [{
                        label: 'Count',
                        data: [
                            this.priorityStats['Critical'],
                            this.priorityStats['High'],
                            this.priorityStats['Medium'],
                            this.priorityStats['Low']
                        ],
                        backgroundColor: ['#7f1d1d', '#ef4444', '#f59e0b', '#10b981'],
                        borderRadius: 8,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } },
                        y: { grid: { display: false } }
                    }
                }
            });
        }
    },

    renderTopTags() {
        const tagsEl = document.getElementById('top-tags');
        if (!tagsEl) return;

        const sorted = Object.entries(this.tagStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);

        tagsEl.innerHTML = sorted.map(([tag, count]) => `
            <div class="tag-row">
                <span class="tag-name">#${tag}</span>
                <div class="tag-bar-wrap">
                    <div class="tag-bar" style="width: ${Math.min(100, (count / this.summary.total) * 100 * 2.5)}%"></div>
                </div>
                <span class="tag-count">${count}</span>
            </div>
        `).join('');
    },

    async generateAIReport() {
        const reportEl = document.getElementById('ai-report-text');
        if (!reportEl) return;

        reportEl.innerHTML = `<span class="report-loading">✨ Generating AI executive summary...</span>`;

        try {
            const response = await fetch('http://localhost:3000/api/generate-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stats: this.summary })
            });

            if (response.ok) {
                const result = await response.json();
                reportEl.textContent = result.report;
                reportEl.parentElement.classList.add('loaded');
            } else {
                reportEl.textContent = 'AI report temporarily unavailable. Please ensure the backend server is running.';
            }
        } catch (e) {
            reportEl.textContent = '⚠️ Connect the backend server (port 3000) to generate an AI-powered executive summary.';
        }
    }
};
