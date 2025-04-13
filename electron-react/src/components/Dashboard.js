import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Button, Box, Paper, CircularProgress, Alert } from '@mui/material';
import { getUserPhotos, uploadPhoto, deletePhoto } from '../services/api';
import PhotoGallery from './PhotoGallery';
import UploadDialog from './UploadDialog';

function Dashboard({ user }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openUploadDialog, setOpenUploadDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPhotos();
    }
  }, [user]);

  const fetchPhotos = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await getUserPhotos(user.id);
      console.log('Photo data structure:', response);
      
      // Properly handle response data
      const data = Array.isArray(response) ? response : [];
      setPhotos(data);
    } catch (err) {
      setError('Failed to load photos. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (filename, file) => {
    try {
      console.log('Starting upload for:', filename);
      const newPhoto = await uploadPhoto(user.id, filename, file);
      console.log('Upload successful, received:', newPhoto);
      
      // Verify newPhoto has expected properties
      if (newPhoto && newPhoto.id) {
        setPhotos([...photos, newPhoto]);
        return true; // Indicate success to the UploadDialog
      } else {
        console.error('Upload response missing expected data:', newPhoto);
        return false;
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Failed to upload: ${err.message || 'Unknown error'}`);
      return false; // Indicate failure to the UploadDialog
    }
  };

  const handleDelete = async (photoId) => {
    try {
      await deletePhoto(photoId);
      setPhotos(photos.filter(photo => photo.id !== photoId));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          My Photos
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => setOpenUploadDialog(true)}
        >
          Upload New Photo
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : photos.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">
            You don't have any photos yet. Upload your first photo!
          </Typography>
        </Paper>
      ) : (
        <PhotoGallery photos={photos} onDelete={handleDelete} />
      )}

      <UploadDialog 
        open={openUploadDialog}
        onClose={() => setOpenUploadDialog(false)}
        onUpload={handleUpload}
      />
    </Container>
  );
}

export default Dashboard;