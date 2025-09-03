// Firebase Configuration - Updated with actual project credentials
window.firebaseConfig = {
  apiKey: "AIzaSyD2U74NrzUevCrCqFMmEVfY3AcAxgxK3zs",
  authDomain: "bid-tracking-dashboard.firebaseapp.com",
  projectId: "bid-tracking-dashboard",
  storageBucket: "bid-tracking-dashboard.firebasestorage.app",
  messagingSenderId: "417562558876",
  appId: "1:417562558876:web:4afe9d0effa81299494859",
  measurementId: "G-8VR51HJJG4"
};

// Validate that Firebase config is properly loaded
if (typeof window.firebaseConfig === 'object' && window.firebaseConfig.apiKey) {
    console.log('✅ Firebase configuration loaded successfully');
    console.log('Project ID:', window.firebaseConfig.projectId);
} else {
    console.error('❌ Firebase configuration failed to load');
}

// Check if we're in development environment
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    console.log('🔧 Running in development mode');
    
    // Uncomment these lines if you want to use Firebase emulators for local development
    // window.firebaseConfig.useEmulators = true;
}
