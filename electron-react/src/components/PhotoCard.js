import React, { useState } from 'react';
import { Card, CardMedia, CardContent, CardActions, Typography, IconButton, Dialog, DialogContent, DialogActions, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ZoomInIcon from '@mui/icons-material/ZoomIn';

function PhotoCard({ photo, onDelete }) {
  const [openPreview, setOpenPreview] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    onDelete(photo.id);
    setConfirmDelete(false);
  };

  return (
    <>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardMedia
          component="img"
          height="200"
          image={photo.url}
          alt={photo.filename}
          sx={{ objectFit: 'cover', cursor: 'pointer' }}
          onClick={() => setOpenPreview(true)}
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography gutterBottom variant="h6" component="div" noWrap>
            {photo.filename}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Uploaded: {new Date(photo.created_at).toLocaleDateString()}
          </Typography>
        </CardContent>
        <CardActions>
          <IconButton aria-label="view" onClick={() => setOpenPreview(true)}>
            <ZoomInIcon />
          </IconButton>
          <IconButton aria-label="delete" onClick={() => setConfirmDelete(true)}>
            <DeleteIcon />
          </IconButton>
        </CardActions>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="md">
        <DialogContent sx={{ p: 0 }}>
          <img src={photo.url} alt={photo.filename} style={{ width: '100%', display: 'block' }} />
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
    </>
  );
}

export default PhotoCard;