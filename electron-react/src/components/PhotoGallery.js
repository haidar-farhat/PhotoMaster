import React from 'react';
import { Grid, Card, CardMedia, CardContent, Typography, CardActions, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';

// Add PhotoCard as a separate component
const PhotoCard = ({ photo, onDelete, handleDownload }) => {
  // In the PhotoCard component
  const [imgSrc, setImgSrc] = React.useState(() => {
    console.log('Photo data:', photo);
    if (photo?.url?.startsWith('http')) return photo.url;
    if (photo?.path) return `http://localhost:8000/storage/${photo.path}?${Date.now()}`;
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  });

  const errorRef = React.useRef(false);

  return (
    <Grid item xs={12} sm={6} md={4} lg={3} key={photo.id}>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardMedia
          component="img"
          height="200"
          src={imgSrc}
          alt={photo.filename}
          onError={() => {
            if (!errorRef.current) {
              errorRef.current = true;
              setImgSrc('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
            }
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
  );
};

function PhotoGallery({ photos, onDelete }) {
  // Image URL construction
  const getImageUrl = (photo) => {
    // Check if the photo has a complete URL already
    if (photo.url && photo.url.startsWith('http')) {
      return photo.url;
    }
    
    // Check if photo has a path property
    if (photo.path) {
      return `http://localhost:8000/storage/${photo.path}`;
    }
    
    // Fallback to the old method
    return `http://localhost:8000/storage/images/${photo.user_id}/${encodeURIComponent(photo.filename)}`;
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