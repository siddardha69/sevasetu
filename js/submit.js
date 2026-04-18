/* ===== SUBMIT COMPLAINT LOGIC ===== */

const SubmitPage = {
    init() {
        this.form = document.getElementById('submit-complaint-form');
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.filePreview = document.getElementById('file-preview');
        this.textarea = document.getElementById('complaint-desc');
        this.inputTypeRadios = document.querySelectorAll('input[name="input-type"]');
        this.textInputGroup = document.getElementById('text-input-group');
        this.fileInputGroup = document.getElementById('file-input-group');
        this.fileLabel = document.getElementById('file-label');
        this.fileSubText = document.getElementById('file-sub-text');
        
        // Aadhaar Elements
        this.aadhaarContainer = document.getElementById('aadhaar-auth-container');
        this.formContainer = document.getElementById('complaint-form-container');
        this.sendOtpBtn = document.getElementById('send-otp-btn');
        this.verifyOtpBtn = document.getElementById('verify-otp-btn');
        this.aadhaarInput = document.getElementById('aadhaar-number');
        this.otpInput = document.getElementById('aadhaar-otp');
        this.step1 = document.getElementById('aadhaar-step-1');
        this.step2 = document.getElementById('aadhaar-step-2');
        
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

        // Aadhaar logic
        if (this.sendOtpBtn) {
            this.sendOtpBtn.addEventListener('click', () => this.handleSendOtp());
        }
        if (this.verifyOtpBtn) {
            this.verifyOtpBtn.addEventListener('click', () => this.handleVerifyOtp());
        }

        // Input type toggling
        if (this.inputTypeRadios) {
            this.inputTypeRadios.forEach(radio => {
                radio.addEventListener('change', (e) => this.handleInputTypeChange(e.target.value));
            });
        }
    },

    handleInputTypeChange(value) {
        if (value === 'text') {
            this.textInputGroup.style.display = 'block';
            this.fileInputGroup.style.display = 'none';
        } else {
            this.textInputGroup.style.display = 'none';
            this.fileInputGroup.style.display = 'block';
            
            if (value === 'image') {
                this.fileLabel.innerText = 'Upload Image';
                this.fileInput.accept = '.jpg,.jpeg,.png';
                this.fileSubText.innerText = 'JPG, PNG (max 5MB)';
            } else if (value === 'document') {
                this.fileLabel.innerText = 'Upload Scanned Document';
                this.fileInput.accept = '.pdf,.jpg,.jpeg,.png';
                this.fileSubText.innerText = 'PDF, JPG, PNG (max 5MB)';
            }
        }
        this.clearFile();
        this.textarea.value = '';
        document.getElementById('current-char').innerText = '0';
    },

    handleSendOtp() {
        const aadhaar = this.aadhaarInput.value.trim();
        const errorEl = document.getElementById('aadhaar-error');
        
        if (!/^\d{12}$/.test(aadhaar)) {
            errorEl.innerText = 'Please enter a valid 12-digit Aadhaar Number';
            this.aadhaarInput.style.borderColor = 'var(--danger-red)';
            return;
        }

        errorEl.innerText = '';
        this.aadhaarInput.style.borderColor = 'var(--input-border)';
        
        const btnText = this.sendOtpBtn.querySelector('.btn-text');
        const spinner = document.getElementById('otp-spinner');
        
        this.sendOtpBtn.disabled = true;
        btnText.innerText = 'Sending...';
        spinner.style.display = 'block';

        // Mock network delay
        setTimeout(() => {
            this.sendOtpBtn.disabled = false;
            btnText.innerText = 'Send OTP';
            spinner.style.display = 'none';
            
            this.step1.style.display = 'none';
            this.step2.style.display = 'block';
            GrievanceDesk.showToast('OTP sent to your registered mobile number');
        }, 1000);
    },

    handleVerifyOtp() {
        const otp = this.otpInput.value.trim();
        const errorEl = document.getElementById('otp-error');
        
        if (!/^\d{6}$/.test(otp)) {
            errorEl.innerText = 'Please enter a valid 6-digit OTP';
            this.otpInput.style.borderColor = 'var(--danger-red)';
            return;
        }

        errorEl.innerText = '';
        this.otpInput.style.borderColor = 'var(--input-border)';
        
        const btnText = this.verifyOtpBtn.querySelector('.btn-text');
        const spinner = document.getElementById('verify-spinner');
        
        this.verifyOtpBtn.disabled = true;
        btnText.innerText = 'Verifying...';
        spinner.style.display = 'block';

        // Mock network delay
        setTimeout(() => {
            this.verifyOtpBtn.disabled = false;
            btnText.innerText = 'Verify & Proceed';
            spinner.style.display = 'none';
            
            // Success: Hide Aadhaar, Show Complaint Form
            this.aadhaarContainer.style.display = 'none';
            this.formContainer.style.display = 'block';
            GrievanceDesk.showToast('Aadhaar verified successfully!');
        }, 1200);
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

    async handleSubmit() {
        const btn = document.getElementById('submit-btn');
        const spinner = document.getElementById('btn-spinner');
        const btnText = btn.querySelector('.btn-text');

        // Simple validation check
        const name = document.getElementById('citizen-name').value;
        const mobile = document.getElementById('citizen-mobile').value;
        const email = document.getElementById('citizen-email').value;
        const dept = document.getElementById('complaint-dept').value;
        const area = document.getElementById('complaint-area').value;
        
        const inputType = document.querySelector('input[name="input-type"]:checked').value;
        const desc = this.textarea.value;
        const file = this.fileInput.files[0];

        if (!name || name.length < 2) return this.showError('name', 'Name must be at least 2 characters');
        if (!mobile || !/^[0-9]{10}$/.test(mobile)) return this.showError('mobile', 'Enter a valid 10-digit mobile number');
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return this.showError('email', 'Enter a valid email address');
        if (!dept) return this.showError('dept', 'Please select a department');
        if (!area || area.length < 3) return this.showError('area', 'Area must be at least 3 characters');
        
        if (inputType === 'text' && (!desc || desc.length < 20)) {
            return this.showError('desc', 'Description must be at least 20 characters');
        }
        if (inputType !== 'text' && !file) {
            return this.showError('file', 'Please upload a file');
        }

        // Loading state
        btn.disabled = true;
        btnText.innerText = 'Analyzing with AI...';
        spinner.style.display = 'block';

        try {
            let imageBase64 = null;
            let mimeType = null;
            
            if (file) {
                const reader = new FileReader();
                imageBase64 = await new Promise((resolve) => {
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                });
                mimeType = file.type;
            }

            let aiData = {
                aiAnalysis: "Analysis pending. Backend AI service unavailable.",
                aiClassification: dept,
                aiClusteringTag: "General",
                aiPriorityScore: 5,
                aiPriorityLevel: "Medium"
            };

            try {
                // Call Backend AI Endpoint
                const response = await fetch('http://localhost:3000/api/analyze-complaint', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: inputType === 'text' ? desc : '',
                        imageBase64: imageBase64,
                        mimeType: mimeType
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        aiData = result.data;
                    }
                } else {
                    console.warn('AI Endpoint returned non-OK status');
                    GrievanceDesk.showToast('AI Analysis failed, proceeding with defaults', 'error');
                }
            } catch (fetchError) {
                console.error('Fetch to AI endpoint failed:', fetchError);
                GrievanceDesk.showToast('AI Server is down. Saving complaint locally.', 'error');
            }

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
                description: inputType === 'text' ? desc : `[${inputType.toUpperCase()} UPLOADED]`,
                fileName: file ? file.name : '',
                status: 'Received',
                priority: aiData.aiPriorityLevel || 'Medium',
                dateSubmitted: today,
                officer: 'Unassigned',
                aiData: aiData,
                timeline: [
                    { status: 'Received', date: today, time: time, note: 'Complaint submitted successfully.' },
                    { status: 'Analyzed', date: today, time: time, note: `AI Analysis Complete: Priority ${aiData.aiPriorityLevel}` }
                ],
                expectedResolution: new Date(Date.now() + (aiData.aiPriorityLevel === 'High' ? 1 : 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            };

            GrievanceDesk.saveComplaint(newComplaint);

            // Show success state
            document.getElementById('complaint-form-container').style.display = 'none';
            document.getElementById('generated-id').innerText = complaintID;
            document.getElementById('success-card').style.display = 'block';
            
            document.getElementById('track-btn').href = `track-complaint.html?id=${complaintID}`;
            GrievanceDesk.showToast('Complaint submitted successfully!');

        } catch (error) {
            console.error('Fatal Error:', error);
            GrievanceDesk.showToast('A fatal error occurred while processing', 'error');
            btn.disabled = false;
            btnText.innerText = 'Submit Complaint';
            spinner.style.display = 'none';
        }
    },

    showError(id, msg) {
        const errorEl = document.getElementById(`${id}-error`);
        if(errorEl) errorEl.innerText = msg;
        
        let inputEl;
        if(id === 'file') {
            inputEl = document.getElementById('drop-zone');
        } else {
            inputEl = document.getElementById(id.includes('citizen') ? `citizen-${id}` : (id === 'dept' ? 'complaint-dept' : (id === 'area' ? 'complaint-area' : 'complaint-desc')));
        }
        
        if(inputEl) inputEl.style.borderColor = 'var(--danger-red)';
        
        setTimeout(() => {
            if(errorEl) errorEl.innerText = '';
            if(inputEl && id !== 'file') inputEl.style.borderColor = 'var(--input-border)';
            if(inputEl && id === 'file') inputEl.style.borderColor = '#d0d3de';
        }, 3000);
    }
};

document.addEventListener('DOMContentLoaded', () => SubmitPage.init());
