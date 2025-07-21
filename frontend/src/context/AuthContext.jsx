import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [refreshAttempts, setRefreshAttempts] = useState(0)
  const [refreshFailed, setRefreshFailed] = useState(false)
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

  // Configure axios defaults
  axios.defaults.withCredentials = true;

  // Add response interceptor for handling 401 errors
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Only attempt refresh if it's a 401 error, not already retrying, and refresh hasn't failed
        // AND it's not a /me or /refresh endpoint (to prevent loops)
        if (error.response?.status === 401 && 
            !originalRequest._retry && 
            !refreshFailed &&
            !originalRequest.url?.includes('/api/auth/me') &&
            !originalRequest.url?.includes('/api/auth/refresh')) {
          
          originalRequest._retry = true;
          
          // Don't retry if we're already logging out or have exceeded refresh attempts
          if (isLoggingOut || refreshAttempts >= 2) {
            setUser(null);
            setLoading(false);
            setRefreshFailed(true);
            return Promise.reject(error);
          }
          
          try {
            setRefreshAttempts(prev => prev + 1);
            const response = await axios.post(`${API_BASE}/api/auth/refresh`);
            setUser(response.data.user);
            setRefreshAttempts(0);
            setRefreshFailed(false);
            return axios(originalRequest);
          } catch (refreshError) {
            setUser(null);
            setLoading(false);
            setRefreshAttempts(0);
            setRefreshFailed(true);
            return Promise.reject(error);
          }
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [isLoggingOut, refreshAttempts, refreshFailed, API_BASE]);

  useEffect(() => {
    // Try to load user from HTTP-only cookies on mount
    if (!isLoggingOut && !refreshFailed) {
      axios.get(`${API_BASE}/api/auth/me`)
        .then(res => {
          setUser(res.data)
          setLoading(false)
          setRefreshAttempts(0)
          setRefreshFailed(false)
        })
        .catch((error) => {
          setUser(null)
          setLoading(false)
          setRefreshAttempts(0)
          // Set refreshFailed to true to prevent refresh loops on initial load
          setRefreshFailed(true)
        })
    } else {
      setLoading(false)
    }
  }, [isLoggingOut, refreshFailed, API_BASE])

  const login = async (username, password) => {
    setIsLoggingOut(false)
    setLoading(true)
    setRefreshAttempts(0)
    setRefreshFailed(false)
    
    try {
      const response = await axios.post(`${API_BASE}/api/auth/login`, { username, password })
      setUser(response.data.user)
      setLoading(false)
      setRefreshFailed(false) // Reset refresh failed state on successful login
      return response.data
    } catch (error) {
      setLoading(false)
      throw error
    }
  }
  
  const logout = async () => {
    setIsLoggingOut(true)
    setUser(null)
    setLoading(false)
    setRefreshAttempts(0)
    setRefreshFailed(false)
    
    try {
      await axios.post(`${API_BASE}/api/auth/logout`)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const checkPermission = (permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes('*') || user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions) => {
    if (!user || !user.permissions) return false;
    if (user.permissions.includes('*')) return true;
    return permissions.some(permission => user.permissions.includes(permission));
  };

  const hasAllPermissions = (permissions) => {
    if (!user || !user.permissions) return false;
    if (user.permissions.includes('*')) return true;
    return permissions.every(permission => user.permissions.includes(permission));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading,
      checkPermission,
      hasAnyPermission,
      hasAllPermissions
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

// Permission hook and component
export function usePermission(perm) {
  const { user } = useAuth();
  if (!user || !user.permissions) return false;
  if (Array.isArray(perm)) {
    return perm.some(p => user.permissions.includes(p) || user.permissions.includes('*'));
  }
  return user.permissions.includes(perm) || user.permissions.includes('*');
}

export function Permission({ perm, children }) {
  const allowed = usePermission(perm);
  return allowed ? children : null;
} 