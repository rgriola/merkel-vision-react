// Not Found page component
import React from 'react';
import { Container, Box, Typography, Button, Paper } from '@mui/material';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          <Typography variant="h1" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            404
          </Typography>
          
          <Typography variant="h5" component="h2" gutterBottom>
            Page Not Found
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 4 }}>
            The page you are looking for does not exist or has been moved.
          </Typography>
          
          <Button 
            component={Link} 
            to="/" 
            variant="contained" 
            color="primary" 
            size="large"
          >
            Go to Home
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default NotFound;
