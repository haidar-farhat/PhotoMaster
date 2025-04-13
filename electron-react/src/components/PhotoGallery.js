import React from 'react';
import { Grid } from '@mui/material';
import PhotoCard from './PhotoCard';

function PhotoGallery({ photos, onDelete }) {
  // Image URL construction
  const getImageUrl = (photo) => {
    // Add debugging
    console.log('Processing photo:', photo);
    
    // Check if the photo has a complete URL already
    if (photo.url && photo.url.startsWith('http')) {
      console.log('Using provided URL:', photo.url);
      return photo.url;
    }
    
    // Check if photo has a path property
    if (photo.path) {
      const url = `http://localhost:8000/storage/${photo.path}`;
      console.log('Generated URL from path:', url);
      return url;
    }
    
    // Fallback to the old method
    const fallbackUrl = `http://localhost:8000/storage/users/${photo.user_id}/${encodeURIComponent(photo.filename)}`;
    console.log('Using fallback URL:', fallbackUrl);
    return fallbackUrl;
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
      {photos.map((photo) => {
        // Prepare photo with correct URL for display
        const photoWithUrl = {
          ...photo,
          displayUrl: getImageUrl(photo)
        };
        
        return (
          <PhotoCard 
            key={photo.id}
            photo={photoWithUrl}
            onDelete={onDelete}
            handleDownload={handleDownload}
          />
        );
      })}
    </Grid>
  );
}

export default PhotoGallery;