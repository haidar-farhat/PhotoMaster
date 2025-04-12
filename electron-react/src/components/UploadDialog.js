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

    // Create preview and prepare base64 data
    const reader = new FileReader();
    reader.onload = () => {
      // The full base64 string with data URI prefix
      const fullBase64 = reader.result;
      // Extract only the base64 data part (remove the data:image/jpeg;base64, prefix)
      const base64Data = fullBase64.split(',')[1];
      setPreview(fullBase64);
      // Store the clean base64 data
      setBase64Image(base64Data);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async () => {
    if (!filename || !file || !base64Image) {
      setError('Please provide a filename and select an image');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Pass the clean base64 data to the upload function
      const success = await onUpload(filename, base64Image);
      if (success) {
        handleClose();
      } else {
        setError('Failed to upload image. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during upload');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // At the top of your component, add this state:
  const [base64Image, setBase64Image] = useState('');
  
  // And in the handleClose function, clear it:
  const handleClose = () => {
    setFilename('');
    setFile(null);
    setPreview('');
    setBase64Image('');
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