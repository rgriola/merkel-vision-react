// Dashboard page component
import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  AppBar, 
  Toolbar, 
  Button, 
  Paper,
  Grid,
  Divider
} from '@mui/material';
import { useAuth } from '../contexts/auth.context';
import { useLocations } from '../contexts/locations.context';

// Components
import MapComponent from '../components/MapComponent';
import PlaceSearchComponent from '../components/PlaceSearchComponent';
import LocationList from '../components/LocationList';
import LocationForm from '../components/LocationForm';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { locations, loading: locationsLoading } = useLocations();
  
  // State for location form
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Handle add new location
  const handleAddLocation = () => {
    setEditingLocation(null);
    setShowLocationForm(true);
  };

  // Handle close location form
  const handleCloseLocationForm = (saved) => {
    setShowLocationForm(false);
    setEditingLocation(null);
    if (saved) {
      console.log('Location saved successfully');
    }
  };

  // Handle place selection from search
  const handlePlaceSelected = (place) => {
    console.log('Place selected from search:', place);
    // Pre-fill the location form with the selected place data
    setEditingLocation({
      name: place.name || '',
      address: place.address || '',
      lat: place.lat,
      lng: place.lng,
      description: '',
      notes: ''
    });
    setShowLocationForm(true);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Merkel Vision
          </Typography>
          {user && (
            <>
              <Typography variant="body1" sx={{ mr: 2 }}>
                {user.email}
              </Typography>
              <Button color="inherit" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Map Section */}
          <Grid sx={{ gridColumn: 'span 12' }}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h5" gutterBottom>
                Location Map
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Location Search (Places API July 2025)
                </Typography>
                <PlaceSearchComponent onPlaceSelected={handlePlaceSelected} />
              </Box>
              <MapComponent />
            </Paper>
          </Grid>

          {/* Locations List Section */}
          <Grid sx={{ gridColumn: 'span 12' }}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">
                  Your Locations ({locationsLoading ? '...' : locations.length})
                </Typography>
                <Button variant="contained" color="primary" onClick={handleAddLocation}>
                  Add New Location
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {locationsLoading ? (
                <Typography>Loading locations...</Typography>
              ) : (
                <LocationList />
              )}
            </Paper>
          </Grid>
        </Grid>
        
        {/* Location Form Modal */}
        <LocationForm
          open={showLocationForm}
          onClose={handleCloseLocationForm}
          location={editingLocation}
        />
      </Container>
    </Box>
  );
};

export default Dashboard;
