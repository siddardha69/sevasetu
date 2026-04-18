/* ===== TRACK COMPLAINT LOGIC ===== */

const TrackPage = {
    init() {
        this.input = document.getElementById('track-input');
        this.btn = document.getElementById('track-btn');
        this.resultsCard = document.getElementById('complaint-card');
        this.noResults = document.getElementById('no-results');
        
        this.setupEventListeners();
        this.checkUrlParams();
    },

    setupEventListeners() {
        this.btn.addEventListener('click', () => this.handleSearch());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
    },

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        if (id) {
            this.input.value = id;
            this.handleSearch();
        }
    },

    handleSearch() {
        const query = this.input.value.trim().toUpperCase();
        if (!query) {
            this.shakeInput();
            return;
        }

        const complaints = GrievanceDesk.getComplaints();
        const complaint = complaints.find(c => c.id === query || c.mobile === query);

        if (complaint) {
            this.displayComplaint(complaint);
        } else {
            this.showNoResults();
        }
    },

    shakeInput() {
        const container = document.getElementById('search-container');
        container.classList.add('shake');
        setTimeout(() => container.classList.remove('shake'), 500);
    },

    displayComplaint(complaint) {
        this.noResults.style.display = 'none';
        this.resultsCard.style.display = 'block';
        
        // Populate basic details
        document.getElementById('display-id').innerText = complaint.id;
        document.getElementById('display-desc').innerText = complaint.description;
        document.getElementById('display-dept').innerText = complaint.department;
        document.getElementById('display-date').innerText = GrievanceDesk.formatDate(complaint.dateSubmitted);
        document.getElementById('display-officer').innerText = complaint.officer;
        document.getElementById('display-resolution').innerText = GrievanceDesk.formatDate(complaint.expectedResolution);
        
        // Status badge
        const badge = document.getElementById('status-badge');
        badge.innerText = `🔄 ${complaint.status}`;
        badge.className = 'status-badge';
        if (complaint.status === 'Resolved') {
            badge.innerText = '✅ Resolved';
            badge.classList.add('resolved');
        }

        // Display AI Insights if available
        const aiSection = document.getElementById('ai-insights-section');
        if (complaint.aiData) {
            aiSection.style.display = 'block';
            document.getElementById('ai-analysis').innerText = complaint.aiData.aiAnalysis || 'N/A';
            document.getElementById('ai-class').innerText = complaint.aiData.aiClassification || 'N/A';
            document.getElementById('ai-cluster').innerText = complaint.aiData.aiClusteringTag || 'N/A';
        } else {
            aiSection.style.display = 'none';
        }

        // Build Timeline
        this.buildTimeline(complaint);
        
        // Scroll to results
        this.resultsCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },

    buildTimeline(complaint) {
        const container = document.getElementById('timeline-container');
        const stages = ['Received', 'Assigned', 'In Progress', 'Resolved'];
        const currentStatus = complaint.status;
        const timelineData = complaint.timeline || [];

        let html = '<div class="timeline-progress" id="progress-bar"></div>';
        
        stages.forEach((stage, index) => {
            const entry = timelineData.find(t => t.status === stage);
            const isCompleted = stages.indexOf(currentStatus) >= index;
            const isActive = currentStatus === stage;
            
            const icon = stage === 'Received' ? '✓' : (stage === 'Assigned' ? '👤' : (stage === 'In Progress' ? '💬' : '✓'));
            
            html += `
                <div class="timeline-step">
                    <div class="step-circle ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}">
                        ${icon}
                    </div>
                    <div class="step-text ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}">${stage}</div>
                    <div class="step-date">${entry ? entry.date : (isCompleted ? 'Done' : 'Pending')}</div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Animate progress bar
        setTimeout(() => {
            const progressBar = document.getElementById('progress-bar');
            const progress = (stages.indexOf(currentStatus) / (stages.length - 1)) * 100;
            progressBar.style.width = `${progress}%`;
        }, 100);
    },

    showNoResults() {
        this.resultsCard.style.display = 'none';
        this.noResults.style.display = 'block';
    }
};

document.addEventListener('DOMContentLoaded', () => TrackPage.init());
