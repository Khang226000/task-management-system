import { create } from 'zustand';
import api from '../services/api';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  counts: { total: 0, overdue: 0, due_soon: 0 },
  loading: false,
  lastFetch: null,
  // IDs đã đọc (lưu trong memory, reset khi reload)
  readIds: new Set(),
  // Toast queue
  toasts: [],

  fetch: async () => {
    try {
      set({ loading: true });
      const res = await api.get('/notifications');
      const { notifications, counts } = res.data.data;

      const prev = get().notifications;
      const prevIds = new Set(prev.map(n => n.id));
      const readIds = get().readIds;

      // Tìm thông báo MỚI (chưa từng thấy và chưa đọc)
      const newItems = notifications.filter(n => !prevIds.has(n.id) && !readIds.has(n.id));

      set(s => ({
        notifications,
        counts,
        loading: false,
        lastFetch: Date.now(),
        // Thêm toast cho thông báo mới
        toasts: newItems.length > 0
          ? [...s.toasts, ...newItems.map(n => ({ ...n, _toastId: n.id + '_' + Date.now() }))]
          : s.toasts
      }));
    } catch {
      set({ loading: false });
    }
  },

  markRead: (id) => {
    set(s => {
      const readIds = new Set(s.readIds);
      readIds.add(id);
      return { readIds };
    });
  },

  markAllRead: () => {
    set(s => {
      const readIds = new Set(s.readIds);
      s.notifications.forEach(n => readIds.add(n.id));
      return { readIds };
    });
  },

  dismissToast: (toastId) => {
    set(s => ({ toasts: s.toasts.filter(t => t._toastId !== toastId) }));
  },

  dismissAllToasts: () => {
    set({ toasts: [] });
  },

  // Số thông báo chưa đọc
  unreadCount: () => {
    const { notifications, readIds } = get();
    return notifications.filter(n => !readIds.has(n.id)).length;
  }
}));
