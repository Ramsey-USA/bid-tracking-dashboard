// Authentication Component

class AuthComponent {
    constructor() {
        this.currentUser = null;
        
        // Wait for DOM to be ready before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        // Check if auth container exists
        const authContainer = document.getElementById('authContainer');
        if (!authContainer) {
            console.warn('Auth container not found, continuing without auth UI');
            this.setDemoUser();
            return;
        }

        // For demo purposes, bypass authentication
        this.setDemoUser();
        
        // Hide auth container and show main app
        authContainer.style.display = 'none';
        console.log('Demo mode - authentication bypassed');
    }

    setDemoUser() {
        this.currentUser = {
            uid: 'demo-user',
            email: 'demo@mhconstruction.com',
            displayName: 'Demo User'
        };
    }

    signOut() {
        this.currentUser = null;
        // In a real app, you would redirect to login
        location.reload();
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

// Initialize auth component when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.authComponent = new AuthComponent();
    });
} else {
    window.authComponent = new AuthComponent();
}