/* ===== HOME PAGE LOGIC ===== */

const Home = {
    init() {
        this.initStatsCounter();
        this.initLoginModals();
        this.initCallModal();
    },

    initStatsCounter() {
        const stats = document.querySelectorAll('.stat-number');
        const observerOptions = { threshold: 0.5 };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    const value = parseFloat(target.getAttribute('data-target'));
                    this.animateValue(target, 0, value, 2000);
                    observer.unobserve(target);
                }
            });
        }, observerOptions);

        stats.forEach(stat => observer.observe(stat));
    },

    animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            let current = progress * (end - start) + start;
            
            if (end % 1 !== 0) {
                obj.innerHTML = current.toFixed(1) + (obj.getAttribute('data-target').includes('%') ? '%' : '');
            } else {
                obj.innerHTML = Math.floor(current).toLocaleString() + (obj.getAttribute('data-target').includes('+') ? '+' : '');
            }

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    },

    initLoginModals() {
        const modal = document.getElementById('login-modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('login-form');
        const closeBtn = modal.querySelector('.close-modal');
        
        let currentRole = '';

        document.getElementById('officer-login-btn').addEventListener('click', (e) => {
            e.preventDefault();
            currentRole = 'officer';
            title.innerText = 'Officer Login';
            modal.classList.add('active');
        });

        document.getElementById('admin-login-btn').addEventListener('click', (e) => {
            e.preventDefault();
            currentRole = 'admin';
            title.innerText = 'Admin Login';
            modal.classList.add('active');
        });

        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const data = GrievanceDesk.getData();

            if (currentRole === 'admin') {
                if (email === data.auth.admin.email && password === data.auth.admin.password) {
                    sessionStorage.setItem('gd_user', JSON.stringify({ role: 'admin', name: data.auth.admin.name }));
                    window.location.href = 'admin-dashboard.html?v=3';
                } else {
                    GrievanceDesk.showToast('Invalid admin credentials', 'error');
                }
            } else {
                if (email === data.auth.officer.email && password === data.auth.officer.password) {
                    sessionStorage.setItem('gd_user', JSON.stringify({ role: 'officer', name: data.auth.officer.name, department: data.auth.officer.department }));
                    window.location.href = 'officer-dashboard.html?v=3';
                } else {
                    GrievanceDesk.showToast('Invalid officer credentials', 'error');
                }
            }
        });
    },

    initCallModal() {
        const callBtn = document.querySelector('.btn-call');
        const modal = document.getElementById('call-modal');
        const closeBtn = document.getElementById('close-call-modal');
        const cancelBtn = document.getElementById('cancel-call');
        const submitBtn = document.getElementById('submit-call');
        const phoneInput = document.getElementById('call-phone');
        const btnText = document.getElementById('btn-text');
        const btnLoader = document.getElementById('btn-loader');

        const openPopup = () => modal.classList.add('active');
        const closePopup = () => {
            modal.classList.remove('active');
            phoneInput.value = '';
        };

        callBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openPopup();
        });

        closeBtn.addEventListener('click', closePopup);
        cancelBtn.addEventListener('click', closePopup);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closePopup();
        });

        submitBtn.addEventListener('click', () => this.makeCall(phoneInput, btnText, btnLoader, closePopup));
    },

    async makeCall(phoneInput, btnText, btnLoader, closePopup) {
        const phone = phoneInput.value.trim();
        const phoneRegex = /^\+91\d{10}$/;

        if (!phoneRegex.test(phone)) {
            GrievanceDesk.showToast('Please enter a valid phone number (+91XXXXXXXXXX)', 'error');
            return;
        }

        // Show loading state
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');
        phoneInput.disabled = true;

        try {
            const response = await fetch('http://localhost:3002/call', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });

            const result = await response.json();

            if (response.ok) {
                alert('You will receive a call shortly');
                closePopup();
            } else {
                GrievanceDesk.showToast(result.message || 'Failed to initiate call', 'error');
            }
        } catch (error) {
            console.error('Call Error:', error);
            GrievanceDesk.showToast('Network error. Is the backend server running?', 'error');
        } finally {
            // Reset loading state
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
            phoneInput.disabled = false;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => Home.init());
