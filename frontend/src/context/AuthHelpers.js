import { useContext } from 'react';
import { AuthContext } from './AuthContext';

export function useAuth() {
  return useContext(AuthContext);
}

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