// Firebase Service Layer for Data Management

class FirebaseService {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
    }

    async getEstimators() {
        const snapshot = await this.db.collection('estimators').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async addEstimator(data) {
        const docRef = await this.db.collection('estimators').add(data);
        return docRef.id;
    }

    async updateEstimator(id, data) {
        await this.db.collection('estimators').doc(id).update(data);
        return true;
    }

    async deleteEstimator(id) {
        await this.db.collection('estimators').doc(id).delete();
        return true;
    }

    async getJobs() {
        const snapshot = await this.db.collection('jobs').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async addJob(data) {
        const docRef = await this.db.collection('jobs').add(data);
        return docRef.id;
    }

    async updateJob(id, data) {
        await this.db.collection('jobs').doc(id).update(data);
        return true;
    }

    async deleteJob(id) {
        await this.db.collection('jobs').doc(id).delete();
        return true;
    }

    async isEstimatorAssigned(id) {
        const snapshot = await this.db.collection('jobs').where('estimator', '==', id).get();
        return !snapshot.empty;
    }
}

window.firebaseService = new FirebaseService();
console.log('FirebaseService loaded');