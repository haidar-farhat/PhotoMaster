import React, { useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import FilerobotImageEditor from 'react-filerobot-image-editor';
import { replacePhoto } from '../services/api';

function ImageEditor({ open, onClose, photo, onSave }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Load image when dialog opens
  useEffect(() => {
    const fetchImage = async () => {
      if (open && photo) {
        setIsLoading(true);
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:8000/api/pictures/${photo.id}/image`, {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
          });

          if (!response.ok) throw new Error('Failed to load image');
          
          const blob = await response.blob();
          setImageSrc(URL.createObjectURL(blob));
        } catch (error) {
          console.error('Error loading image:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchImage();
  }, [open, photo]);

  const handleSave = async (editedImageObject) => {
    setIsSaving(true);
    try {
      let base64String = editedImageObject.imageBase64;
  
      const convertToJpeg = async (dataURL) => {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = dataURL;
        });
  
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
  
        return canvas.toDataURL('image/jpeg', 0.8);
      };
  
      if (!base64String.startsWith('data:image/jpeg')) {
        base64String = await convertToJpeg(base64String);
      }
  
      if (!base64String.startsWith('data:image/jpeg;base64,')) {
        throw new Error('JPEG conversion failed');
      }
  
      // Validate final image format
      if (!/^data:image\/jpeg;base64,[a-zA-Z0-9+/]+={0,2}$/i.test(base64String)) {
        throw new Error('Invalid image format after conversion');
      }
  
      await replacePhoto(photo.id, base64String);
      
      URL.revokeObjectURL(imageSrc);
      onSave();
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      setError(
        error.response?.data?.message || 
        error.message || 
        'Failed to save image'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { 
            height: '95vh',
            '& .FilerobotImageEditor': {
              height: '100%'
            }
          }
        }}
      >
        <DialogTitle>
          Editing: {photo?.filename}
          {isSaving && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0, height: '100%' }}>
          {isLoading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%' 
            }}>
              <CircularProgress />
            </div>
          ) : (
            imageSrc && (
              <FilerobotImageEditor
                source={imageSrc}
                onSave={handleSave}
                onClose={onClose}
                onBeforeSave={(editedImageObject) => false} // Prevent default save
                config={{
                  tools: ['adjust', 'filter', 'effects', 'rotate', 'crop', 'resize', 'text'],
                  translations: {
                    en: {
                      'toolbar.download': 'Save'
                    }
                  },
                  theme: {
                    primary: '#2196f3',
                    white: '#ffffff'
                  },
                  reduceBeforeEdit: { 
                    mode: 'auto',
                    maxSize: { width: 1920, height: 1080 }
                  }
                }}
              />
            )
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} color="primary" disabled={isSaving}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}

export default ImageEditor;