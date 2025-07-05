// Enhanced search component using the latest Google Places API
import React, { useEffect, useRef, useState } from 'react';
import { 
  Box, 
  Typography,
  Paper,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { useGoogleMaps } from '../hooks/useGoogleMaps';

const PlaceSearchComponent = ({ onPlaceSelected }) => {
  const searchContainerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [searching, setSearching] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // We only need to know if the API is loaded, not if the map is initialized
  const { isLoaded } = useGoogleMaps();

  useEffect(() => {
    // Initialize the PlaceAutocompleteElement when maps API is loaded
    // Note: We don't need to wait for map initialization
    if (isLoaded && searchContainerRef.current) {
      const initializeSearch = async () => {
        setSearching(true);
        try {
          console.log('Initializing PlaceAutocomplete...');
          // Get the maps service instance
          const mapsService = await import('../services/maps.service').then(module => module.default);
          
          // Set up PlaceAutocompleteElement
          const placeAutocomplete = mapsService.setupPlaceAutocomplete(searchContainerRef.current);
          
          if (!placeAutocomplete) {
            console.error('Failed to initialize PlaceAutocomplete element');
            setError('Failed to initialize search component. Please ensure the Google Places API is enabled in your Google Cloud Console.');
            return;
          }
          
          // Register a callback for place selection
          mapsService.setPlaceSelectedHandler((place) => {
            setSuccessMessage(`Found: ${place.address}`);
            setSnackbarOpen(true);
            
            // Pass the selected place to the parent component if a callback is provided
            if (onPlaceSelected) {
              onPlaceSelected(place);
            }
          });
          
          setIsReady(true);
        } catch (err) {
          console.error('Failed to initialize PlaceAutocompleteElement:', err);
          setError(err.message || 'Failed to initialize search');
        } finally {
          setSearching(false);
        }
      };
      
      initializeSearch();
    }
  }, [isLoaded, onPlaceSelected]);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <>
      <Box sx={{ width: '100%', mb: 2 }}>
        {(searching || !isReady) && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        
        {error && (
          <Paper 
            elevation={0}
            sx={{ 
              p: 1, 
              mb: 1,
              backgroundColor: 'error.light',
              color: 'error.contrastText'
            }}
          >
            <Typography variant="body2">
              {error}
            </Typography>
          </Paper>
        )}
        
        <Box 
          ref={searchContainerRef} 
          sx={{ 
            minHeight: '56px',
            '& .gm-style-place-autocomplete-element': {
              width: '100%',
              borderRadius: 1,
              padding: 1
            }
          }}
        />
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          Search for an address, city, or landmark
        </Typography>
      </Box>
      
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PlaceSearchComponent;
