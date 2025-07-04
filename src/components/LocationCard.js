// Location card component for displaying individual locations
import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MapIcon from '@mui/icons-material/Map';
import RoomIcon from '@mui/icons-material/Room';

const LocationCard = ({ location, onView, onEdit, onDelete }) => {
  const handleView = () => {
    if (onView) onView(location);
  };

  const handleEdit = () => {
    if (onEdit) onEdit(location);
  };

  const handleDelete = () => {
    if (onDelete) onDelete(location);
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp instanceof Date 
      ? timestamp 
      : new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card sx={{ mb: 2, position: 'relative' }} elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h6" component="div" sx={{ mb: 1 }}>
            {location.name || 'Unnamed Location'}
          </Typography>
          
          <Chip 
            icon={<RoomIcon />} 
            label={`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`} 
            size="small" 
            color="primary" 
            variant="outlined"
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {location.address || 'No address provided'}
        </Typography>
        
        {location.description && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            {location.description}
          </Typography>
        )}
        
        <Divider sx={{ my: 1 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            Created: {formatDate(location.createdAt)}
          </Typography>
          
          {location.updatedAt && (
            <Typography variant="caption" color="text.secondary">
              Updated: {formatDate(location.updatedAt)}
            </Typography>
          )}
        </Box>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Button 
          size="small" 
          startIcon={<MapIcon />} 
          onClick={handleView}
        >
          View on Map
        </Button>
        <IconButton size="small" onClick={handleEdit} color="primary">
          <EditIcon />
        </IconButton>
        <IconButton size="small" onClick={handleDelete} color="error">
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};

export default LocationCard;
