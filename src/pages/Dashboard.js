// Dashboard page component
import React from 'react';
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
import SearchComponent from '../components/SearchComponent';
import PlaceSearchComponent from '../components/PlaceSearchComponent';
import LocationList from '../components/LocationList';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { locations, loading: locationsLoading } = useLocations();

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h5" gutterBottom>
                Location Map
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Modern Places API (July 2025)
                </Typography>
                <PlaceSearchComponent onPlaceSelected={(place) => console.log('Selected place:', place)} />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Legacy Search (Fallback)
                </Typography>
                <SearchComponent />
              </Box>
              <MapComponent />
            </Paper>
          </Grid>

          {/* Locations List Section */}
          <Grid item xs={12} md={12}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">
                  Your Locations ({locationsLoading ? '...' : locations.length})
                </Typography>
                <Button variant="contained" color="primary">
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
      </Container>
    </Box>
  );
};

export default Dashboard;
