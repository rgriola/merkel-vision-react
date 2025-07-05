// Location list component for displaying all locations
import React, { useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  MenuItem,
  Select
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useLocations } from '../contexts/locations.context';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import LocationCard from './LocationCard';

const LocationList = () => {
  const { locations, loading, error, setSelectedLocation, deleteLocation } = useLocations();
  const { centerMap, showAllMarkers } = useGoogleMaps();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  // Filter locations based on search term
  const filteredLocations = locations.filter(location => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (location.name && location.name.toLowerCase().includes(searchLower)) ||
      (location.address && location.address.toLowerCase().includes(searchLower)) ||
      (location.description && location.description.toLowerCase().includes(searchLower))
    );
  });

  // Sort locations based on sort field
  const sortedLocations = [...filteredLocations].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'dateCreated':
        return (
          new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt || 0) -
          new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt || 0)
        );
      case 'dateUpdated':
        return (
          new Date(b.updatedAt?.seconds ? b.updatedAt.seconds * 1000 : b.updatedAt || 0) -
          new Date(a.updatedAt?.seconds ? a.updatedAt.seconds * 1000 : a.updatedAt || 0)
        );
      default:
        return 0;
    }
  });

  // Handle view location on map
  const handleViewLocation = (location) => {
    console.log('View location triggered with:', location);
    setSelectedLocation(location);
    
    // Ensure we have valid coordinates before trying to center the map
    if (location && typeof location.lat !== 'undefined' && typeof location.lng !== 'undefined') {
      // Detailed debug information about lat/lng properties
      console.log('Location lat/lng properties:', {
        lat: {
          value: location.lat,
          type: typeof location.lat,
          isFunction: typeof location.lat === 'function',
          isNumber: typeof location.lat === 'number',
          isString: typeof location.lat === 'string'
        },
        lng: {
          value: location.lng,
          type: typeof location.lng,
          isFunction: typeof location.lng === 'function',
          isNumber: typeof location.lng === 'number',
          isString: typeof location.lng === 'string'
        }
      });
      
      // Check if lat and lng are functions or properties
      const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
      const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
      
      console.log('Centering map on:', { lat, lng });
      
      // Convert to numbers if needed
      const numLat = parseFloat(lat);
      const numLng = parseFloat(lng);
      
      if (isNaN(numLat) || isNaN(numLng)) {
        console.error('Invalid coordinates after conversion:', { lat, lng, numLat, numLng });
        return;
      }
      
      // Force a higher zoom level and add a small delay to ensure map is ready
      setTimeout(() => {
        console.log('Attempting to center map with delay...');
        const success = centerMap(numLat, numLng, 18); // Higher zoom level
        console.log('Center map result:', success);
        
        // If centering failed, try again with a different approach
        if (!success) {
          console.log('First attempt failed, trying again...');
          setTimeout(() => {
            centerMap(numLat, numLng, 16);
          }, 500);
        }
      }, 100);
    } else {
      console.error('Invalid location coordinates:', location);
    }
  };

  // Handle edit location
  const handleEditLocation = (location) => {
    setSelectedLocation(location);
    // Open edit modal/form (will be implemented later)
    console.log('Edit location:', location);
  };

  // Handle delete location
  const handleDeleteLocation = async (location) => {
    if (window.confirm(`Are you sure you want to delete "${location.name || 'this location'}"?`)) {
      try {
        await deleteLocation(location.id);
        // Show all remaining locations on map
        setTimeout(() => showAllMarkers(), 500);
      } catch (error) {
        console.error('Error deleting location:', error);
        alert('Failed to delete location: ' + error.message);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Search and Sort Controls */}
      <Box sx={{ display: 'flex', mb: 2, gap: 2 }}>
        <TextField
          placeholder="Search locations..."
          variant="outlined"
          fullWidth
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl sx={{ minWidth: 150 }} size="small">
          <InputLabel id="sort-by-label">Sort By</InputLabel>
          <Select
            labelId="sort-by-label"
            id="sort-by"
            value={sortBy}
            label="Sort By"
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="dateCreated">Date Created</MenuItem>
            <MenuItem value="dateUpdated">Last Updated</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Location List */}
      {sortedLocations.length === 0 ? (
        <Typography sx={{ p: 2, textAlign: 'center' }}>
          {searchTerm ? 'No locations match your search' : 'No locations found'}
        </Typography>
      ) : (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Showing {sortedLocations.length} of {locations.length} locations
          </Typography>
          
          {sortedLocations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              onView={handleViewLocation}
              onEdit={handleEditLocation}
              onDelete={handleDeleteLocation}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default LocationList;
