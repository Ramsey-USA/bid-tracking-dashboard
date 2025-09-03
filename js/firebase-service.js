// Firebase Service Layer for Data Management

class FirebaseService {
    static isAvailable() {
        return window.firebaseInitialized && typeof firebase !== 'undefined';
    }

    static async getJobs() {
        if (this.isAvailable()) {
            try {
                const snapshot = await firebase.firestore().collection('jobs').get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error('Error fetching jobs from Firebase:', error);
                console.warn('Falling back to local storage');
                return this.getLocalJobs();
            }
        } else {
            return this.getLocalJobs();
        }
    }

    static getLocalJobs() {
        const jobs = localStorage.getItem('mhc_jobs_backup');
        return jobs ? JSON.parse(jobs) : [];
    }

    static async addJob(jobData) {
        const job = {
            ...jobData,
            createdAt: new Date().toISOString(),
            id: Date.now().toString()
        };

        if (this.isAvailable()) {
            try {
                const docRef = await firebase.firestore().collection('jobs').add(job);
                return { id: docRef.id, ...job };
            } catch (error) {
                console.error('Error adding job to Firebase:', error);
                console.warn('Saving to local storage instead');
                return job;
            }
        } else {
            return job;
        }
    }

    static async updateJob(id, jobData) {
        if (this.isAvailable()) {
            try {
                await firebase.firestore().collection('jobs').doc(id).update(jobData);
                return { id, ...jobData };
            } catch (error) {
                console.error('Error updating job in Firebase:', error);
                return { id, ...jobData };
            }
        } else {
            return { id, ...jobData };
        }
    }

    static async deleteJob(id) {
        if (this.isAvailable()) {
            try {
                await firebase.firestore().collection('jobs').doc(id).delete();
            } catch (error) {
                console.error('Error deleting job from Firebase:', error);
            }
        }
        // For local storage, deletion is handled in the main app
    }

    static async getEstimators() {
        if (this.isAvailable()) {
            try {
                const snapshot = await firebase.firestore().collection('estimators').get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error('Error fetching estimators from Firebase:', error);
                return this.getDefaultEstimators();
            }
        } else {
            return this.getDefaultEstimators();
        }
    }

    static getDefaultEstimators() {
        return [
            { id: '1', name: 'John Smith', email: 'john@mhconstruction.com' },
            { id: '2', name: 'Sarah Johnson', email: 'sarah@mhconstruction.com' },
            { id: '3', name: 'Mike Davis', email: 'mike@highdesertdrywall.com' },
            { id: '4', name: 'Lisa Wilson', email: 'lisa@mhconstruction.com' }
        ];
    }
}

window.FirebaseService = FirebaseService;
console.log('FirebaseService loaded');