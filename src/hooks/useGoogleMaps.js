// Custom hook for Google Maps integration
import { useState, useEffect, useRef } from 'react';
import { googleMapsConfig } from '../config/maps.config';
import mapsService from '../services/maps.service';

export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const mapRef = useRef(null);
  
  // Load Google Maps API
  useEffect(() => {
    // Function to check if Google Maps is fully loaded
    const isGoogleMapsLoaded = () => {
      return Boolean(
        window.google && 
        window.google.maps && 
        window.google.maps.Map && 
        window.google.maps.places
      );
    };

    // If already loaded, just set state
    if (isGoogleMapsLoaded()) {
      console.log('Google Maps API already loaded');
      setIsLoaded(true);
      return;
    }
    
    // Check if the script is already being loaded
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      console.log('Google Maps script is already loading, waiting...');
      
      // Check periodically if Maps is loaded
      const checkInterval = setInterval(() => {
        if (isGoogleMapsLoaded()) {
          console.log('Google Maps API detected as loaded');
          setIsLoaded(true);
          setLoadError(null);
          clearInterval(checkInterval);
        }
      }, 200);
      
      // Also attach to the existing load event
      existingScript.addEventListener('load', () => {
        console.log('Existing Google Maps script load event fired');
      });
      
      return () => clearInterval(checkInterval);
    }
    
    // Create a globally unique callback name to avoid conflicts
    const callbackName = `initGoogleMapsCallback_${Date.now()}`;
    
    // Define the callback function
    window[callbackName] = () => {
      console.log('Google Maps API loaded via callback');
      setIsLoaded(true);
      setLoadError(null);
    };
    
    // Create and add the script
    const script = document.createElement('script');
    script.id = 'google-maps-script'; 
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsConfig.apiKey}&libraries=places&callback=${callbackName}&loading=async`;
    script.async = true;
    script.defer = true;
    
    // Error handling
    script.addEventListener('error', (error) => {
      console.error('Failed to load Google Maps:', error);
      setLoadError(error);
    });
    
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);
  
  // Initialize map when element ref is available
  const initMap = (mapElement) => {
    if (!isLoaded || !mapElement) return false;
    
    mapRef.current = mapElement;
    const success = mapsService.initMap(mapElement);
    setMapInitialized(success);
    return success;
  };

  // Search for places
  const searchPlace = async (address) => {
    if (!mapInitialized) {
      throw new Error('Map not initialized');
    }
    
    return await mapsService.searchPlace(address);
  };

  // Center map on location
  const centerMap = (lat, lng, zoom) => {
    if (!mapInitialized) return false;
    return mapsService.centerMap(lat, lng, zoom);
  };

  // Add a temporary marker
  const addTemporaryMarker = (lat, lng) => {
    if (!mapInitialized) return null;
    return mapsService.addTemporaryMarker(lat, lng);
  };

  // Add location markers
  const addLocationMarker = (location) => {
    if (!mapInitialized) return null;
    return mapsService.addLocationMarker(location);
  };

  // Remove location marker
  const removeLocationMarker = (locationId) => {
    if (!mapInitialized) return false;
    return mapsService.removeLocationMarker(locationId);
  };

  // Show all markers
  const showAllMarkers = () => {
    if (!mapInitialized) return false;
    return mapsService.showAllMarkers();
  };

  // Get location details from coordinates
  const getLocationDetails = async (lat, lng) => {
    if (!mapInitialized) {
      throw new Error('Map not initialized');
    }
    return await mapsService.getLocationDetails(lat, lng);
  };

  // Set up map click handler
  const setMapClickHandler = (callback) => {
    if (!mapInitialized) return;
    mapsService.setMapClickHandler(callback);
  };

  // Set up marker click handler
  const setMarkerClickHandler = (callback) => {
    if (!mapInitialized) return;
    mapsService.setMarkerClickHandler(callback);
  };

  // Initialize PlaceAutocompleteElement
  const initPlaceAutocomplete = (containerElement) => {
    if (!isLoaded || !mapInitialized) return null;
    return mapsService.setupPlaceAutocomplete(containerElement);
  };

  // Set a callback for place selection
  const setPlaceSelectedHandler = (callback) => {
    if (!isLoaded || !mapInitialized) return;
    mapsService.setPlaceSelectedHandler(callback);
  };

  return {
    isLoaded,
    loadError,
    mapInitialized,
    initMap,
    searchPlace,
    centerMap,
    addTemporaryMarker,
    addLocationMarker,
    removeLocationMarker,
    showAllMarkers,
    getLocationDetails,
    setMapClickHandler,
    setMarkerClickHandler,
    initPlaceAutocomplete,
    setPlaceSelectedHandler
  };
};
