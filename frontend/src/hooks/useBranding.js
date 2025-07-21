import { useState, useEffect } from 'react';
import axios from 'axios';

export default function useBranding() {
  const [branding, setBranding] = useState({ hospitalName: 'Hospital Accounts Management' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
        const res = await axios.get(`${API_BASE}/api/settings`);
        const brandingSetting = res.data.find(s => s.key === 'branding');
        if (brandingSetting?.value?.hospitalName) {
          setBranding(brandingSetting.value);
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchBranding();
  }, []);

  return { branding, loading };
} 