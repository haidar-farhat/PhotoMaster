import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import FilerobotImageEditor from "react-filerobot-image-editor";
import { replacePhoto } from "../services/api";

function ImageEditor({ open, onClose, photo, onSave }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [currentEditedImage, setCurrentEditedImage] = useState(null);

  useEffect(() => {
    const fetchImage = async () => {
      if (open && photo) {
        setIsLoading(true);
        setError(null);

        try {
          const token = localStorage.getItem("token");
          const url = `http://localhost:8000/api/pictures/${
            photo.id
          }/image?v=${new Date().getTime()}`;
          const response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache",
            },
            credentials: "include",
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `Failed to load image: ${response.status} ${response.statusText} - ${errorText}`
            );
          }

          const blob = await response.blob();
          setImageSrc(URL.createObjectURL(blob));
        } catch (error) {
          setError("Failed to load image: " + error.message);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [open, photo]);

  const handleSave = async (editedImageObject) => {
    try {
      setIsSaving(true);
      setError(null);

      // Validate editor output
      if (!editedImageObject || !editedImageObject.canvas) {
        throw new Error("Editor returned empty image data");
      }

      // Check if this is a test save or a real edit
      const isTestSave = editedImageObject.name === "test-image";

      // For test save, use the test image directly
      if (isTestSave) {
        console.log("Using test image for save operation");
        const testBase64 =
          "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAAAAADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDl6KKK/9k=";
        const response = await replacePhoto(photo.id, testBase64.split(",")[1]);
        onSave(response.data);
        onClose();
        return;
      }

      // Convert canvas to Blob for validation with proper quality setting
      const blob = await new Promise((resolve) =>
        editedImageObject.canvas.toBlob(resolve, "image/jpeg", 0.92)
      );

      // Validate blob contents
      if (!blob || blob.size < 1024) {
        console.warn("Small image generated, size:", blob?.size);
      }

      // Verify the blob is a valid JPEG image
      if (blob.type !== "image/jpeg") {
        throw new Error("Generated image is not a valid JPEG");
      }

      // Convert to base64 with validation
      const reader = new FileReader();
      const base64Data = await new Promise((resolve, reject) => {
        reader.onload = () => {
          try {
            const data = reader.result.split(",")[1];
            if (!data || data.length < 100) {
              reject(new Error("Base64 conversion failed"));
            }
            resolve(data);
          } catch (error) {
            reject(new Error("Error processing image data: " + error.message));
          }
        };
        reader.onerror = () => reject(new Error("File read error"));
        reader.readAsDataURL(blob);
      });

      // Send validated data
      console.log(
        "Sending edited image to server, base64 length:",
        base64Data.length
      );
      const response = await replacePhoto(photo.id, base64Data);
      onSave(response.data);
      onClose();
    } catch (error) {
      setError(error.message || "Failed to save image");
      console.error("Editor Output Validation Failed:", {
        error,
        blobSize: editedImageObject?.canvas
          ? (
              await new Promise((resolve) =>
                editedImageObject.canvas.toBlob(resolve, "image/jpeg", 0.92)
              )
            )?.size
          : undefined,
        canvas: !!editedImageObject?.canvas,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const processImageForBackend = async (dataURL) => {
    const base64Data = dataURL.split(",")[1];
    if (!base64Data) throw new Error("Invalid image format");

    const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(
      (res) => res.blob()
    );

    if (!blob.type.startsWith("image/jpeg")) {
      throw new Error("Invalid image format - must be JPEG");
    }

    const dimensions = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(blob);
    });

    if (!dimensions || dimensions.width < 10 || dimensions.height < 10) {
      throw new Error("Invalid image dimensions");
    }

    return base64Data;
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
            height: "95vh",
            "& .FilerobotImageEditor": {
              height: "100%",
            },
          },
        }}
      >
        <DialogTitle>
          Editing: {photo?.filename}
          {isSaving && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0, height: "100%" }}>
          {isLoading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <CircularProgress />
            </div>
          ) : (
            imageSrc && (
              <FilerobotImageEditor
                source={imageSrc}
                onSave={(editedImageObject) => {
                  setCurrentEditedImage(editedImageObject);
                  handleSave(editedImageObject);
                }}
                onClose={onClose}
                onBeforeSave={(editedImageObject) => {
                  console.log(
                    "Before save callback received edited object:",
                    Object.keys(editedImageObject)
                  );
                  // Store the edited image object for the Save Changes button
                  setCurrentEditedImage(editedImageObject);
                  return false;
                }}
                config={{
                  defaultSavedImageType: "jpeg",
                  defaultSavedImageQuality: 0.92,
                  forceToPngInEllipticalCrop: false,
                  tools: [
                    "adjust",
                    "filter",
                    "effects",
                    "rotate",
                    "crop",
                    "resize",
                  ],
                  imageState: {
                    quality: 100,
                  },
                  translations: {
                    en: {
                      "toolbar.download": "Save as JPEG",
                    },
                  },
                }}
              />
            )
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} color="primary" disabled={isSaving}>
            Cancel
          </Button>

          {process.env.NODE_ENV !== "production" && (
            <Button
              onClick={() => {
                setIsSaving(true);
                const debugBase64 =
                  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAAAAADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDl6KKK/9k=";
                replacePhoto(photo.id, debugBase64.split(",")[1])
                  .then((response) => {
                    console.log("Debug image saved successfully:", response);
                    onSave(response.data);
                    onClose();
                  })
                  .catch((error) => {
                    setError(
                      "Debug save failed: " + (error.message || "Unknown error")
                    );
                    setIsSaving(false);
                  });
              }}
              color="secondary"
              disabled={isSaving}
            >
              Test Save
            </Button>
          )}

          <Button
            onClick={() => {
              if (currentEditedImage?.canvas) {
                handleSave(currentEditedImage);
              } else {
                setError("No edited image to save");
              }
            }}
            color="primary"
            disabled={isSaving || !currentEditedImage?.canvas}
            variant="contained"
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

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
    </>
  );
}

export default ImageEditor;
