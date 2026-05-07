/**
 * filterStore — lưu trạng thái filter toàn cục
 * - Persist vào sessionStorage (giữ khi đổi tab, reset khi đóng tab/đăng xuất)
 * - Mỗi trang có namespace riêng
 */
import { create } from 'zustand';

const now = new Date();
const DEFAULT_MONTH = now.getMonth() + 1;
const DEFAULT_YEAR  = now.getFullYear();

// ── Đọc từ sessionStorage ──
const load = (key, fallback) => {
  try {
    const raw = sessionStorage.getItem(`filter_${key}`);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch { return fallback; }
};

// ── Ghi vào sessionStorage ──
const save = (key, value) => {
  try { sessionStorage.setItem(`filter_${key}`, JSON.stringify(value)); } catch {}
};

// ── Defaults cho từng trang ──
const DEFAULTS = {
  // Sự kiện (Kanban + List + Calendar)
  event: {
    month: DEFAULT_MONTH, year: DEFAULT_YEAR,
    leadDepartment: '', assigneeId: '', deputyDirector: '',
    workCategory: '', status: '', search: ''
  },
  // CV hằng tháng (Kanban + List)
  monthly: {
    month: DEFAULT_MONTH, year: DEFAULT_YEAR,
    department: '', assigneeId: '', taskGroup: '',
    taskType: '', completion: ''
  },
  // Thống kê Sự kiện
  statsEvent: {
    month: DEFAULT_MONTH, year: DEFAULT_YEAR,
    leadDepartment: '', assigneeId: '', deputyDirector: ''
  },
  // Thống kê CV tháng
  statsMonthly: {
    month: DEFAULT_MONTH, year: DEFAULT_YEAR,
    department: '', assigneeId: '', taskType: ''
  },
};

// ── Load initial state từ sessionStorage ──
const loadAll = () => {
  const result = {};
  for (const [key, def] of Object.entries(DEFAULTS)) {
    result[key] = load(key, def);
  }
  return result;
};

export const useFilterStore = create((set, get) => ({
  ...loadAll(),

  // Set filter cho 1 namespace
  setFilter: (namespace, updates) => {
    const current = get()[namespace] || DEFAULTS[namespace] || {};
    const next = { ...current, ...updates };
    save(namespace, next);
    set({ [namespace]: next });
  },

  // Reset 1 namespace về default
  resetFilter: (namespace) => {
    const def = DEFAULTS[namespace] || {};
    save(namespace, def);
    set({ [namespace]: def });
  },

  // Reset TẤT CẢ — gọi khi logout
  resetAll: () => {
    for (const key of Object.keys(DEFAULTS)) {
      sessionStorage.removeItem(`filter_${key}`);
    }
    set(loadAll()); // load lại defaults (vì đã xóa sessionStorage)
  },
}));
