// Firebase service for handling Firebase initialization and operations
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from '../config/firebase.config';

class FirebaseService {
  constructor() {
    this.app = null;
    this.auth = null;
    this.db = null;
    this.storage = null;
    this.initialized = false;
  }

  // Initialize Firebase
  initialize() {
    if (this.initialized) return;

    try {
      this.app = initializeApp(firebaseConfig);
      this.auth = getAuth(this.app);
      this.db = getFirestore(this.app);
      this.storage = getStorage(this.app);
      this.initialized = true;
      console.log('✅ Firebase initialized successfully');
    } catch (error) {
      console.error('❌ Firebase initialization error:', error);
      throw error;
    }
  }

  // Authentication methods
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    }
  }

  async signUp(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('❌ Sign up error:', error);
      throw error;
    }
  }

  async logOut() {
    try {
      await signOut(this.auth);
      return true;
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
  }

  onAuthStateChange(callback) {
    return onAuthStateChanged(this.auth, callback);
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }

  // Firestore methods for locations
  async getLocations(userId) {
    try {
      const locationsQuery = query(
        collection(this.db, 'locations'), 
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(locationsQuery);
      const locations = [];
      
      querySnapshot.forEach((doc) => {
        locations.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return locations;
    } catch (error) {
      console.error('❌ Error getting locations:', error);
      throw error;
    }
  }

  async addLocation(locationData) {
    try {
      const user = this.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const locationWithUser = {
        ...locationData,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(this.db, 'locations'), locationWithUser);
      return {
        id: docRef.id,
        ...locationWithUser
      };
    } catch (error) {
      console.error('❌ Error adding location:', error);
      throw error;
    }
  }

  async updateLocation(locationId, locationData) {
    try {
      const locationRef = doc(this.db, 'locations', locationId);
      
      const updateData = {
        ...locationData,
        updatedAt: new Date()
      };
      
      await updateDoc(locationRef, updateData);
      return {
        id: locationId,
        ...updateData
      };
    } catch (error) {
      console.error('❌ Error updating location:', error);
      throw error;
    }
  }

  async deleteLocation(locationId) {
    try {
      const locationRef = doc(this.db, 'locations', locationId);
      await deleteDoc(locationRef);
      return true;
    } catch (error) {
      console.error('❌ Error deleting location:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const firebaseService = new FirebaseService();
export default firebaseService;
