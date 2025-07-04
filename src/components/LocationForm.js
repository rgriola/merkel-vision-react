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
import { useGoogleMaps } from '../hooks/useGoogleMaps';

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
  const [error, setError] = useState(null);

  // Hooks
  const { addLocation, updateLocation } = useLocations();
  const { searchPlace } = useGoogleMaps();

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
    
    if (!lat || !lng) {
      setError('Location coordinates are required');
      return;
    }
    
    // Convert lat/lng to numbers
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    if (isNaN(latNum) || isNaN(lngNum)) {
      setError('Invalid coordinates');
      return;
    }
    
    const locationData = {
      name,
      address,
      lat: latNum,
      lng: lngNum,
      description,
      notes
    };
    
    setLoading(true);
    setError(null);
    
    try {
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
    }
  };

  // Look up address from coordinates
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
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await searchPlace(`${latNum},${lngNum}`);
      if (result) {
        setAddress(result.address || '');
      }
    } catch (error) {
      console.error('Error looking up address:', error);
      setError('Failed to look up address');
    } finally {
      setLoading(false);
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
      onClose={() => !loading && onClose(false)}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {location ? 'Edit Location' : 'Add New Location'}
        <IconButton
          aria-label="close"
          onClick={() => !loading && onClose(false)}
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
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="lat"
                label="Latitude"
                name="lat"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="lng"
                label="Longitude"
                name="lng"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                disabled={loading}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', mt: 1 }}>
            <TextField
              margin="normal"
              fullWidth
              id="address"
              label="Address"
              name="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={loading}
              sx={{ mr: 1 }}
            />
            <Button
              variant="outlined"
              onClick={handleLookupAddress}
              disabled={loading || !lat || !lng}
              sx={{ mt: 2, minWidth: '120px' }}
            >
              Lookup
            </Button>
          </Box>
          
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
          disabled={loading}
        >
          Clear
        </Button>
        <Button 
          onClick={() => onClose(false)} 
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : (location ? 'Update' : 'Save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationForm;
