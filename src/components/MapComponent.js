// Google Maps component with location markers
import React, { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import { useLocations } from '../contexts/locations.context';
import { Box, Paper, CircularProgress, Typography } from '@mui/material';

const MapComponent = () => {
  const mapContainerRef = useRef(null);
  const [mapError, setMapError] = useState(null);
  
  // Custom hooks
  const { 
    isLoaded,
    loadError,
    mapInitialized, 
    initMap,
    addLocationMarker,
    showAllMarkers,
    setMapClickHandler,
    setMarkerClickHandler
  } = useGoogleMaps();
  
  const { 
    locations, 
    setSelectedLocation 
  } = useLocations();

  // Initialize map when Google Maps API is loaded
  useEffect(() => {
    if (isLoaded && mapContainerRef.current && !mapInitialized) {
      // Add a small delay to ensure Google Maps is fully initialized
      setTimeout(() => {
        try {
          if (!window.google || !window.google.maps || !window.google.maps.Map) {
            console.error('Google Maps API not fully loaded');
            setMapError('Google Maps API not properly loaded. Please refresh the page.');
            return;
          }
          
          const success = initMap(mapContainerRef.current);
          if (!success) {
            setMapError('Failed to initialize map. Check console for details.');
          }
        } catch (error) {
          console.error('Error initializing map:', error);
          setMapError(`Map initialization error: ${error.message}`);
        }
      }, 500);
    }
  }, [isLoaded, mapInitialized, initMap]);

  // Set up map click handler for adding new locations
  useEffect(() => {
    if (mapInitialized) {
      setMapClickHandler((lat, lng) => {
        console.log('Map clicked:', lat, lng);
        // Handle map click (e.g., show a form to add a new location)
      });
    }
  }, [mapInitialized, setMapClickHandler]);

  // Set up marker click handler for selecting locations
  useEffect(() => {
    if (mapInitialized) {
      setMarkerClickHandler((location) => {
        console.log('Marker clicked:', location);
        setSelectedLocation(location);
      });
    }
  }, [mapInitialized, setMarkerClickHandler, setSelectedLocation]);

  // Add markers for all locations
  useEffect(() => {
    if (mapInitialized && locations.length > 0) {
      // Add markers for each location
      locations.forEach(location => {
        addLocationMarker(location);
      });
      
      // Show all markers
      showAllMarkers();
    }
  }, [mapInitialized, locations, addLocationMarker, showAllMarkers]);

  // Show loading state while map is initializing
  if (!isLoaded) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '500px',
        bgcolor: '#f5f5f5'
      }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading Google Maps...
        </Typography>
      </Box>
    );
  }

  // Show error if map fails to load
  if (loadError || mapError) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '500px',
        bgcolor: '#f5f5f5'
      }}>
        <Typography color="error" variant="body1">
          Error loading map: {loadError?.message || mapError}
        </Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ height: '500px', width: '100%', position: 'relative' }}>
      <div 
        ref={mapContainerRef} 
        style={{ height: '100%', width: '100%' }} 
      />
    </Paper>
  );
};

export default MapComponent;
