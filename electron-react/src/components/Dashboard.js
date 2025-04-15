import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Grid,
  Button,
  Box,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import { getUserPhotos, uploadPhoto, deletePhoto } from "../services/api";
import PhotoGallery from "./PhotoGallery";
import UploadDialog from "./UploadDialog";
import Chat from "./Chat";

function Dashboard({ user }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
      console.log("Photo data structure:", response);

      // Properly handle response data
      const data = Array.isArray(response) ? response : [];
      setPhotos(data);
    } catch (err) {
      setError("Failed to load photos. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (filename, file) => {
    try {
      console.log("Starting upload for:", filename);
      const newPhoto = await uploadPhoto(user.id, filename, file);
      console.log("Upload successful, received:", newPhoto);

      // More robust response checking
      if (newPhoto) {
        if (newPhoto.id) {
          // Success case - refresh photos
          await fetchPhotos();
          return true;
        } else {
          // Response exists but missing ID
          console.error("Upload response missing ID:", newPhoto);
          setError("Server returned invalid photo data");
          return false;
        }
      } else {
        // No response data at all
        console.error("Empty upload response");
        setError("No response from server");
        return false;
      }
    } catch (err) {
      // Detailed error logging
      console.error("Upload error:", err);
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
        response: err.response,
      });
      setError(`Upload failed: ${err.message || "Unknown error"}`);
      return false;
    }
  };

  const handleDelete = async (photoId) => {
    try {
      await deletePhoto(photoId);
      setPhotos(photos.filter((photo) => photo.id !== photoId));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 4,
            }}
          >
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

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : photos.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="h6">
                You don't have any photos yet. Upload your first photo!
              </Typography>
            </Paper>
          ) : (
            <PhotoGallery photos={photos} onDelete={handleDelete} />
          )}
        </Grid>

        {/* Chat Sidebar */}
        <Grid item xs={12} md={4}>
          <Box
            sx={{ height: "calc(100vh - 100px)", position: "sticky", top: 20 }}
          >
            <Chat />
          </Box>
        </Grid>
      </Grid>

      <UploadDialog
        open={openUploadDialog}
        onClose={() => setOpenUploadDialog(false)}
        onUpload={handleUpload}
      />
    </Container>
  );
}

export default Dashboard;
