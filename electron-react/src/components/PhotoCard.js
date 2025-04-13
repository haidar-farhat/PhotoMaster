import React, { useState, useEffect } from 'react';
import { Grid, Card, CardMedia, CardContent, Typography, CardActions, IconButton, Dialog, DialogContent, DialogActions, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import DownloadIcon from '@mui/icons-material/Download';

function PhotoCard({ photo, onDelete, handleDownload }) {
  const [openPreview, setOpenPreview] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const errorRef = React.useRef(false);

  // Set image source when photo changes
  useEffect(() => {
    // Try using the URL directly from the photo object first
    if (photo.url && photo.url.startsWith('http')) {
      console.log('Using URL from photo object:', photo.url);
      setImgSrc(photo.url);
    } else {
      // Fallback to constructed URL
      const imageUrl = `http://localhost:8000/api/pictures/${photo.id}/image`;
      console.log('Using constructed API URL:', imageUrl);
      setImgSrc(imageUrl);
    }
    errorRef.current = false;
  }, [photo]);

  const handleDelete = () => {
    onDelete(photo.id);
    setConfirmDelete(false);
  };

  return (
    <Grid item xs={12} sm={6} md={4} lg={3}>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardMedia
          component="img"
          height="200"
          src={imgSrc}
          alt={photo.filename}
          onError={(e) => {
            if (!errorRef.current) {
              errorRef.current = true;
              console.error('Image failed to load:', imgSrc);
              
              // Try direct storage URL as fallback
              if (photo.path) {
                const storageUrl = `http://localhost:8000/storage/${photo.path}`;
                console.log('Trying direct storage URL:', storageUrl);
                setImgSrc(storageUrl);
                return;
              }
              
              // If no path, use placeholder
              console.log('No path available, using placeholder');
              setImgSrc('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
            }
          }}
          sx={{ objectFit: 'cover', cursor: 'pointer' }}
          onClick={() => setOpenPreview(true)}
        />
        
        {/* Rest of the component remains the same */}
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="body2" noWrap title={photo.filename}>
            {photo.filename}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(photo.created_at).toLocaleDateString()}
          </Typography>
        </CardContent>
        
        {/* Actions remain the same */}
      </Card>

      {/* Dialogs remain the same */}
    </Grid>
  );
}

export default PhotoCard;