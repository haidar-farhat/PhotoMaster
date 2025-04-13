import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Update the axios instance configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Add a request interceptor to include the token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const login = async (email, password) => {
  try {
    const response = await api.post('/login', { email, password });
    localStorage.setItem('token', response.data.access_token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const register = async (name, email, password) => {
  try {
    const response = await api.post('/register', { name, email, password });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const logout = async () => {
  try {
    await api.post('/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// Fixed getUserPhotos function - removed duplicate
export const getUserPhotos = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}/photos`);
    console.log('Raw API response:', response);
    // Handle both response formats
    return response.data?.photos || response.data || [];
  } catch (error) {
    console.error('Error fetching photos:', error);
    return [];
  }
};

export const uploadPhoto = async (userId, filename, file) => {
  try {
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('filename', filename);
    formData.append('photo', file);

    console.log('Uploading with data:', {
      userId,
      filename,
      fileSize: file.size,
      fileType: file.type
    });

    const response = await api.post(`/pictures`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log('Upload response:', response.data);
    
    if (response.data && response.data.path) {
      console.log('Stored image path:', response.data.path);
    }
    
    return response.data;
  } catch (error) {
    console.error('API error in uploadPhoto:', error);
    throw error;
  }
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
export const replacePhoto = async (id, base64Image) => {
  try {
    const response = await api.put(
      `/pictures/${id}/image`,
      { base64_image: base64Image }
    );
    return response.data;
  } catch (error) {
    // Enhanced error parsing for validation errors
    if (error.response?.status === 422) {
      error.message = error.response.data?.errors?.base64_image?.join(', ') || 'Invalid image format';
    }
    console.error('Error replacing photo:', error);
    throw error;
  }
};

// Fetch the full image data as a Blob
export const getPhotoImage = async (photoId) => {
  try {
    const response = await api.get(`/pictures/${photoId}/image`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching full image:', error);
    throw error;
  }
};

// Fetch the thumbnail image data as a Blob
export const getPhotoThumbnail = async (photoId) => {
  try {
    const response = await api.get(`/pictures/${photoId}/thumbnail`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching thumbnail:', error);
    return null; 
  }
};

export default api;