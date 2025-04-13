import React from 'react';
import { Grid, Card, CardMedia, CardContent, Typography, CardActions, Button, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';

function PhotoGallery({ photos, onDelete }) {
  // Image URL construction
  const getImageUrl = (photo) => {
    // Make sure we're using the correct URL format for Laravel storage
    const url = `http://localhost:8000/storage/images/${photo.user_id}/${encodeURIComponent(photo.filename)}`;
    console.log('Requesting image from:', url);
    return url;
  };

  // Function to handle image download
  const handleDownload = (photo) => {
    const link = document.createElement('a');
    link.href = getImageUrl(photo);
    link.download = photo.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Grid container spacing={2}>
      {photos.map((photo) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={photo.id}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardMedia
              component="img"
              height="200"
              image={getImageUrl(photo)}
              alt={photo.filename}
              onError={(e) => {
                console.error("Image failed to load:", getImageUrl(photo));
                e.target.src = '/placeholder.png'; // Fallback image
              }}
              sx={{ objectFit: 'cover' }}
            />
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="body2" noWrap title={photo.filename}>
                {photo.filename}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(photo.created_at).toLocaleDateString()}
              </Typography>
            </CardContent>
            <CardActions>
              <IconButton 
                size="small" 
                color="primary" 
                onClick={() => handleDownload(photo)}
                title="Download"
              >
                <DownloadIcon />
              </IconButton>
              <IconButton 
                size="small" 
                color="error" 
                onClick={() => onDelete(photo.id)}
                title="Delete"
              >
                <DeleteIcon />
              </IconButton>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export default PhotoGallery;