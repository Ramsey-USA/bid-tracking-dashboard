// Firebase configuration - replace with your actual credentials
const firebaseConfig = {
  apiKey: "AIzaSyD2U74NrzUevCrCqFMmEVfY3AcAxgxK3zs",
  authDomain: "bid-tracking-dashboard.firebaseapp.com",
  projectId: "bid-tracking-dashboard",
  storageBucket: "bid-tracking-dashboard.firebasestorage.app",
  messagingSenderId: "417562558876",
  appId: "1:417562558876:web:4afe9d0effa81299494859",
  measurementId: "G-8VR51HJJG4"
};

// Initialize Firebase with error handling
let firebaseInitialized = false;
try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        firebaseInitialized = true;
        console.log('Firebase initialized successfully');
    } else {
        console.error('Firebase SDK not loaded');
    }
} catch (error) {
    console.error('Firebase initialization failed:', error);
    firebaseInitialized = false;
}

window.firebaseInitialized = firebaseInitialized;