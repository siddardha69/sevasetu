/* ===== SUBMIT COMPLAINT LOGIC ===== */

const SubmitPage = {
    init() {
        this.form = document.getElementById('submit-complaint-form');
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.filePreview = document.getElementById('file-preview');
        this.textarea = document.getElementById('complaint-desc');
        
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Textarea character count
        this.textarea.addEventListener('input', (e) => {
            document.getElementById('current-char').innerText = e.target.value.length;
        });

        // Drag and drop events
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => this.dropZone.classList.add('drag-over'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => this.dropZone.classList.remove('drag-over'), false);
        });

        this.dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        });

        this.fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Success card buttons
        document.getElementById('submit-another').addEventListener('click', () => {
            window.location.reload();
        });
    },

    handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
            const maxSize = 5 * 1024 * 1024; // 5MB

            if (!validTypes.includes(file.type)) {
                GrievanceDesk.showToast('Invalid file type. Please upload JPG, PNG or PDF.', 'error');
                return;
            }

            if (file.size > maxSize) {
                GrievanceDesk.showToast('File is too large. Max size is 5MB.', 'error');
                return;
            }

            this.filePreview.innerHTML = `
                <span>📄 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                <span class="remove-file" onclick="SubmitPage.clearFile()">✕</span>
            `;
            this.filePreview.style.display = 'flex';
            document.querySelector('.upload-content').style.display = 'none';
        }
    },

    clearFile() {
        this.fileInput.value = '';
        this.filePreview.style.display = 'none';
        document.querySelector('.upload-content').style.display = 'block';
    },

    handleSubmit() {
        const btn = document.getElementById('submit-btn');
        const spinner = document.getElementById('btn-spinner');
        const btnText = btn.querySelector('.btn-text');

        // Simple validation check
        const name = document.getElementById('citizen-name').value;
        const mobile = document.getElementById('citizen-mobile').value;
        const email = document.getElementById('citizen-email').value;
        const dept = document.getElementById('complaint-dept').value;
        const area = document.getElementById('complaint-area').value;
        const desc = this.textarea.value;

        if (!name || name.length < 2) return this.showError('name', 'Name must be at least 2 characters');
        if (!mobile || !/^[0-9]{10}$/.test(mobile)) return this.showError('mobile', 'Enter a valid 10-digit mobile number');
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return this.showError('email', 'Enter a valid email address');
        if (!dept) return this.showError('dept', 'Please select a department');
        if (!area || area.length < 3) return this.showError('area', 'Area must be at least 3 characters');
        if (!desc || desc.length < 20) return this.showError('desc', 'Description must be at least 20 characters');

        // Loading state
        btn.disabled = true;
        btnText.innerText = 'Submitting...';
        spinner.style.display = 'block';

        setTimeout(() => {
            const complaintID = GrievanceDesk.generateID();
            const today = new Date().toISOString().split('T')[0];
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const newComplaint = {
                id: complaintID,
                name,
                mobile,
                email,
                department: dept,
                area,
                description: desc,
                fileName: this.fileInput.files[0] ? this.fileInput.files[0].name : '',
                status: 'Received',
                priority: 'Medium',
                dateSubmitted: today,
                officer: 'Unassigned',
                timeline: [
                    { status: 'Received', date: today, time: time, note: 'Complaint submitted successfully.' }
                ],
                expectedResolution: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            };

            GrievanceDesk.saveComplaint(newComplaint);

            // Show success state
            document.getElementById('complaint-form-container').style.display = 'none';
            document.getElementById('generated-id').innerText = complaintID;
            document.getElementById('success-card').style.display = 'block';
            
            // Set track link with ID
            document.getElementById('track-btn').href = `track-complaint.html?id=${complaintID}`;
            
            GrievanceDesk.showToast('Complaint submitted successfully!');
        }, 1500);
    },

    showError(id, msg) {
        const errorEl = document.getElementById(`${id}-error`);
        errorEl.innerText = msg;
        const inputEl = document.getElementById(id.includes('citizen') ? `citizen-${id}` : (id === 'dept' ? 'complaint-dept' : (id === 'area' ? 'complaint-area' : 'complaint-desc')));
        inputEl.style.borderColor = 'var(--danger-red)';
        
        setTimeout(() => {
            errorEl.innerText = '';
            inputEl.style.borderColor = 'var(--input-border)';
        }, 3000);
    }
};

document.addEventListener('DOMContentLoaded', () => SubmitPage.init());
