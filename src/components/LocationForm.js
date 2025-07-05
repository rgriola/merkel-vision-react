// Location form component for adding and editing locations
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Grid,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useLocations } from '../contexts/locations.context';
import mapsService from '../services/maps.service';

const LocationForm = ({ open, onClose, location = null }) => {
  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState(null);

  // Hooks
  const { addLocation, updateLocation } = useLocations();

  // Set form values when editing existing location
  useEffect(() => {
    if (location) {
      setName(location.name || '');
      setAddress(location.address || '');
      setLat(location.lat?.toString() || '');
      setLng(location.lng?.toString() || '');
      setDescription(location.description || '');
      setNotes(location.notes || '');
    } else {
      // Reset form when adding a new location
      setName('');
      setAddress('');
      setLat('');
      setLng('');
      setDescription('');
      setNotes('');
    }
  }, [location, open]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!name) {
      setError('Location name is required');
      return;
    }
    
    if (!address) {
      setError('Address is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    let finalLat = lat;
    let finalLng = lng;
    
    try {
      // If coordinates are not provided, geocode the address
      if (!lat || !lng) {
        console.log('📍 Geocoding address:', address);
        setGeocoding(true);
        
        try {
          const geocodeResult = await mapsService.searchPlace(address);
          finalLat = geocodeResult.lat;
          finalLng = geocodeResult.lng;
          
          console.log('✅ Geocoding successful:', { lat: finalLat, lng: finalLng, result: geocodeResult });
          
          // Update the form with the geocoded coordinates
          setLat(finalLat.toString());
          setLng(finalLng.toString());
          
          // If the address was geocoded, use the formatted address from the result
          if (geocodeResult.address) {
            setAddress(geocodeResult.address);
          }
          
          // Store geocoding result for later use in locationData
          window.lastGeocodeResult = geocodeResult;
        } catch (geocodeError) {
          console.error('❌ Geocoding failed:', geocodeError);
          setError(`Could not find location for address "${address}". Please check the address or enter coordinates manually.`);
          return;
        } finally {
          setGeocoding(false);
        }
      } else {
        // Convert existing lat/lng to numbers and validate
        const latNum = parseFloat(finalLat);
        const lngNum = parseFloat(finalLng);
        
        if (isNaN(latNum) || isNaN(lngNum)) {
          setError('Invalid coordinates provided');
          return;
        }
        
        finalLat = latNum;
        finalLng = lngNum;
      }
      
      const locationData = {
        name,
        address,
        lat: parseFloat(finalLat),
        lng: parseFloat(finalLng),
        description,
        notes,
        // Required fields for Firestore rules
        state: window.lastGeocodeResult?.state || '',
        city: window.lastGeocodeResult?.city || '',
        category: 'filming_location', // Default category
        addedBy: 'user' // Default value
      };
      
      // Clean up temporary storage
      delete window.lastGeocodeResult;
      
      console.log('💾 Saving location data:', locationData);
      
      if (location) {
        // Update existing location
        await updateLocation(location.id, locationData);
      } else {
        // Add new location
        await addLocation(locationData);
      }
      
      onClose(true); // Close form with success
    } catch (error) {
      console.error('Error saving location:', error);
      setError(error.message || 'Failed to save location');
    } finally {
      setLoading(false);
      setGeocoding(false);
    }
  };

  // Geocode address to get coordinates
  const handleGeocodeAddress = async () => {
    if (!address) {
      setError('Please enter an address first');
      return;
    }
    
    setGeocoding(true);
    setError(null);
    
    try {
      console.log('📍 Geocoding address:', address);
      const result = await mapsService.searchPlace(address);
      
      if (result) {
        setLat(result.lat.toString());
        setLng(result.lng.toString());
        
        // Update address with formatted version if available
        if (result.address) {
          setAddress(result.address);
        }
        
        console.log('✅ Geocoding successful:', { lat: result.lat, lng: result.lng });
      }
    } catch (error) {
      console.error('❌ Geocoding error:', error);
      setError(`Could not find coordinates for address "${address}". Please check the address.`);
    } finally {
      setGeocoding(false);
    }
  };

  // Look up address from coordinates (reverse geocoding)
  const handleLookupAddress = async () => {
    if (!lat || !lng) {
      setError('Please enter coordinates first');
      return;
    }
    
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    if (isNaN(latNum) || isNaN(lngNum)) {
      setError('Invalid coordinates');
      return;
    }
    
    setGeocoding(true);
    setError(null);
    
    try {
      const result = await mapsService.getLocationDetails(latNum, lngNum);
      if (result) {
        setAddress(result.address || '');
      }
    } catch (error) {
      console.error('Error looking up address:', error);
      setError('Failed to look up address');
    } finally {
      setGeocoding(false);
    }
  };

  // Clear form
  const handleClear = () => {
    setName('');
    setAddress('');
    setLat('');
    setLng('');
    setDescription('');
    setNotes('');
    setError(null);
  };

  return (
    <Dialog
      open={open}
      onClose={() => !loading && !geocoding && onClose(false)}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {location ? 'Edit Location' : 'Add New Location'}
        <IconButton
          aria-label="close"
          onClick={() => !loading && !geocoding && onClose(false)}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        
        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Location Name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
          
          <Box sx={{ display: 'flex', mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="address"
              label="Address"
              name="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={loading}
              sx={{ mr: 1 }}
              helperText="Enter the address and we'll automatically find the coordinates"
            />
            <Button
              variant="outlined"
              onClick={handleGeocodeAddress}
              disabled={loading || geocoding || !address}
              sx={{ mt: 2, minWidth: '120px' }}
            >
              {geocoding ? <CircularProgress size={20} /> : 'Find Coords'}
            </Button>
          </Box>
          
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Coordinates (Optional - will be auto-filled from address)
          </Typography>
          
          <Grid container spacing={2}>
            <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                margin="normal"
                fullWidth
                id="lat"
                label="Latitude"
                name="lat"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                disabled={loading}
                helperText="Auto-filled from address"
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
              <TextField
                margin="normal"
                fullWidth
                id="lng"
                label="Longitude"
                name="lng"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                disabled={loading}
                helperText="Auto-filled from address"
              />
            </Grid>
          </Grid>
          
          <Button
            variant="text"
            size="small"
            onClick={handleLookupAddress}
            disabled={loading || geocoding || !lat || !lng}
            sx={{ mt: 1 }}
          >
            {geocoding ? 'Looking up...' : 'Reverse lookup address from coordinates'}
          </Button>
          
          <TextField
            margin="normal"
            fullWidth
            id="description"
            label="Description"
            name="description"
            multiline
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
          
          <TextField
            margin="normal"
            fullWidth
            id="notes"
            label="Notes"
            name="notes"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
          />
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={handleClear} 
          disabled={loading || geocoding}
        >
          Clear
        </Button>
        <Button 
          onClick={() => onClose(false)} 
          disabled={loading || geocoding}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || geocoding}
        >
          {loading || geocoding ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              {geocoding ? 'Finding Location...' : 'Saving...'}
            </Box>
          ) : (
            location ? 'Update' : 'Save'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationForm;
