import { useState, useEffect } from 'react';

export default function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');

  useEffect(() => {
    const applyTheme = t => {
      if (t === 'system') {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        document.documentElement.setAttribute('data-bs-theme', mq.matches ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-bs-theme', t);
      }
    };
    applyTheme(theme);
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  const setAndStoreTheme = t => {
    setTheme(t);
    localStorage.setItem('theme', t);
  };
  return [theme, setAndStoreTheme];
} 