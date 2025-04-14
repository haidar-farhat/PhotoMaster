import axios from "axios";

const API_URL = "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const login = async (email, password) => {
  try {
    const response = await api.post("/login", { email, password });
    localStorage.setItem("token", response.data.access_token);
    localStorage.setItem("user", JSON.stringify(response.data.user));
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Login failed" };
  }
};

export const register = async (name, email, password) => {
  try {
    const response = await api.post("/register", { name, email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Registration failed" };
  }
};

export const logout = async () => {
  try {
    await api.post("/logout");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } catch (error) {
    console.error("Logout error:", error);
    throw error.response?.data || { message: "Logout failed" };
  }
};

export const getUserPhotos = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}/photos`);
    return response.data?.photos || response.data || [];
  } catch (error) {
    console.error("Error fetching photos:", error);
    throw error.response?.data || { message: "Failed to fetch photos" };
  }
};

export const uploadPhoto = async (userId, filename, file) => {
  try {
    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("filename", filename);

    const processedFile = await convertImageToJpeg(file);
    formData.append("photo", processedFile, processedFile.name);

    const response = await api.post(`/pictures`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Upload error:", error);
    throw error.response?.data || { message: "Photo upload failed" };
  }
};

const convertImageToJpeg = async (file) => {
  if (file.type === "image/jpeg") return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            resolve(
              new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
            );
          },
          "image/jpeg",
          0.85
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

export const deletePhoto = async (photoId) => {
  try {
    const response = await api.delete(`/pictures/${photoId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to delete photo" };
  }
};

// Enhanced image processing helper functions
export const validateAndNormalizeImage = async (imageData) => {
  try {
    if (!imageData) {
      throw new Error("No image data provided");
    }

    console.log(
      "Image type:",
      typeof imageData,
      imageData instanceof Blob
        ? "Blob"
        : imageData.canvas
        ? "Canvas"
        : typeof imageData === "string"
        ? "String"
        : "Unknown"
    );

    // Check if it's already a base64 string
    let base64String = typeof imageData === "string" ? imageData : null;
    let blob = null;

    // If it's a blob object, use it directly
    if (!base64String && imageData instanceof Blob) {
      blob = imageData;
      console.log(
        "Processing direct Blob input:",
        blob.size,
        "bytes, type:",
        blob.type
      );
    }
    // If it's a canvas object, convert to blob
    else if (!base64String && imageData.canvas) {
      console.log("Converting canvas to blob");
      try {
        blob = await new Promise((resolve, reject) => {
          try {
            imageData.canvas.toBlob(
              (result) => {
                if (result) resolve(result);
                else reject(new Error("Canvas to Blob conversion failed"));
              },
              "image/jpeg",
              0.92
            );
          } catch (err) {
            reject(err);
          }
        });
      } catch (canvasError) {
        console.error("Canvas to blob conversion error:", canvasError);
        // Try alternative approach
        try {
          const dataUrl = imageData.canvas.toDataURL("image/jpeg", 0.92);
          base64String = dataUrl;
        } catch (dataUrlError) {
          console.error("Canvas to dataURL error:", dataUrlError);
          throw new Error("Failed to extract image data from canvas");
        }
      }
    }

    // Convert blob to base64 if needed
    if (blob && !base64String) {
      console.log("Converting blob to base64, size:", blob.size);
      base64String = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => {
          console.error("FileReader error:", err);
          reject(new Error("Blob to base64 conversion failed"));
        };
        reader.readAsDataURL(blob);
      });
    }

    // Make sure we have a valid base64 string
    if (!base64String || typeof base64String !== "string") {
      throw new Error("Failed to convert image to base64");
    }

    // Add the data prefix if missing
    const formattedBase64 = base64String.startsWith("data:image/")
      ? base64String
      : `data:image/jpeg;base64,${base64String}`;

    // Validate dimensions by loading the image
    const dimensions = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const result = {
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight,
        };
        console.log("Image validated with dimensions:", result);
        resolve(result);
      };
      img.onerror = (err) => {
        console.error("Image loading error:", err);
        reject(new Error("Failed to load image for validation"));
      };
      img.src = formattedBase64;
    });

    // Split the base64 data for the API call
    let base64Data;
    try {
      base64Data = formattedBase64.split(";base64,").pop();
      if (!base64Data) {
        console.warn("Base64 split failed, using full string");
        base64Data = formattedBase64;
      }
    } catch (err) {
      console.error("Base64 split error:", err);
      throw new Error("Failed to process base64 data");
    }

    return {
      formattedBase64,
      base64Data,
      dimensions,
    };
  } catch (error) {
    console.error("Image validation failed:", error);
    throw error;
  }
};

export const ensureJpegFormat = async (imageData) => {
  try {
    const { formattedBase64 } = await validateAndNormalizeImage(imageData);

    // Create an image element to draw onto canvas
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas with the same dimensions
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");

        // Fill with white background first (in case of transparency)
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the image
        ctx.drawImage(img, 0, 0);

        // Convert to JPEG with quality 92%
        const jpegBase64 = canvas.toDataURL("image/jpeg", 0.92);

        // Validate the output
        if (!jpegBase64 || jpegBase64.length < 100) {
          reject(new Error("Failed to convert to JPEG format"));
        }

        // Return only the base64 data part
        resolve(jpegBase64.split(";base64,").pop());
      };

      img.onerror = () =>
        reject(new Error("Failed to load image for JPEG conversion"));
      img.src = formattedBase64;
    });
  } catch (error) {
    console.error("JPEG conversion failed:", error);
    throw error;
  }
};

export const replacePhoto = async (photoId, imageData) => {
  // Input validation
  if (!photoId) {
    throw new Error("Missing photo ID");
  }

  if (!imageData) {
    throw new Error("Missing image data");
  }

  // Create a cache buster to ensure fresh content
  const cacheBuster = Date.now();

  // Track request for debugging
  const requestId =
    cacheBuster.toString(36) + Math.random().toString(36).substring(2);

  try {
    console.log(
      `[${requestId}] Starting image replacement for photo ID: ${photoId}`
    );

    let processedData;
    let originalType = "unknown";

    // Handle different input types
    if (imageData instanceof Blob) {
      // Case 1: Direct Blob input
      originalType = "blob";
      console.log(
        `[${requestId}] Processing blob directly:`,
        imageData.size,
        "bytes"
      );

      // Convert blob to base64
      const base64String = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(imageData);
      });

      // Extract just the base64 part
      processedData = base64String.split(";base64,").pop();

      console.log(
        `[${requestId}] Blob converted to base64, length:`,
        processedData?.length || 0
      );
    } else if (typeof imageData === "string") {
      originalType = "string";

      // Case 2: Base64 data URL
      if (imageData.startsWith("data:")) {
        console.log(`[${requestId}] Processing data URL`);
        processedData = imageData.split(";base64,").pop();
      }
      // Case 3: Plain base64 string
      else {
        console.log(`[${requestId}] Processing raw base64 string`);
        processedData = imageData;
      }

      console.log(
        `[${requestId}] String data processed, length:`,
        processedData?.length || 0
      );
    } else {
      // Case 4: Other (try the general processor)
      console.log(
        `[${requestId}] Using JPEG processor for input type:`,
        typeof imageData
      );
      originalType = "complex";
      processedData = await ensureJpegFormat(imageData);
    }

    if (!processedData || processedData.length < 100) {
      throw new Error("Image processing failed: output too small");
    }

    // API request with improved headers
    const url = `/pictures/${photoId}/image?cb=${cacheBuster}`;
    console.log(
      `[${requestId}] Sending to ${url}, data length: ${processedData.length}`
    );

    const response = await api.patch(
      url,
      {
        image_data: processedData,
      },
      {
        headers: {
          "Content-Transfer-Encoding": "base64",
          "X-Image-Length": processedData.length,
          "X-Request-ID": requestId,
          "X-Original-Type": originalType,
          "X-Cache-Buster": cacheBuster,
        },
        timeout: 30000,
      }
    );

    console.log(`[${requestId}] Image update successful:`, {
      path: response.data.path,
      thumbnail: response.data.thumbnail_path,
      dimensions: response.data.dimensions,
    });

    // Add the cache buster to the response to ensure fresh image loading
    return {
      ...response.data,
      cacheBuster: cacheBuster,
    };
  } catch (error) {
    // Enhanced error logging
    const errorDetails = {
      requestId,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    };

    console.error(`[${requestId}] API Error:`, errorDetails);

    // Re-throw with more specific message if possible
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};

export const getPhotoImage = async (photoId, cacheBuster) => {
  try {
    const url = `/pictures/${photoId}/image${
      cacheBuster ? `?v=${cacheBuster}` : ""
    }`;
    const response = await api.get(url, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching full image:", error);
    throw error.response?.data || { message: "Failed to load image" };
  }
};

export const getPhotoThumbnail = async (photoId, cacheBuster) => {
  try {
    const url = `/pictures/${photoId}/thumbnail${
      cacheBuster ? `?v=${cacheBuster}` : ""
    }`;
    const response = await api.get(url, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching thumbnail:", error);
    return null;
  }
};

// Helper function for image conversion (used by ImageEditor)
export const convertToJpeg = async (imageData) => {
  return ensureJpegFormat(imageData);
};

export default api;
