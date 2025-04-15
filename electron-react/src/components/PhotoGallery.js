import React from 'react';
import { Grid } from '@mui/material';
import PhotoCard from './PhotoCard';

// Removed handleDownload function
function PhotoGallery({ photos, onDelete }) {

  return (
    <Grid container spacing={2}>
      {photos.map((photo) => (
        <PhotoCard 
          key={photo.id}
          photo={photo}
          onDelete={onDelete}
          // Removed handleDownload prop
        />
      ))}
    </Grid>
  );
}

export default PhotoGallery;
