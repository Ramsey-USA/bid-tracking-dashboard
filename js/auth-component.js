// Authentication Component

class AuthComponent {
    constructor() {
        this.container = null;
        this.currentMode = 'signin'; // 'signin' or 'signup'
        this.init();
    }

    init() {
        this.createAuthContainer();
        this.bindEvents();
    }

    createAuthContainer() {
        this.container = document.createElement('div');
        this.container.id = 'authContainer';
        this.container.className = 'auth-container';
        this.container.innerHTML = this.getAuthHTML();
        document.body.appendChild(this.container);
    }

    getAuthHTML() {
        return `
            <div class="auth-overlay">
                <div class="auth-modal">
                    <div class="auth-header">
                        <h2>MH Construction</h2>
                        <p>Bid Tracking Dashboard</p>
                    </div>
                    
                    <div class="auth-tabs">
                        <button class="auth-tab active" data-mode="signin">Sign In</button>
                        <button class="auth-tab" data-mode="signup">Sign Up</button>
                    </div>

                    <form class="auth-form" id="authForm">
                        <div class="form-group signup-only" style="display: none;">
                            <label for="authDisplayName">Full Name</label>
                            <input type="text" id="authDisplayName" placeholder="Enter your full name">
                        </div>
                        
                        <div class="form-group">
                            <label for="authEmail">Email</label>
                            <input type="email" id="authEmail" placeholder="Enter your email" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="authPassword">Password</label>
                            <input type="password" id="authPassword" placeholder="Enter your password" required>
                        </div>
                        
                        <div class="form-group signup-only" style="display: none;">
                            <label for="authConfirmPassword">Confirm Password</label>
                            <input type="password" id="authConfirmPassword" placeholder="Confirm your password">
                        </div>

                        <button type="submit" class="auth-submit-btn" id="authSubmitBtn">
                            Sign In
                        </button>
                    </form>

                    <div class="auth-error" id="authError" style="display: none;"></div>
                    
                    <div class="auth-footer">
                        <p class="signin-only">
                            Don't have an account? 
                            <a href="#" class="auth-link" data-mode="signup">Sign up here</a>
                        </p>
                        <p class="signup-only" style="display: none;">
                            Already have an account? 
                            <a href="#" class="auth-link" data-mode="signin">Sign in here</a>
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Tab switching
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('auth-tab') || e.target.classList.contains('auth-link')) {
                e.preventDefault();
                const mode = e.target.dataset.mode;
                this.switchMode(mode);
            }
        });

        // Form submission
        const form = this.container.querySelector('#authForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        // Update tab active state
        this.container.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });

        // Show/hide mode-specific elements
        const signupElements = this.container.querySelectorAll('.signup-only');
        const signinElements = this.container.querySelectorAll('.signin-only');
        
        signupElements.forEach(el => {
            el.style.display = mode === 'signup' ? 'block' : 'none';
        });
        
        signinElements.forEach(el => {
            el.style.display = mode === 'signin' ? 'block' : 'none';
        });

        // Update submit button text
        const submitBtn = this.container.querySelector('#authSubmitBtn');
        submitBtn.textContent = mode === 'signin' ? 'Sign In' : 'Sign Up';

        // Clear form and errors
        this.clearForm();
        this.hideError();
    }

    async handleSubmit() {
        const email = this.container.querySelector('#authEmail').value.trim();
        const password = this.container.querySelector('#authPassword').value;
        const displayName = this.container.querySelector('#authDisplayName').value.trim();
        const confirmPassword = this.container.querySelector('#authConfirmPassword').value;

        // Basic validation
        if (!email || !password) {
            this.showError('Please fill in all required fields.');
            return;
        }

        if (this.currentMode === 'signup') {
            if (!displayName) {
                this.showError('Please enter your full name.');
                return;
            }
            if (password !== confirmPassword) {
                this.showError('Passwords do not match.');
                return;
            }
            if (password.length < 6) {
                this.showError('Password must be at least 6 characters long.');
                return;
            }
        }

        this.showLoading(true);

        try {
            // Check if Firebase service is available
            if (!window.firebaseService || !window.firebaseService.isInitialized) {
                throw new Error('Firebase service not initialized');
            }

            let result;
            if (this.currentMode === 'signin') {
                result = await window.firebaseService.signInWithEmail(email, password);
            } else {
                result = await window.firebaseService.createUserWithEmail(email, password, displayName);
            }

            if (result.success) {
                this.clearForm();
                this.hideError();
                // Authentication state change will be handled by the main app
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            console.error('Auth error:', error);
            this.showError('An unexpected error occurred. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    showError(message) {
        const errorDiv = this.container.querySelector('#authError');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    hideError() {
        const errorDiv = this.container.querySelector('#authError');
        errorDiv.style.display = 'none';
    }

    clearForm() {
        const form = this.container.querySelector('#authForm');
        form.reset();
    }

    showLoading(show) {
        const submitBtn = this.container.querySelector('#authSubmitBtn');
        if (show) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Please wait...';
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = this.currentMode === 'signin' ? 'Sign In' : 'Sign Up';
        }
    }

    show() {
        if (this.container) {
            this.container.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
}

window.AuthComponent = AuthComponent;
console.log('AuthComponent loaded');