import React from 'react';
import { Grid } from '@mui/material';
import PhotoCard from './PhotoCard';

function PhotoGallery({ photos, onDelete }) {
  // Function to handle image download
  const handleDownload = (photo) => {
    // Use the direct API endpoint for downloads
    const downloadUrl = `http://localhost:8000/api/pictures/${photo.id}/image`;
    console.log('Downloading from:', downloadUrl);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = photo.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Grid container spacing={2}>
      {photos.map((photo) => (
        <PhotoCard 
          key={photo.id}
          photo={photo}
          onDelete={onDelete}
          handleDownload={handleDownload}
        />
      ))}
    </Grid>
  );
}

export default PhotoGallery;