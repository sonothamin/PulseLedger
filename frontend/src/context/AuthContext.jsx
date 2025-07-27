import { createContext, useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const API_BASE = import.meta.env.VITE_API_BASE;
  const isMounted = useRef(false);

  // Configure axios defaults
  axios.defaults.withCredentials = true;

  // Helper to reset error
  const resetError = useCallback(() => setError(null), [])

  // Global axios interceptor for session/refresh only (not login)
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        // Only handle 401 for protected API calls, not /me, /refresh, or /login
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url?.includes('/api/auth/me') &&
          !originalRequest.url?.includes('/api/auth/refresh') &&
          !originalRequest.url?.includes('/api/auth/login')
        ) {
          originalRequest._retry = true;
          try {
            await axios.post(`${API_BASE}/api/auth/refresh`)
            return axios(originalRequest)
          } catch (refreshError) {
            setUser(null)
            setError('Session expired. Please log in again.')
            return Promise.reject(refreshError)
          }
        }
        // Show a toast for 403 errors, do not reload or popup
        if (error.response?.status === 403) {
          const msg = error.response?.data?.message || 'You do not have permission to perform this action.';
          setError(`Access Denied (403): ${msg}`);
          return Promise.reject(error);
        }
        return Promise.reject(error)
      }
    )
    return () => axios.interceptors.response.eject(interceptor)
  }, [API_BASE])

  // On mount, check if user is authenticated
  useEffect(() => {
    isMounted.current = true
    setLoading(true)
    axios.get(`${API_BASE}/api/auth/me`)
      .then(res => {
        if (!isMounted.current) return
        setUser(res.data)
        setLoading(false)
        setError(null)
      })
      .catch(() => {
        if (!isMounted.current) return
        setUser(null)
        setLoading(false)
        setError(null) // Not an error, just not logged in
      })
    return () => { isMounted.current = false }
  }, [API_BASE])

  // Login method: only set error on login failure
  const login = async (username, password) => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post(`${API_BASE}/api/auth/login`, { username, password })
      setUser(response.data.user)
      setLoading(false)
      setError(null)
      return response.data
    } catch {
      setLoading(false)
      setError('Login failed')
      throw new Error('Login failed')
    }
  }

  // Logout method
  const logout = async () => {
    setLoading(true)
    setError(null)
    try {
      await axios.post(`${API_BASE}/api/auth/logout`)
    } catch {
      // ignore
    } finally {
      setUser(null)
      setLoading(false)
    }
  }

  // Permission helpers
  const checkPermission = (permission) => {
    if (!user || !user.permissions) return false
    return user.permissions.includes('*') || user.permissions.includes(permission)
  }
  const hasAnyPermission = (permissions) => {
    if (!user || !user.permissions) return false
    if (user.permissions.includes('*')) return true
    return permissions.some(permission => user.permissions.includes(permission))
  }
  const hasAllPermissions = (permissions) => {
    if (!user || !user.permissions) return false
    if (user.permissions.includes('*')) return true
    return permissions.every(permission => user.permissions.includes(permission))
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      loading,
      error,
      resetError,
      checkPermission,
      hasAnyPermission,
      hasAllPermissions
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }; 