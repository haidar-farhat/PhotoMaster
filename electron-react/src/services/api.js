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

export const uploadPhoto = async (userId, filename, fileOrBase64) => {
  try {
    // Create a FormData object for file upload
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('filename', filename);
    
    // Check if we're dealing with a File object or base64 string
    if (fileOrBase64 instanceof File) {
      // If it's already a File object, use it directly
      formData.append('photo', fileOrBase64);
      console.log('Uploading file directly:', filename);
    } else if (typeof fileOrBase64 === 'string') {
      // Convert base64 to File object
      const byteString = fileOrBase64.split(',')[1] ? 
        atob(fileOrBase64.split(',')[1]) : 
        atob(fileOrBase64);
        
      // Determine mime type from the data URI
      let mimeType = 'image/png'; // Default
      if (fileOrBase64.startsWith('data:')) {
        mimeType = fileOrBase64.split(',')[0].split(':')[1].split(';')[0];
      } else {
        // Guess from filename
        const extension = filename.split('.').pop().toLowerCase();
        if (extension === 'jpg' || extension === 'jpeg') mimeType = 'image/jpeg';
        else if (extension === 'gif') mimeType = 'image/gif';
      }
      
      // Create array buffer and blob
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeType });
      
      // Create File object
      const file = new File([blob], filename, { type: mimeType });
      formData.append('photo', file);
      console.log('Converted base64 to file and uploading:', filename);
    } else {
      throw new Error('Invalid input: expected File object or base64 string');
    }
    
    // Use axios directly with FormData
    const response = await axios.post(`${API_URL}/pictures`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      timeout: 120000 // 2 minutes timeout for large uploads
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