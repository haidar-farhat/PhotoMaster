import React, { useState, useEffect } from 'react';
import { Grid, Card, CardMedia, CardContent, Typography, CardActions, IconButton, Dialog, DialogContent, DialogActions, Button, CircularProgress, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import ImageEditor from './ImageEditor';
import { getPhotoThumbnail, getPhotoImage } from '../services/api'; // Import new functions

const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

function PhotoCard({ photo, onDelete, handleDownload }) {
  const [openPreview, setOpenPreview] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imgSrc, setImgSrc] = useState(PLACEHOLDER_IMAGE); // Start with placeholder
  const [loading, setLoading] = useState(true);
  const [previewImgSrc, setPreviewImgSrc] = useState(PLACEHOLDER_IMAGE); // For full-res preview
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [openEditor, setOpenEditor] = useState(false);

  // Fetch thumbnail when photo changes
  useEffect(() => {
    let isMounted = true;
    let objectUrl = null;

    const fetchThumbnail = async () => {
      if (!photo || !photo.id) return;

      setLoading(true);
      setImgSrc(PLACEHOLDER_IMAGE); // Reset to placeholder while loading

      try {
        const blob = await getPhotoThumbnail(photo.id);
        if (isMounted && blob) {
          objectUrl = URL.createObjectURL(blob);
          setImgSrc(objectUrl);
        } else if (isMounted) {
          console.log('Thumbnail fetch returned null, using placeholder for photo ID:', photo.id);
          setImgSrc(PLACEHOLDER_IMAGE);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching thumbnail for photo ID:', photo.id, error);
          setImgSrc(PLACEHOLDER_IMAGE);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchThumbnail();

    // Cleanup function
    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        console.log('Revoked Object URL for photo ID:', photo.id);
      }
    };
  }, [photo]); // Depend on the photo object (or photo.id if stable)

  const handleDelete = () => {
    onDelete(photo.id);
    setConfirmDelete(false);
  };
const openPreviewDialog = async () => {
  setOpenPreview(true);
  if (previewImgSrc === PLACEHOLDER_IMAGE || previewImgSrc !== imgSrc) { // Only fetch full res if not already loaded or different from thumbnail
    setLoadingPreview(true);
    let fullResObjectUrl = null;
    try {
      const blob = await getPhotoImage(photo.id);
      if (blob) {
        fullResObjectUrl = URL.createObjectURL(blob);
        setPreviewImgSrc(fullResObjectUrl);
      } else {
         // If full image fails, use the thumbnail src
         setPreviewImgSrc(imgSrc);
      }
    } catch (error) {
      console.error('Error fetching full image for preview:', error);
      // Fallback to thumbnail src if full image fetch fails
      setPreviewImgSrc(imgSrc);
    } finally {
      setLoadingPreview(false);
      // Clean up previous preview URL if it exists and is different
      if (previewImgSrc && previewImgSrc !== PLACEHOLDER_IMAGE && previewImgSrc !== fullResObjectUrl) {
         URL.revokeObjectURL(previewImgSrc);
      }
    }
  }
};

const closePreviewDialog = () => {
  setOpenPreview(false);
  // Optional: Revoke preview URL immediately on close to save memory,
  // but this means it refetches every time. Decide based on UX preference.
  // if (previewImgSrc && previewImgSrc !== PLACEHOLDER_IMAGE) {
  //   URL.revokeObjectURL(previewImgSrc);
  //   setPreviewImgSrc(PLACEHOLDER_IMAGE);
  // }
};


return (
  <Grid item xs={12} sm={6} md={4} lg={3}>
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0', position: 'relative' }}>
        {loading ? (
          <CircularProgress />
        ) : (
          <CardMedia
            component="img"
            height="200"
            src={imgSrc}
            alt={photo.filename}
            sx={{ objectFit: 'cover', cursor: 'pointer', width: '100%' }}
            onClick={openPreviewDialog}
          />
        )}
        {/* Edit button positioned over the image */}
        {!loading && (
          <IconButton 
            size="small" 
            color="primary"
            onClick={() => setOpenEditor(true)}
            title="Edit"
            sx={{ 
              position: 'absolute', 
              top: 8, 
              right: 8, 
              backgroundColor: 'rgba(255, 255, 255, 0.7)', // Semi-transparent background
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.9)', // More opaque on hover
              }
            }}
          >
            <EditIcon />
          </IconButton>
        )}
      </Box>
        
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
            onClick={openPreviewDialog}
            title="View"
          >
            <ZoomInIcon />
          </IconButton>
          {/* Removed Edit button from here */}
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
      <Dialog open={openPreview} onClose={closePreviewDialog} maxWidth="lg" fullWidth>
         <DialogContent sx={{ p: 0, minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           {loadingPreview ? (
             <CircularProgress />
           ) : (
             <img src={previewImgSrc} alt={photo.filename} style={{ maxWidth: '100%', maxHeight: '80vh', display: 'block' }} />
           )}
         </DialogContent>
         <DialogActions>
           <Button onClick={closePreviewDialog}>Close</Button>
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

      {/* Image Editor Dialog */}
      <ImageEditor 
        open={openEditor} 
        onClose={() => setOpenEditor(false)} 
        photo={photo}
        onSave={() => {
          // Refresh the image after editing
          setImgSrc(PLACEHOLDER_IMAGE);
          setPreviewImgSrc(PLACEHOLDER_IMAGE);
          setLoading(true);
          // Force re-fetch of the image by triggering the useEffect
          const timestamp = new Date().getTime();
          photo.timestamp = timestamp;
        }}
      />
    </Grid>
  );
}

export default PhotoCard;
