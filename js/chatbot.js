/* ===== SETU AI CHATBOT ===== */

const Chatbot = {
    history: [],
    isOpen: false,

    init() {
        this.panel = document.getElementById('chatbot-panel');
        this.toggle = document.getElementById('chatbot-toggle');
        this.closeBtn = document.getElementById('chatbot-close');
        this.messagesDiv = document.getElementById('chatbot-messages');
        this.input = document.getElementById('chatbot-input');
        this.sendBtn = document.getElementById('chatbot-send');

        if (!this.panel) return; // Guard: widget not present

        this.setupEventListeners();
        this.addMessage('bot', "👋 Hi! I'm <strong>Setu</strong>, your AI assistant. I can help you submit complaints, check status, or answer questions about SevaSetu. How can I help?");
        this.addQuickChips(['Check complaint status', 'How to submit?', 'Which department?', 'Expected timeline?']);
    },

    setupEventListeners() {
        this.toggle.addEventListener('click', () => this.togglePanel());
        this.closeBtn.addEventListener('click', () => this.closePanel());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    },

    togglePanel() {
        if (this.isOpen) this.closePanel();
        else this.openPanel();
    },

    openPanel() {
        this.panel.classList.add('active');
        this.toggle.classList.add('active');
        document.getElementById('chatbot-toggle-icon').textContent = '✕';
        this.isOpen = true;
        setTimeout(() => this.input.focus(), 300);
    },

    closePanel() {
        this.panel.classList.remove('active');
        this.toggle.classList.remove('active');
        document.getElementById('chatbot-toggle-icon').textContent = '💬';
        this.isOpen = false;
    },

    addMessage(role, html) {
        const msg = document.createElement('div');
        msg.className = `chat-message ${role}`;
        msg.innerHTML = `
            <div class="chat-bubble">
                ${role === 'bot' ? '<div class="bot-avatar-icon">🤖</div>' : ''}
                <div class="bubble-text">${html}</div>
            </div>
        `;
        this.messagesDiv.appendChild(msg);
        this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
    },

    addQuickChips(chips) {
        const chipsDiv = document.createElement('div');
        chipsDiv.className = 'quick-chips';
        chips.forEach(chip => {
            const btn = document.createElement('button');
            btn.className = 'chip';
            btn.textContent = chip;
            btn.addEventListener('click', () => {
                chipsDiv.remove();
                this.input.value = chip;
                this.sendMessage();
            });
            chipsDiv.appendChild(btn);
        });
        this.messagesDiv.appendChild(chipsDiv);
        this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
    },

    showTyping() {
        const typing = document.createElement('div');
        typing.id = 'typing-indicator';
        typing.className = 'chat-message bot';
        typing.innerHTML = `
            <div class="chat-bubble">
                <div class="bot-avatar-icon">🤖</div>
                <div class="typing-dots"><span></span><span></span><span></span></div>
            </div>
        `;
        this.messagesDiv.appendChild(typing);
        this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
    },

    hideTyping() {
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
    },

    async sendMessage() {
        const text = this.input.value.trim();
        if (!text || this.sendBtn.disabled) return;

        this.addMessage('user', text);
        this.input.value = '';
        this.sendBtn.disabled = true;
        this.showTyping();

        // Add to history
        this.history.push({ role: 'user', text });

        try {
            const data = JSON.parse(localStorage.getItem('gd_data') || '{}');
            const complaints = (data.complaints || []).slice(0, 20);

            const response = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history: this.history.slice(-10),
                    complaints
                })
            });

            this.hideTyping();

            if (response.ok) {
                const result = await response.json();
                const reply = result.reply || "Sorry, I couldn't process that. Please try again.";
                this.addMessage('bot', reply);
                this.history.push({ role: 'model', text: reply });
            } else {
                this.addMessage('bot', "⚠️ I'm having trouble connecting. Please try again in a moment.");
            }
        } catch (error) {
            this.hideTyping();
            this.addMessage('bot', "⚠️ I appear to be offline. Please ensure the backend server is running on port 3000.");
        } finally {
            this.sendBtn.disabled = false;
            this.input.focus();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => Chatbot.init());
