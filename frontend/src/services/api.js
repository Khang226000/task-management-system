import axios from 'axios';
import { useOfflineStore } from '../store/offlineStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api',
  timeout: 10000
});

// ── Response interceptor ──────────────────────────────────
api.interceptors.response.use(
  (response) => {
    // Request thành công → đánh dấu online nếu đang offline
    const store = useOfflineStore.getState();
    if (!store.isOnline) {
      store.setOnline(true);
    }
    return response;
  },
  (error) => {
    // 401 → logout
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Network error / timeout → server không trả lời → offline mode
    if (!error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      useOfflineStore.getState().setServerUnreachable();
    }

    return Promise.reject(error);
  }
);

export default api;
