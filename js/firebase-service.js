// Firebase Service Layer for Data Management

class FirebaseService {
    constructor() {
        this.app = null;
        this.auth = null;
        this.db = null;
        this.storage = null;
        this.unsubscribes = [];
        this.onAuthStateChange = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            // Wait for Firebase and config to be loaded with better error checking
            await this.waitForDependencies();

            // Initialize Firebase
            if (!firebase.apps.length) {
                this.app = firebase.initializeApp(window.firebaseConfig);
            } else {
                this.app = firebase.app();
            }
            
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            this.storage = firebase.storage();

            // Set up auth state listener
            this.auth.onAuthStateChanged((user) => {
                if (this.onAuthStateChange) {
                    this.onAuthStateChange(user);
                }
            });

            this.isInitialized = true;
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Firebase initialization error:', error);
            throw error;
        }
    }

    async waitForDependencies() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 100; // Increased attempts
            
            const checkDependencies = () => {
                console.log(`Checking Firebase dependencies, attempt ${attempts + 1}`);
                
                if (typeof firebase !== 'undefined' && 
                    typeof window.firebaseConfig !== 'undefined' &&
                    firebase.apps !== undefined) {
                    console.log('Firebase dependencies loaded successfully');
                    resolve();
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(checkDependencies, 100);
                } else {
                    console.error('Firebase dependencies check failed:', {
                        firebase: typeof firebase,
                        config: typeof window.firebaseConfig,
                        apps: firebase?.apps
                    });
                    reject(new Error('Firebase dependencies failed to load'));
                }
            };
            
            checkDependencies();
        });
    }

    // Authentication Methods
    async signInWithEmail(email, password) {
        try {
            const result = await this.auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async createUserWithEmail(email, password, displayName) {
        try {
            const result = await this.auth.createUserWithEmailAndPassword(email, password);
            
            // Update user profile with display name
            if (displayName) {
                await result.user.updateProfile({ displayName });
            }
            
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            await this.auth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    getCurrentUser() {
        return this.auth?.currentUser;
    }

    // Jobs CRUD Operations
    async getJobs() {
        try {
            const snapshot = await this.db.collection('jobs').orderBy('createdAt', 'desc').get();
            const jobs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            return { success: true, data: jobs };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async addJob(jobData) {
        try {
            const user = this.getCurrentUser();
            if (!user) throw new Error('User not authenticated');

            const docRef = await this.db.collection('jobs').add({
                ...jobData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: user.uid
            });

            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async updateJob(jobId, jobData) {
        try {
            await this.db.collection('jobs').doc(jobId).update({
                ...jobData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async deleteJob(jobId) {
        try {
            await this.db.collection('jobs').doc(jobId).delete();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Real-time subscription for jobs
    subscribeToJobs(callback) {
        const unsubscribe = this.db.collection('jobs')
            .orderBy('createdAt', 'desc')
            .onSnapshot(
                (snapshot) => {
                    const jobs = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    callback(jobs, null);
                },
                (error) => {
                    callback(null, error);
                }
            );
        
        this.unsubscribes.push(unsubscribe);
        return unsubscribe;
    }

    // Estimators CRUD Operations
    async getEstimators() {
        try {
            const snapshot = await this.db.collection('estimators').get();
            const estimators = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            return { success: true, data: estimators };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async addEstimator(estimatorData) {
        try {
            const docRef = await this.db.collection('estimators').add({
                ...estimatorData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // File Upload
    async uploadFile(file, path) {
        try {
            const storageRef = this.storage.ref().child(path + '/' + file.name);
            const snapshot = await storageRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            return { 
                success: true, 
                url: downloadURL,
                path: snapshot.ref.fullPath 
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Cleanup subscriptions
    cleanup() {
        this.unsubscribes.forEach(unsubscribe => unsubscribe());
        this.unsubscribes = [];
    }
}

// Create and expose singleton instance
window.firebaseService = new FirebaseService();