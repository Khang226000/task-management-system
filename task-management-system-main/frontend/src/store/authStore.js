import { create } from 'zustand';
import api from '../services/api';

// Lấy token từ localStorage thủ công - tránh lỗi persist middleware
const getStoredAuth = () => {
  try {
    const raw = localStorage.getItem('auth-storage');
    if (!raw) return { user: null, token: null };
    const parsed = JSON.parse(raw);
    return { user: parsed.user || null, token: parsed.token || null };
  } catch {
    return { user: null, token: null };
  }
};

const stored = getStoredAuth();
if (stored.token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
}

export const useAuthStore = create((set) => ({
  user: stored.user,
  token: stored.token,

  // Refresh user từ server để lấy role mới nhất
  refreshUser: async () => {
    try {
      const res = await api.get('/auth/me');
      const user = res.data.data;
      const raw = localStorage.getItem('auth-storage');
      const parsed = raw ? JSON.parse(raw) : {};
      localStorage.setItem('auth-storage', JSON.stringify({ ...parsed, user }));
      set({ user });
      return user;
    } catch {
      // Token hết hạn hoặc lỗi — logout
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('auth-storage');
      set({ user: null, token: null });
    }
  },

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user, token } = res.data.data;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('auth-storage', JSON.stringify({ user, token }));
    set({ user, token });
    return user;
  },

  logout: () => {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('auth-storage');
    // Reset tất cả filter khi đăng xuất
    try { sessionStorage.clear(); } catch {}
    set({ user: null, token: null });
  }
}));
