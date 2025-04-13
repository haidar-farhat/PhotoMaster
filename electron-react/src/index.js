import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App';

// Initialize CSRF token
axios.get('http://localhost:8000/sanctum/csrf-cookie', {
    withCredentials: true
}).catch(error => {
    console.error('CSRF token fetch failed:', error);
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
