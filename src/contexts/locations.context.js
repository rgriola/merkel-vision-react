// Locations context for managing location data throughout the app
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import firebaseService from '../services/firebase.service';
import { useAuth } from './auth.context';

// Create the locations context
const LocationsContext = createContext();

// Custom hook to use the locations context
export const useLocations = () => {
  const context = useContext(LocationsContext);
  if (!context) {
    throw new Error('useLocations must be used within a LocationsProvider');
  }
  return context;
};

// Locations provider component
export const LocationsProvider = ({ children }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  const { user } = useAuth();

  // Load all locations for the current user
  const loadLocations = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const locationsData = await firebaseService.getLocations(user.uid);
      setLocations(locationsData);
    } catch (error) {
      console.error('Failed to load locations:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load locations when user changes
  useEffect(() => {
    if (user) {
      loadLocations();
    } else {
      // Clear locations when not logged in
      setLocations([]);
      setLoading(false);
    }
  }, [user, loadLocations]);

  // Add a new location
  const addLocation = async (locationData) => {
    setError(null);
    try {
      const newLocation = await firebaseService.addLocation(locationData);
      setLocations(prevLocations => [...prevLocations, newLocation]);
      return newLocation;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Update an existing location
  const updateLocation = async (locationId, locationData) => {
    setError(null);
    try {
      const updatedLocation = await firebaseService.updateLocation(locationId, locationData);
      setLocations(prevLocations => 
        prevLocations.map(location => 
          location.id === locationId ? { ...location, ...updatedLocation } : location
        )
      );
      return updatedLocation;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Delete a location
  const deleteLocation = async (locationId) => {
    setError(null);
    try {
      await firebaseService.deleteLocation(locationId);
      setLocations(prevLocations => 
        prevLocations.filter(location => location.id !== locationId)
      );
      return true;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Context value
  const value = {
    locations,
    loading,
    error,
    selectedLocation,
    setSelectedLocation,
    loadLocations,
    addLocation,
    updateLocation,
    deleteLocation
  };

  return (
    <LocationsContext.Provider value={value}>
      {children}
    </LocationsContext.Provider>
  );
};

export default LocationsContext;
