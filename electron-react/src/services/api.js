import axios from "axios";

const API_URL = "http://localhost:8000/api";

// Update the axios instance configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// Add a request interceptor to include the token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
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
    throw error.response.data;
  }
};

export const register = async (name, email, password) => {
  try {
    const response = await api.post("/register", { name, email, password });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const logout = async () => {
  try {
    await api.post("/logout");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } catch (error) {
    console.error("Logout error:", error);
  }
};

// Fixed getUserPhotos function - removed duplicate
export const getUserPhotos = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}/photos`);
    console.log("Raw API response:", response);
    // Handle both response formats
    return response.data?.photos || response.data || [];
  } catch (error) {
    console.error("Error fetching photos:", error);
    return [];
  }
};

export const uploadPhoto = async (userId, filename, file) => {
  try {
    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("filename", filename);

    // Convert to JPEG if needed and add to form data
    const processedFile = await convertImageToJpeg(file);
    formData.append("photo", processedFile, processedFile.name);

    console.log("Uploading with data:", {
      userId,
      filename,
      fileSize: processedFile.size,
      fileType: processedFile.type,
    });

    const response = await api.post(`/pictures`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "X-Debug-Conversion": "processed",
      },
    });

    console.log("Upload response:", response.data);

    if (response.data && response.data.path) {
      console.log("Stored image path:", response.data.path);
    }

    return response.data;
  } catch (error) {
    console.error("Upload error details:", {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
    });
    throw error;
  }
};

// New image conversion helper
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
    throw error.response.data;
  }
};

// Fixed replacePhoto function to use the api instance
export const replacePhoto = (id, base64Data) => {
  return api.patch(`/pictures/${id}/image`, {
    image_data: base64Data
  }, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });
};

// Helper function to convert any image format to JPEG
const convertToJpeg = (base64Image) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Create a canvas to draw the image
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Get 2D context and draw with white background (for transparency)
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Convert to JPEG
      const jpegBase64 = canvas.toDataURL("image/jpeg", 0.92);
      resolve(jpegBase64);
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for JPEG conversion"));
    };

    img.src = base64Image;
  });
};

// Fetch the full image data as a Blob
export const getPhotoImage = async (photoId) => {
  try {
    const response = await api.get(`/pictures/${photoId}/image`, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching full image:", error);
    throw error;
  }
};

// Fetch the thumbnail image data as a Blob
export const getPhotoThumbnail = async (photoId) => {
  try {
    const response = await api.get(`/pictures/${photoId}/thumbnail`, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching thumbnail:", error);
    return null;
  }
};

export default api;
