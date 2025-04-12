import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Button, Box, Paper, CircularProgress, Alert } from '@mui/material';
import { getUserPhotos, uploadPhoto, deletePhoto } from '../services/api';
import PhotoCard from './PhotoCard';
import UploadDialog from './UploadDialog';

function Dashboard({ user }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openUploadDialog, setOpenUploadDialog] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, [user]);

  const fetchPhotos = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await getUserPhotos(user.id);
      setPhotos(data);
    } catch (err) {
      setError('Failed to load photos. Please try again later.');
      console.error(err);
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
        <Grid container spacing={3}>
          {photos.map((photo) => (
            <Grid item xs={12} sm={6} md={4} key={photo.id}>
              <PhotoCard photo={photo} onDelete={handleDelete} />
            </Grid>
          ))}
        </Grid>
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