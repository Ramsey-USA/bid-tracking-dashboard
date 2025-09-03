// Firebase Configuration - Updated with actual project credentials
const firebaseConfig = {
  apiKey: "AIzaSyD2U74NrzUevCrCqFMmEVfY3AcAxgxK3zs",
  authDomain: "bid-tracking-dashboard.firebaseapp.com",
  projectId: "bid-tracking-dashboard",
  storageBucket: "bid-tracking-dashboard.firebasestorage.app",
  messagingSenderId: "417562558876",
  appId: "1:417562558876:web:4afe9d0effa81299494859",
  measurementId: "G-8VR51HJJG4"
};

try {
  firebase.initializeApp(firebaseConfig);
  console.log('Firebase initialized');
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    console.log('Firebase already initialized');
  } else {
    console.error('Firebase initialization failed:', error);
  }
}

window.firebaseConfig = firebaseConfig;