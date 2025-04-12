import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Alert, CircularProgress } from '@mui/material';

function UploadDialog({ open, onClose, onUpload }) {
  const [filename, setFilename] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Auto-fill filename from file
    if (!filename) {
      setFilename(selectedFile.name);
    }

    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async () => {
    if (!filename || !file) {
      setError('Please provide a filename and select an image');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await onUpload(filename, preview);
      if (success) {
        handleClose();
      } else {
        setError('Failed to upload image. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during upload');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFilename('');
    setFile(null);
    setPreview('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload New Photo</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <TextField
          margin="normal"
          required
          fullWidth
          label="Filename"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          disabled={loading}
        />
        
        <Box sx={{ mt: 2 }}>
          <input
            accept="image/*"
            type="file"
            id="upload-photo"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            disabled={loading}
          />
          <label htmlFor="upload-photo">
            <Button variant="outlined" component="span" disabled={loading}>
              Select Image
            </Button>
          </label>
        </Box>
        
        {preview && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <img 
              src={preview} 
              alt="Preview" 
              style={{ maxWidth: '100%', maxHeight: '200px' }} 
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading || !file}
        >
          {loading ? <CircularProgress size={24} /> : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default UploadDialog;