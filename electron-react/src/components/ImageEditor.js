import React, { useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  CircularProgress
} from '@mui/material';
import FilerobotImageEditor from 'react-filerobot-image-editor';
import { replacePhoto } from '../services/api';

function ImageEditor({ open, onClose, photo, onSave }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editorInstance, setEditorInstance] = useState(null);

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
      // Convert base64 to blob
      const response = await fetch(editedImageObject.imageBase64);
      const blob = await response.blob();
      
      // Create file object
      const file = new File([blob], photo.filename, { 
        type: blob.type,
        lastModified: Date.now()
      });

      // Upload to server
      await replacePhoto(photo.id, file);
      
      // Cleanup and close
      URL.revokeObjectURL(imageSrc);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving image:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
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
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ImageEditor;