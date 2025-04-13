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

export const replacePhoto = async (id, base64Data) => {
  try {
    if (!base64Data || typeof base64Data !== 'string') {
      throw new Error("No image data provided");
    }

    const response = await api.patch(`/pictures/${id}/image`, {
      image_data: base64Data
    }, {
      headers: {
        'Content-Transfer-Encoding': 'base64',
        'X-Image-Length': base64Data.length
      }
    });
    
    return response.data;
  } catch (error) {
    console.error("API Error Details:", {
      status: error.response?.status,
      data: error.response?.data,
      sentLength: base64Data?.length,
      sentStart: base64Data?.slice(0, 50),
      sentEnd: base64Data?.slice(-50)
    });
    throw error;
  }
};

export const getPhotoImage = async (photoId, cacheBuster) => {
  try {
    const url = `/pictures/${photoId}/image${cacheBuster ? `?v=${cacheBuster}` : ''}`;
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
    const url = `/pictures/${photoId}/thumbnail${cacheBuster ? `?v=${cacheBuster}` : ''}`;
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
export const convertToJpeg = async (base64Image) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      
      // Fill with white background first
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // Convert to JPEG with quality 92%
      const jpegBase64 = canvas.toDataURL("image/jpeg", 0.92);
      resolve(jpegBase64);
    };
    
    img.onerror = () => {
      reject(new Error("Failed to load image for conversion"));
    };
    
    img.src = base64Image;
  });
};

export default api;