import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  CardActions,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import EditIcon from "@mui/icons-material/Edit";
import EnhancedImageEditor from "./ImageEditor";
import {
  getPhotoThumbnail,
  getPhotoImage,
  replacePhoto,
} from "../services/api";

const PLACEHOLDER_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

function PhotoCard({ photo, onDelete }) {
  const [openPreview, setOpenPreview] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imgSrc, setImgSrc] = useState(PLACEHOLDER_IMAGE);
  const [loading, setLoading] = useState(true);
  const [previewImgSrc, setPreviewImgSrc] = useState(PLACEHOLDER_IMAGE);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [openEditor, setOpenEditor] = useState(false);
  const [imageVersion, setImageVersion] = useState(Date.now());
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let objectUrl = null;

    const fetchThumbnail = async () => {
      if (!photo?.id) return;

      setLoading(true);
      setImgSrc(PLACEHOLDER_IMAGE);

      try {
        const blob = await getPhotoThumbnail(photo.id, imageVersion);
        if (isMounted && blob) {
          if (imgSrc && imgSrc !== PLACEHOLDER_IMAGE) {
            URL.revokeObjectURL(imgSrc);
          }
          objectUrl = URL.createObjectURL(blob);
          setImgSrc(objectUrl);
        } else if (isMounted) {
          setImgSrc(PLACEHOLDER_IMAGE);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching thumbnail:", error);
          setImgSrc(PLACEHOLDER_IMAGE);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchThumbnail();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [photo, imageVersion]);

  const handleDelete = () => {
    onDelete(photo.id);
    setConfirmDelete(false);
  };

  const openPreviewDialog = async () => {
    setOpenPreview(true);
    if (previewImgSrc === PLACEHOLDER_IMAGE || previewImgSrc !== imgSrc) {
      setLoadingPreview(true);
      let fullResObjectUrl = null;
      try {
        const blob = await getPhotoImage(photo.id, imageVersion);
        if (blob) {
          fullResObjectUrl = URL.createObjectURL(blob);
          setPreviewImgSrc(fullResObjectUrl);
        } else {
          setPreviewImgSrc(imgSrc);
        }
      } catch (error) {
        console.error("Error fetching full image:", error);
        setPreviewImgSrc(imgSrc);
      } finally {
        setLoadingPreview(false);
        if (
          previewImgSrc &&
          previewImgSrc !== PLACEHOLDER_IMAGE &&
          previewImgSrc !== fullResObjectUrl
        ) {
          URL.revokeObjectURL(previewImgSrc);
        }
      }
    }
  };

  const closePreviewDialog = () => {
    setOpenPreview(false);
  };

  const handleEditClick = async () => {
    setLoadingPreview(true);
    try {
      const blob = await getPhotoImage(photo.id, imageVersion);
      if (blob) {
        const newUrl = URL.createObjectURL(blob);
        if (previewImgSrc && previewImgSrc !== PLACEHOLDER_IMAGE) {
          URL.revokeObjectURL(previewImgSrc);
        }
        setPreviewImgSrc(newUrl);
        setOpenEditor(true);
      } else {
        setError("Failed to load image for editing");
      }
    } catch (error) {
      console.error("Error loading image for editing:", error);
      setError("Error loading image for editing");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleEditorSave = async (updatedPhoto) => {
    setIsSaving(true);
    try {
      // Force refresh images by updating the version
      setImageVersion(Date.now());

      // Reset preview image to force a refetch
      if (previewImgSrc && previewImgSrc !== PLACEHOLDER_IMAGE) {
        URL.revokeObjectURL(previewImgSrc);
        setPreviewImgSrc(PLACEHOLDER_IMAGE);
      }

      console.log("Image updated successfully:", updatedPhoto);
    } catch (error) {
      console.error("Error handling editor save:", error);
      setError("Failed to update image");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <Grid item xs={12} sm={6} md={4} lg={3}>
      <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Box
          sx={{
            height: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f0f0f0",
            position: "relative",
          }}
        >
          {loading ? (
            <CircularProgress />
          ) : (
            <CardMedia
              component="img"
              height="200"
              src={imgSrc}
              alt={photo.filename}
              sx={{ objectFit: "cover", cursor: "pointer", width: "100%" }}
              onClick={openPreviewDialog}
            />
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
            onClick={handleEditClick}
            title="Edit"
            disabled={loadingPreview}
          >
            {loadingPreview ? <CircularProgress size={24} /> : <EditIcon />}
          </IconButton>
          <IconButton
            size="small"
            color="primary"
            onClick={openPreviewDialog}
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
      <Dialog
        open={openPreview}
        onClose={closePreviewDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent
          sx={{
            p: 0,
            minHeight: "300px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loadingPreview ? (
            <CircularProgress />
          ) : (
            <img
              src={previewImgSrc}
              alt={photo.filename}
              style={{ maxWidth: "100%", maxHeight: "80vh", display: "block" }}
            />
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
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Editor Dialog */}
      <EnhancedImageEditor
        open={openEditor}
        onClose={() => {
          setOpenEditor(false);
          if (previewImgSrc && previewImgSrc !== PLACEHOLDER_IMAGE) {
            URL.revokeObjectURL(previewImgSrc);
            setPreviewImgSrc(PLACEHOLDER_IMAGE);
          }
        }}
        photo={photo}
        onSave={handleEditorSave}
      />

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
      >
        <Alert
          onClose={handleCloseError}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Grid>
  );
}

export default PhotoCard;
