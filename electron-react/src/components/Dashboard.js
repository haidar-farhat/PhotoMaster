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
      console.log('API response:', response); // Log the full response
      
      // Check if response exists and has data property
      const data = response && response.data ? response.data : response;
      console.log('Processed photos data:', data);
      
      setPhotos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load photos. Please try again later.');
      console.error('Error fetching photos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (filename, base64Image) => {
    try {
      // Add some logging to debug
      console.log('Uploading image:', filename);
      console.log('Base64 length:', base64Image.length);
      
      const newPhoto = await uploadPhoto(user.id, filename, base64Image);
      setPhotos([...photos, newPhoto]);
      return true;
    } catch (err) {
      console.error('Upload error:', err);
      return false;
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