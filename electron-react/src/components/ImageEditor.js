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

  // Load image when dialog opens
  useEffect(() => {
    const fetchImage = async () => {
      if (open && photo) {
        setIsLoading(true);
        setError(null);

        try {
          console.log("Fetching image for editing, ID:", photo.id);
          const token = localStorage.getItem("token");

          // Add cache-busting parameter and better error handling
          const url = `http://localhost:8000/api/pictures/${
            photo.id
          }/image?v=${new Date().getTime()}`;
          console.log("Fetching from URL:", url);

          const response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache", // Prevent browser caching
            },
            credentials: "include",
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `Failed to load image: ${response.status} ${response.statusText} - ${errorText}`
            );
          }

          const contentType = response.headers.get("content-type");
          console.log("Image content type:", contentType);

          if (!contentType || !contentType.includes("image/")) {
            throw new Error(
              `Invalid content type: ${contentType || "unknown"}`
            );
          }

          const blob = await response.blob();

          if (!blob || blob.size === 0) {
            throw new Error(
              `Empty image blob received: size=${blob?.size || 0} bytes`
            );
          }

          console.log("Image blob loaded successfully:", {
            size: Math.round(blob.size / 1024) + "KB",
            type: blob.type,
          });

          // Validate image by loading in an Image object first
          await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              if (img.width === 0 || img.height === 0) {
                reject(new Error("Image has invalid dimensions"));
              } else {
                console.log("Image validated with dimensions:", {
                  width: img.width,
                  height: img.height,
                });
                resolve();
              }
            };
            img.onerror = () =>
              reject(new Error("Failed to load image for validation"));
            img.src = URL.createObjectURL(blob);
          });

          // Now create the object URL for the editor
          setImageSrc(URL.createObjectURL(blob));
        } catch (error) {
          console.error("Error loading image:", error);
          setError("Failed to load image: " + error.message);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchImage();

    // Cleanup function to revoke object URLs
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

      console.log("Starting image save process...");
      console.log("Edited image object keys:", Object.keys(editedImageObject));
      console.log("Image type:", editedImageObject.mimeType);

      let base64String;

      if (editedImageObject.imageBase64) {
        console.log("Using imageBase64 for edited image data");
        base64String = editedImageObject.imageBase64;
      } else if (editedImageObject.fullCanvasPreview) {
        console.log("Using fullCanvasPreview for edited image data");
        base64String = editedImageObject.fullCanvasPreview;
      } else if (
        editedImageObject.canvas &&
        typeof editedImageObject.canvas.toDataURL === "function"
      ) {
        console.log("Using canvas.toDataURL for edited image data");
        base64String = editedImageObject.canvas.toDataURL("image/jpeg", 0.92);
      } else {
        console.error("No valid image data found in edited image object");
        throw new Error("No valid image data found from editor");
      }

      if (!base64String) {
        throw new Error("No image data received from editor");
      }

      if (typeof base64String !== "string") {
        console.error("Invalid base64String type:", typeof base64String);
        throw new Error("Invalid image data type from editor");
      }

      if (!base64String.startsWith("data:")) {
        console.error(
          "Image data doesn't have proper format:",
          base64String.substring(0, 30) + "..."
        );
        throw new Error("Invalid image data format from editor");
      }

      console.log(
        "Image data retrieved, format:",
        base64String.substring(0, 30) + "..."
      );
      console.log("Data length:", base64String.length);

      const base64Data = base64String.split(',')[1]; // Get only the data part
// Remove this line as it causes variable redeclaration
// The response variable is declared again below with FormData

      // Convert base64 data to Blob
      const byteString = atob(base64Data);
      const mimeType = 'image/jpeg';
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeType });
      
      // Use FormData to send the file
      const formData = new FormData();
      formData.append('image', blob, photo.filename);
      
      // Update replacePhoto service to send FormData
      const response = await replacePhoto(photo.id, formData);

      // Check size - if over 5MB, reduce quality
      if (base64String.length > 5 * 1024 * 1024) {
        console.log("Image too large, reducing quality...");

        try {
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = (e) =>
              reject(new Error("Failed to load image for resizing: " + e));
            img.src = base64String;
          });

          console.log("Resize: Image loaded with dimensions:", {
            width: img.width,
            height: img.height,
          });

          // Check for valid dimensions
          if (img.width === 0 || img.height === 0) {
            throw new Error("Cannot resize image with invalid dimensions");
          }

          const canvas = document.createElement("canvas");
          // Reduce dimensions if too large
          const maxDimension = 2048; // Maximum dimension
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round(height * (maxDimension / width));
              width = maxDimension;
            } else {
              width = Math.round(width * (maxDimension / height));
              height = maxDimension;
            }
            console.log(`Resized image to ${width}x${height}`);
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d", { alpha: false });

          // Fill with white background (necessary for JPEGs)
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);

          // Enable high quality image processing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          // Draw image with proper scaling
          ctx.drawImage(img, 0, 0, width, height);

          // Use blob for better data handling
          base64String = await new Promise((resolve, reject) => {
            let quality = 0.85; // More balanced quality starting point
            const tryCompress = (q) => {
              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    reject(new Error("Failed to create compressed JPEG blob"));
                    return;
                  }

                  // Check if blob size is acceptable
                  if (blob.size > 5 * 1024 * 1024 && q > 0.6) {
                    // Don't go below 0.6 quality to maintain reasonable quality
                    console.log(
                      `Blob too large at quality=${q.toFixed(
                        2
                      )}, size=${Math.round(
                        blob.size / 1024
                      )}KB, trying lower quality`
                    );
                    // Try lower quality with smaller decrements
                    tryCompress(q - 0.05);
                  } else {
                    // Convert final blob to base64
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64data = reader.result;
                      console.log(
                        `Final compression: quality=${q.toFixed(
                          2
                        )}, size=${Math.round(blob.size / 1024)}KB`
                      );
                      resolve(base64data);
                    };
                    reader.onerror = () =>
                      reject(
                        new Error("FileReader failed to read compressed blob")
                      );
                    reader.readAsDataURL(blob);
                  }
                },
                "image/jpeg",
                quality
              );
            };

            // Start the compression process
            tryCompress(quality);
          });
        } catch (resizeError) {
          console.error("Error during image resize:", resizeError);
          throw new Error(
            "Failed to resize large image: " + resizeError.message
          );
        }
      }

      console.log(
        "Final image size:",
        Math.round(base64String.length / 1024),
        "KB"
      );

      try {
        console.log("Sending to server...");
        const response = await replacePhoto(photo.id, base64String);
        console.log("Server successfully processed the image!");

        // Force cache invalidation for the image
        const timestamp = new Date().getTime();
        const imageUrl = `http://localhost:8000/api/pictures/${photo.id}/image?v=${timestamp}`;

        // Update the URL in the parent component
        if (onSave) {
          // Pass the updated picture data from the response if available
          onSave(
            response.picture || {
              ...photo,
              updated_at: new Date().toISOString(),
            }
          );
        }

        // Clean up resources
        URL.revokeObjectURL(imageSrc);
        onClose();
      } catch (uploadError) {
        console.error("Error uploading to server:", uploadError);
        throw uploadError;
      }
    } catch (error) {
      console.error("Save error:", error);
      setError(
        error.response?.data?.message || error.message || "Failed to save image"
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
                onSave={handleSave}
                onClose={onClose}
                onBeforeSave={(editedImageObject) => {
                  // Log what we're getting from the editor
                  console.log(
                    "Before save callback received edited object:",
                    Object.keys(editedImageObject)
                  );
                  // Prevent default save behavior and defer to our custom handler
                  return false;
                }}
                config={{
                  tools: [
                    "adjust",
                    "filter",
                    "effects",
                    "rotate",
                    "crop",
                    "resize",
                    "text",
                  ],
                  translations: {
                    en: {
                      "toolbar.download": "Save",
                    },
                  },
                  theme: {
                    primary: "#2196f3",
                    white: "#ffffff",
                  },
                  reduceBeforeEdit: {
                    mode: "manual", // Changed from auto to better control processing
                    maxWidth: 2048,
                    maxHeight: 2048,
                  },
                  // Force proper image processing mode
                  imageState: {
                    quality: 100, // Use maximum quality during editing
                  },
                  // Force JPEG output
                  forceToPngInEllipticalCrop: false, // Prevent format changes
                  useBackendTranslations: false,
                  savingPixelRatio: 1, // Use original pixel ratio
                  previewPixelRatio: window.devicePixelRatio || 1,
                  moreSaveOptions: false,
                  observePluginsContainerSize: true, // For more stable UI and editing
                  // Override the editor's default image processing settings
                  defaultSavedImageType: "jpeg",
                  defaultSavedImageName: photo?.filename || "edited_image.jpg",
                  defaultSavedImageQuality: 0.92,
                  // Important for proper canvas rendering
                  beginCropArea: 100, // Start with full image visible
                  minCropAreaWidth: 32,
                  minCropAreaHeight: 32,
                  showCanvasOnly: false,
                }}
                annotationsCommon={{
                  fill: "#ff0000", // Default annotation color
                }}
              />
            )
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} color="primary" disabled={isSaving}>
            Cancel
          </Button>
          {/* Add debug button for direct testing */}
          {process.env.NODE_ENV === "development" && (
            <Button
              onClick={() => {
                // Higher quality test JPEG image (1x1 pixel, properly formatted)
                const debugBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAAAAADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDl6KKK/9k=";
                console.log("Testing with test JPEG image");

                // Use small test image
                replacePhoto(photo.id, debugBase64)
                  .then((response) => {
                    console.log("Debug image saved successfully:", response);

                    // Validate that our image processing is working correctly
                    // by checking if we can fetch the updated image
                    const validateImage = async () => {
                      try {
                        const token = localStorage.getItem("token");
                        const response = await fetch(
                          `http://localhost:8000/api/pictures/${
                            photo.id
                          }/image?v=${new Date().getTime()}`,
                          {
                            headers: { Authorization: `Bearer ${token}` },
                            credentials: "include",
                          }
                        );

                        if (!response.ok) {
                          throw new Error("Failed to validate updated image");
                        }

                        const blob = await response.blob();
                        if (blob.size < 10) {
                          console.error(
                            "Validation failed: Image is too small"
                          );
                        } else {
                          console.log(
                            "Validation successful: Image updated correctly",
                            { size: blob.size, type: blob.type }
                          );
                        }
                      } catch (validateError) {
                        console.error("Validation failed:", validateError);
                      }
                    };

                    // Run validation
                    validateImage();

                    onSave();
                    onClose();
                  })
                  .catch((error) => {
                    console.error("Debug image save failed:", error);
                    setError(
                      "Debug save failed: " + (error.message || "Unknown error")
                    );
                  });
              }}
              color="secondary"
              disabled={isSaving}
            >
              Test Save
            </Button>
          )}
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
