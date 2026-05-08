import { create } from 'zustand';
import api from '../services/api';
import { useOfflineStore } from './offlineStore';

// ── Load/save filter từ sessionStorage ──
const FILTER_KEY = 'taskstore_filters';
const loadFilters = () => {
  try {
    const raw = sessionStorage.getItem(FILTER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
};
const saveFilters = (f) => {
  try { sessionStorage.setItem(FILTER_KEY, JSON.stringify(f)); } catch {}
};

const defaultFilters = {
  workCategory: '',
  leadDepartment: '',
  deputyDirector: '',
  assigneeId: '',
  taskType: '',
  status: '',
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  search: ''
};

// Helper lấy offline store mà không cần hook
const getOffline = () => useOfflineStore.getState();

export const useTaskStore = create((set, get) => ({
  tasks: [],
  taskTree: [],
  kanbanBoard: { not_started: [], in_progress: [], done: [], delayed: [] },
  loading: false,
  fromCache: false,   // true nếu dữ liệu đang hiển thị từ cache
  filters: loadFilters() || defaultFilters,

  setFilters: (f) => {
    set(s => {
      const next = { ...s.filters, ...f };
      saveFilters(next);
      return { filters: next };
    });
  },

  fetchKanban: async () => {
    set({ loading: true });
    const offline = getOffline();

    // Chỉ dùng cache khi browser thực sự offline
    if (!navigator.onLine && !offline.isOnline) {
      const cached = offline.getCachedKanban();
      if (cached) {
        set({ kanbanBoard: cached, loading: false, fromCache: true });
      } else {
        set({ loading: false, fromCache: true });
      }
      return;
    }

    try {
      const { filters } = get();
      const p = new URLSearchParams();
      if (filters.month)          p.append('month',          filters.month);
      if (filters.year)           p.append('year',           filters.year);
      if (filters.leadDepartment) p.append('leadDepartment', filters.leadDepartment);
      if (filters.deputyDirector) p.append('deputyDirector', filters.deputyDirector);
      if (filters.workCategory)   p.append('workCategory',   filters.workCategory);
      if (filters.assigneeId)     p.append('assigneeId',     filters.assigneeId);
      if (filters.status)         p.append('status',         filters.status);
      if (filters.search)         p.append('search',         filters.search);
      const res = await api.get(`/tasks/kanban?${p}`);
      const board = res.data.data;

      // Client-side search bổ sung
      if (filters.search) {
        const kw = filters.search.trim().toLowerCase();
        const normKw = kw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D');
        const match = (t) => {
          const norm = (s) => (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
          return norm(t.taskName).includes(normKw) || norm(t.taskCode).includes(normKw) || norm(t.assignee?.name).includes(normKw);
        };
        Object.keys(board).forEach(k => { board[k] = board[k].filter(match); });
      }

      // Lưu cache
      offline.cacheKanban(board);
      offline.markSynced();

      set({ kanbanBoard: board, fromCache: false });
    } catch (e) {
      console.error(e);
      // Fallback cache nếu request lỗi
      const cached = offline.getCachedKanban();
      if (cached) set({ kanbanBoard: cached, fromCache: true });
    }
    finally { set({ loading: false }); }
  },

  fetchTree: async () => {
    set({ loading: true });
    const offline = getOffline();

    // Chỉ dùng cache khi browser thực sự offline
    if (!navigator.onLine && !offline.isOnline) {
      const cached = offline.getCachedTaskTree();
      if (cached) set({ taskTree: cached, loading: false, fromCache: true });
      else set({ loading: false, fromCache: true });
      return;
    }

    try {
      const { filters } = get();
      const p = new URLSearchParams();
      if (filters.month)          p.append('month',          filters.month);
      if (filters.year)           p.append('year',           filters.year);
      if (filters.workCategory)   p.append('workCategory',   filters.workCategory);
      if (filters.leadDepartment) p.append('leadDepartment', filters.leadDepartment);
      if (filters.deputyDirector) p.append('deputyDirector', filters.deputyDirector);
      if (filters.assigneeId)     p.append('assigneeId',     filters.assigneeId);
      if (filters.status)         p.append('status',         filters.status);
      if (filters.search)         p.append('search',         filters.search);
      const res = await api.get(`/tasks/tree?${p}`);
      let tree = res.data.data;

      if (filters.search) {
        const normKw = filters.search.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
        const norm = (s) => (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
        const match = (t) => norm(t.taskName).includes(normKw) || norm(t.taskCode).includes(normKw) || norm(t.assignee?.name).includes(normKw) || norm(t.deliverable).includes(normKw);
        tree = tree.filter(parent => match(parent) || (parent.children||[]).some(match));
      }

      offline.cacheTaskTree(tree);
      set({ taskTree: tree, fromCache: false });
    } catch (e) {
      console.error(e);
      const cached = offline.getCachedTaskTree();
      if (cached) set({ taskTree: cached, fromCache: true });
    }
    finally { set({ loading: false }); }
  },

  fetchTasks: async () => {
    set({ loading: true });
    const offline = getOffline();

    if (!offline.isOnline) {
      const cached = offline.getCachedTasks();
      if (cached) set({ tasks: cached, loading: false, fromCache: true });
      else set({ loading: false, fromCache: true });
      return;
    }

    try {
      const { filters } = get();
      const p = new URLSearchParams();
      if (filters.month)          p.append('month',          filters.month);
      if (filters.year)           p.append('year',           filters.year);
      if (filters.workCategory)   p.append('workCategory',   filters.workCategory);
      if (filters.leadDepartment) p.append('leadDepartment', filters.leadDepartment);
      if (filters.assigneeId)     p.append('assigneeId',     filters.assigneeId);
      if (filters.search)         p.append('search',         filters.search);
      const res = await api.get(`/tasks?${p}`);
      offline.cacheTasks(res.data.data);
      set({ tasks: res.data.data, fromCache: false });
    } catch (e) {
      console.error(e);
      const cached = offline.getCachedTasks();
      if (cached) set({ tasks: cached, fromCache: true });
    }
    finally { set({ loading: false }); }
  },

  // ── Write operations — chặn khi offline ──────────────────
  createTask: async (data) => {
    if (!navigator.onLine) throw new Error('OFFLINE');
    const res = await api.post('/tasks', data);
    if (data.month && data.year) {
      const { filters } = get();
      if (data.month !== filters.month || data.year !== filters.year) {
        set(s => ({ filters: { ...s.filters, month: data.month, year: data.year } }));
      }
    }
    await get().fetchTree();
    await get().fetchKanban();
    return res.data.data;
  },

  updateTask: async (id, data) => {
    if (!navigator.onLine) throw new Error('OFFLINE');
    const res = await api.put(`/tasks/${id}`, data);
    await get().fetchTree();
    await get().fetchKanban();
    return res.data.data;
  },

  updateTaskStatus: async (id, status, completion) => {
    if (!navigator.onLine) throw new Error('OFFLINE');
    await api.patch(`/tasks/${id}/status`, { status, completion });
    await get().fetchKanban();
    await get().fetchTree();
  },

  deleteTask: async (id) => {
    if (!navigator.onLine) throw new Error('OFFLINE');
    await api.delete(`/tasks/${id}`);
    await get().fetchTree();
    await get().fetchKanban();
  }
}));
