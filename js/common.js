/* ===== SEED DATA INITIALIZATION ===== */
const SEED_DATA = {
    complaints: [
        {
            id: "GD-2024-04821",
            name: "Rajesh Sharma",
            mobile: "9876543210",
            email: "rajesh@email.com",
            department: "Water Board",
            area: "Banjara Hills Zone 4",
            description: "No water supply for the past 3 days in our area. Multiple residents affected.",
            fileName: "",
            status: "In Progress",
            priority: "High",
            dateSubmitted: "2025-04-14",
            officer: "Ramesh Kumar",
            timeline: [
                { status: "Received", date: "2025-04-14", time: "09:00 AM", note: "Complaint received" },
                { status: "Assigned", date: "2025-04-15", time: "10:30 AM", note: "Assigned to Ramesh Kumar" },
                { status: "In Progress", date: "2025-04-15", time: "02:00 PM", note: "Officer is investigating the issue" }
            ],
            expectedResolution: "2025-04-16",
            aiData: {
                aiAnalysis: "The citizen reported a complete halt of water supply in Banjara Hills Zone 4 lasting for 3 days. Multiple residents are facing acute water shortage. Requires immediate dispatch of water tankers and pipeline inspection.",
                aiClassification: "Water Board",
                aiClusteringTag: "Water Supply Outage",
                aiPriorityScore: 9,
                aiPriorityLevel: "High"
            }
        },
        {
            id: "GD-2024-04822",
            name: "Priya Patel",
            mobile: "9823456789",
            email: "priya@email.com",
            department: "Electricity",
            area: "Jubilee Hills",
            description: "Frequent power cuts during evening hours. Voltage fluctuations damaging appliances.",
            fileName: "",
            status: "Pending",
            priority: "Medium",
            dateSubmitted: "2025-04-13",
            officer: "Unassigned",
            timeline: [
                { status: "Received", date: "2025-04-13", time: "11:00 AM", note: "Complaint received" }
            ],
            expectedResolution: "2025-04-15",
            aiData: {
                aiAnalysis: "Consistent power cuts reported during evening hours in Jubilee Hills. The voltage fluctuations pose a significant risk to household electrical appliances.",
                aiClassification: "Electricity",
                aiClusteringTag: "Power Fluctuation",
                aiPriorityScore: 6,
                aiPriorityLevel: "Medium"
            }
        },
        {
            id: "GD-2024-04823",
            name: "Amit Kumar",
            mobile: "9123456780",
            email: "amit@email.com",
            department: "Roads & Transport",
            area: "Madhapur",
            description: "Huge potholes on the main road causing traffic congestion and safety hazards.",
            fileName: "",
            status: "Resolved",
            priority: "Low",
            dateSubmitted: "2025-04-12",
            officer: "Anita Verma",
            timeline: [
                { status: "Received", date: "2025-04-12", time: "10:00 AM", note: "Complaint received" },
                { status: "Assigned", date: "2025-04-12", time: "02:00 PM", note: "Assigned to Anita Verma" },
                { status: "In Progress", date: "2025-04-13", time: "09:00 AM", note: "Repair work started" },
                { status: "Resolved", date: "2025-04-14", time: "05:00 PM", note: "Potholes filled and road cleared" }
            ],
            expectedResolution: "2025-04-14",
            aiData: {
                aiAnalysis: "Large potholes identified on the main road in Madhapur. This is leading to traffic bottlenecks and potential safety hazards for commuters.",
                aiClassification: "Roads & Transport",
                aiClusteringTag: "Pothole Repair",
                aiPriorityScore: 4,
                aiPriorityLevel: "Low"
            }
        }
    ],
    officers: [
        { name: "Ramesh Kumar", department: "Water Board", email: "ramesh@gov.in", initials: "RK" },
        { name: "Suresh Singh", department: "Electricity", email: "suresh@gov.in", initials: "SS" },
        { name: "Anita Verma", department: "Roads & Transport", email: "anita@gov.in", initials: "AV" },
        { name: "Deepak Mishra", department: "Municipal Services", email: "deepak@gov.in", initials: "DM" }
    ],
    auth: {
        admin: { email: "admin@gov.in", password: "admin123", name: "System Admin" },
        officer: { email: "officer@gov.in", password: "officer123", name: "Ramesh Kumar", department: "Water Board" }
    }
};

/* ===== CORE UTILITIES ===== */
const GrievanceDesk = {
    CONFIG: {
        API_BASE_URL: 'http://192.168.1.35:3002' // Set to laptop IP for mobile testing on same Wi-Fi
    },
    init() {
        let existingData = localStorage.getItem('gd_data');
        if (!existingData) {
            localStorage.setItem('gd_data', JSON.stringify(SEED_DATA));
        } else {
            // Force update for testing if aiData doesn't exist
            let parsed = JSON.parse(existingData);
            if (parsed.complaints && parsed.complaints.length > 0 && !parsed.complaints[0].aiData) {
                localStorage.setItem('gd_data', JSON.stringify(SEED_DATA));
            }
        }
        this.setupNavbar();
        this.initLoginModals();
        this.initAnimations();
    },

    initLoginModals() {
        let modal = document.getElementById('login-modal');
        
        // Inject modal if missing
        if (!modal) {
            const modalHTML = `
                <div id="login-modal" class="modal-overlay">
                    <div class="modal-card">
                        <div class="modal-header">
                            <h2 id="modal-title">Staff Login</h2>
                            <button class="close-modal">&times;</button>
                        </div>
                        <form id="login-form">
                            <div class="form-group">
                                <label class="label-text">Email Address</label>
                                <input type="email" id="login-email" placeholder="Enter your email" required>
                            </div>
                            <div class="form-group">
                                <label class="label-text">Password</label>
                                <input type="password" id="login-password" placeholder="Enter your password" required>
                            </div>
                            <button type="submit" class="btn-primary" style="width: 100%; margin-top: 10px;">Login</button>
                        </form>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            modal = document.getElementById('login-modal');
        }

        const title = document.getElementById('modal-title');
        const form = document.getElementById('login-form');
        const closeBtn = modal.querySelector('.close-modal');
        const officerBtn = document.getElementById('officer-login-btn');
        const adminBtn = document.getElementById('admin-login-btn');
        
        let currentRole = '';

        if (officerBtn) {
            officerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                currentRole = 'officer';
                if (title) title.innerText = 'Officer Login';
                modal.classList.add('active');
            });
        }

        if (adminBtn) {
            adminBtn.addEventListener('click', (e) => {
                e.preventDefault();
                currentRole = 'admin';
                if (title) title.innerText = 'Admin Login';
                modal.classList.add('active');
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                const data = this.getData();

                if (currentRole === 'admin') {
                    if (email === data.auth.admin.email && password === data.auth.admin.password) {
                        sessionStorage.setItem('gd_user', JSON.stringify({ role: 'admin', name: data.auth.admin.name }));
                        window.location.href = 'admin-dashboard.html?v=3';
                    } else {
                        this.showToast('Invalid admin credentials', 'error');
                    }
                } else {
                    if (email === data.auth.officer.email && password === data.auth.officer.password) {
                        sessionStorage.setItem('gd_user', JSON.stringify({ role: 'officer', name: data.auth.officer.name, department: data.auth.officer.department }));
                        window.location.href = 'officer-dashboard.html?v=3';
                    } else {
                        this.showToast('Invalid officer credentials', 'error');
                    }
                }
            });
        }
    },

    getData() {
        return JSON.parse(localStorage.getItem('gd_data'));
    },

    saveData(data) {
        localStorage.setItem('gd_data', JSON.stringify(data));
    },

    getComplaints() {
        return this.getData().complaints;
    },

    saveComplaint(complaint) {
        const data = this.getData();
        const index = data.complaints.findIndex(c => c.id === complaint.id);
        if (index > -1) {
            data.complaints[index] = complaint;
        } else {
            data.complaints.unshift(complaint);
        }
        this.saveData(data);
    },

    getOfficers() {
        return this.getData().officers;
    },

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container') || this.createToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${type === 'success' ? '✅' : '❌'}</span>
            <span>${message}</span>
        `;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    },

    setupNavbar() {
        const toggle = document.querySelector('.mobile-toggle');
        const links = document.querySelector('.nav-links');
        if (toggle && links) {
            toggle.addEventListener('click', () => {
                links.classList.toggle('active');
            });
        }
    },

    initAnimations() {
        const observerOptions = {
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    },

    formatDate(dateStr) {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(dateStr).toLocaleDateString('en-IN', options);
    },

    generateID() {
        return `GD-2024-${Math.floor(10000 + Math.random() * 90000)}`;
    },

    // Auth Utilities
    checkAuth(role) {
        const user = JSON.parse(sessionStorage.getItem('gd_user'));
        if (!user || user.role !== role) {
            window.location.href = 'index.html';
            return null;
        }
        return user;
    },

    logout() {
        sessionStorage.removeItem('gd_user');
        window.location.href = 'index.html';
    }
};

document.addEventListener('DOMContentLoaded', () => GrievanceDesk.init());
