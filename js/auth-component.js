// Authentication Component

class AuthComponent {
    constructor() {
        this.auth = firebase.auth();
        this.currentUser = null;
        this.container = null;
        this.currentMode = 'signin'; // 'signin' or 'signup'
    }

    // Initialize auth state listener
    init() {
        console.log('🔄 Initializing AuthComponent...');
        return new Promise((resolve) => {
            this.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                if (user) {
                    console.log('✅ User signed in:', user.email);
                    this.hideAuthForm();
                    resolve(user);
                } else {
                    console.log('👤 User signed out, showing auth form');
                    this.showAuthForm();
                    resolve(null);
                }
            });
        });
    }

    showAuthForm() {
        if (!this.container) {
            this.createAuthContainer();
            this.bindEvents();
        }
        this.container.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    hideAuthForm() {
        if (this.container) {
            this.container.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
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
            let result;
            if (this.currentMode === 'signin') {
                result = await this.auth.signInWithEmailAndPassword(email, password);
            } else {
                result = await this.auth.createUserWithEmailAndPassword(email, password);
                // Update the display name
                await result.user.updateProfile({ displayName });
            }

            this.clearForm();
            this.hideError();
            console.log('✅ Authentication successful');
        } catch (error) {
            console.error('❌ Auth error:', error);
            let errorMessage = 'An unexpected error occurred. Please try again.';
            
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage = 'Invalid email or password.';
                    break;
                case 'auth/email-already-in-use':
                    errorMessage = 'This email is already registered.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
            }
            
            this.showError(errorMessage);
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

    // Sign out method
    signOut() {
        console.log('🚪 Signing out...');
        return this.auth.signOut();
    }
}

// Create and make available globally
window.AuthComponent = new AuthComponent();
console.log('AuthComponent loaded');