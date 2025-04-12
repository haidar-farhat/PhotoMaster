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
    const response = await api.get(`/users/${userId}/photos`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const uploadPhoto = async (userId, filename, base64Image) => {
  try {
    // Make sure we're only sending the base64 data without the prefix
    const cleanBase64 = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1] 
      : base64Image;
      
    const response = await api.post('/pictures', {
      user_id: userId,
      filename,
      base64_image: cleanBase64
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