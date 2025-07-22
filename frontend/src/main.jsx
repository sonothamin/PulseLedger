import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import axios from 'axios'
import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './context/AuthContext'

// Configure axios to send cookies with requests
axios.defaults.withCredentials = true

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE;

// Initialize global logout flag
window.isLoggingOutGlobal = false;

// Request interceptor to prevent API calls during logout
axios.interceptors.request.use(
  config => {
    if (window.isLoggingOutGlobal && config.url !== `${API_BASE}/api/auth/logout`) {
      return Promise.reject(new Error('Logging out'));
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

const rootEl = document.getElementById('root')
rootEl.style.width = '100%'
rootEl.style.minHeight = '100vh'

// Global axios interceptor for session expiration and refresh
let isHandlingAuthError = false;
let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed() {
  refreshSubscribers.forEach(cb => cb());
  refreshSubscribers = [];
}

axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Skip refresh for logout endpoint to prevent infinite loops
    if (originalRequest.url === `${API_BASE}/api/auth/logout`) {
      return Promise.reject(error);
    }
    
    // If refresh has already failed, don't try again
    if (window.hasRefreshFailed) {
      return Promise.reject(error);
    }
    
    // If 401 and not already retried, try refresh
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Don't try to refresh if the original request was already a refresh attempt
      if (originalRequest.url === `${API_BASE}/api/auth/refresh`) {
        console.log('Refresh token failed, marking as failed');
        window.hasRefreshFailed = true;
        if (!isHandlingAuthError) {
          isHandlingAuthError = true;
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
      
      // Don't try to refresh for auth/me requests if we're not logged in
      if (originalRequest.url === `${API_BASE}/api/auth/me`) {
        console.log('Auth check failed, not attempting refresh');
        return Promise.reject(error);
      }
      
      if (isRefreshing) {
        // Queue requests while refreshing
        return new Promise((resolve, reject) => {
          refreshSubscribers.push(() => {
            originalRequest._retry = true;
            axios(originalRequest).then(resolve).catch(reject);
          });
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        await axios.post(`${API_BASE}/api/auth/refresh`);
        isRefreshing = false;
        onRefreshed();
        return axios(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        window.hasRefreshFailed = true;
        onRefreshed();
        if (!isHandlingAuthError) {
          isHandlingAuthError = true;
          // Don't show alert for logout scenarios
          if (originalRequest.url !== `${API_BASE}/api/auth/me`) {
            alert('Your session has expired. Please log in again.');
          }
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    // If 401 and already retried, or 403, force logout
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (!isHandlingAuthError && originalRequest.url !== `${API_BASE}/api/auth/me`) {
        isHandlingAuthError = true;
        alert('Your session has expired. Please log in again.');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

createRoot(rootEl).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
