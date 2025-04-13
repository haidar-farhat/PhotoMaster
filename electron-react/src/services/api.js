import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
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

export const getUserPhotos = async (userId) => {
  try {
    const response = await api.get(`/pictures/${userId}`);
    console.log('Raw API response:', response);
    // Make sure we're returning the correct data structure
    return response.data || []; // Return data or empty array if undefined
  } catch (error) {
    console.error('Error fetching photos:', error);
    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
};

export const uploadPhoto = async (userId, filename, file) => {
  try {
    // Create a FormData object for file upload
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('filename', filename);
    formData.append('photo', file);
    
    console.log('Uploading file:', filename);
    
    // Use axios directly with FormData
    const response = await axios.post(`${API_URL}/pictures`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      timeout: 60000 // 1 minute timeout for uploads
    });
    
    return response.data;
  } catch (error) {
    console.error('Upload error details:', error.response?.data || error.message);
    throw error.response?.data || error;
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

export const replacePhoto = async (photoId, base64Image) => {
  try {
    const response = await api.post(`/pictures/${photoId}/replace`, {
      base64_image: base64Image
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export default api;