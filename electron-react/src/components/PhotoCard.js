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
    // Use the dedicated image endpoint
    const imageUrl = `http://localhost:8000/api/pictures/${photo.id}/image`;
    console.log('Using API image endpoint:', imageUrl);
    setImgSrc(imageUrl);
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
              
              // Try thumbnail as fallback
              const thumbnailUrl = `http://localhost:8000/api/pictures/${photo.id}/thumbnail`;
              console.log('Trying thumbnail URL:', thumbnailUrl);
              setImgSrc(thumbnailUrl);
              
              // Set up error handler for the thumbnail fallback
              e.target.onerror = () => {
                console.log('Thumbnail also failed, using placeholder');
                setImgSrc('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
              };
            }
          }}
          sx={{ objectFit: 'cover', cursor: 'pointer' }}
          onClick={() => setOpenPreview(true)}
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
            color="primary" 
            onClick={() => setOpenPreview(true)}
            title="View"
          >
            <ZoomInIcon />
          </IconButton>
          <IconButton 
            size="small" 
            color="error" 
            onClick={() => setConfirmDelete(true)}
            title="Delete"
          >
            <DeleteIcon />
          </IconButton>
        </CardActions>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="md">
        <DialogContent sx={{ p: 0 }}>
          <img src={imgSrc} alt={photo.filename} style={{ width: '100%', display: 'block' }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogContent>
          <Typography>Are you sure you want to delete this photo?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

export default PhotoCard;