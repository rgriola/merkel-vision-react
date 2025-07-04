// Authentication context for managing user state throughout the app
import React, { createContext, useContext, useState, useEffect } from 'react';
import firebaseService from '../services/firebase.service';

// Create the auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize Firebase on component mount
  useEffect(() => {
    try {
      firebaseService.initialize();
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      setError(error.message);
    }
  }, []);

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = firebaseService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Sign in with email and password
  const signIn = async (email, password) => {
    setError(null);
    try {
      const user = await firebaseService.signIn(email, password);
      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Sign up with email and password
  const signUp = async (email, password) => {
    setError(null);
    try {
      const user = await firebaseService.signUp(email, password);
      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    setError(null);
    try {
      await firebaseService.logOut();
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
