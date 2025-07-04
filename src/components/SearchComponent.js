// Search component for finding addresses on the map
import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  Box, 
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useGoogleMaps } from '../hooks/useGoogleMaps';

const SearchComponent = () => {
  const [address, setAddress] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { mapInitialized, searchPlace } = useGoogleMaps();

  const handleSearch = async (event) => {
    event.preventDefault();
    
    if (!address.trim()) {
      setError('Please enter an address to search');
      return;
    }

    if (!mapInitialized) {
      setError('Map is not yet initialized');
      return;
    }

    setSearching(true);
    setError(null);
    
    try {
      const result = await searchPlace(address);
      console.log('Search result:', result);
      
      // Show success message
      setSuccessMessage(`Found: ${result.address}`);
      setSnackbarOpen(true);
      
      // Clear the search box
      setAddress('');
    } catch (error) {
      console.error('Search error:', error);
      setError(error.message || 'Error searching for address');
    } finally {
      setSearching(false);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <>
      <Box 
        component="form" 
        onSubmit={handleSearch}
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2,
          width: '100%'
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search for address, city, or landmark..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={searching || !mapInitialized}
          error={!!error}
          helperText={error}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mr: 1 }}
        />
        <Button
          variant="contained"
          color="primary"
          type="submit"
          disabled={searching || !mapInitialized}
          sx={{ height: '56px', minWidth: '100px' }}
        >
          {searching ? <CircularProgress size={24} color="inherit" /> : 'Search'}
        </Button>
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

export default SearchComponent;
