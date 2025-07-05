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
    console.log('=== VIEW LOCATION TRIGGERED ===');
    console.log('Raw location object:', location);
    console.log('Location keys:', Object.keys(location));
    
    setSelectedLocation(location);
    
    // Extract coordinates with multiple fallback approaches
    let lat, lng;
    
    // Method 1: Direct access to lat/lng properties
    if (location.lat !== undefined && location.lng !== undefined) {
      lat = typeof location.lat === 'function' ? location.lat() : location.lat;
      lng = typeof location.lng === 'function' ? location.lng() : location.lng;
      console.log('Method 1 - Direct lat/lng:', { lat, lng });
    }
    
    // Method 2: Check for coordinates object
    if ((lat === undefined || lng === undefined) && location.coordinates) {
      lat = location.coordinates.lat || location.coordinates.latitude;
      lng = location.coordinates.lng || location.coordinates.longitude;
      console.log('Method 2 - Coordinates object:', { lat, lng });
    }
    
    // Method 3: Check for latitude/longitude properties
    if ((lat === undefined || lng === undefined)) {
      lat = location.latitude;
      lng = location.longitude;
      console.log('Method 3 - Latitude/longitude:', { lat, lng });
    }
    
    // Method 4: Check for position object
    if ((lat === undefined || lng === undefined) && location.position) {
      lat = location.position.lat || location.position.latitude;
      lng = location.position.lng || location.position.longitude;
      console.log('Method 4 - Position object:', { lat, lng });
    }
    
    console.log('Final extracted coordinates:', { lat, lng, types: { lat: typeof lat, lng: typeof lng } });
    
    // Validate and convert coordinates
    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);
    
    if (isNaN(numLat) || isNaN(numLng)) {
      console.error('❌ Invalid coordinates - cannot convert to numbers:', { 
        lat, lng, numLat, numLng,
        location: location 
      });
      alert('Unable to locate this position on the map. The coordinates may be invalid.');
      return;
    }
    
    // Validate coordinate ranges
    if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
      console.error('❌ Coordinates out of valid range:', { numLat, numLng });
      alert('Invalid coordinates detected. Latitude must be between -90 and 90, longitude between -180 and 180.');
      return;
    }
    
    console.log('✅ Valid coordinates found, centering map...', { numLat, numLng });
    
    // Try to center the map with multiple approaches
    const attemptMapCenter = (attemptNumber = 1) => {
      console.log(`Centering attempt #${attemptNumber}...`);
      const success = centerMap(numLat, numLng, 18);
      console.log(`Attempt #${attemptNumber} result:`, success);
      
      if (!success && attemptNumber < 3) {
        // Try again with different zoom levels
        setTimeout(() => {
          attemptMapCenter(attemptNumber + 1);
        }, 300 * attemptNumber); // Increasing delay
      } else if (!success) {
        console.error('❌ All map centering attempts failed');
        alert('Unable to center the map on this location. Please try again.');
      }
    };
    
    // Add a small delay to ensure map is ready
    setTimeout(() => {
      attemptMapCenter();
    }, 100);
  };

  // Handle edit location
  const handleEditLocation = (location) => {
    console.log('Edit location:', location);
    setSelectedLocation(location);
    // TODO: Open edit modal/form - this needs to be connected to the parent Dashboard component
    // For now, we'll just show an alert
    alert(`Edit functionality for "${location.name || 'this location'}" will be implemented next.`);
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
