/**
 * Offline Store — Quản lý trạng thái offline và cache dữ liệu
 *
 * Dữ liệu được cache:
 *   - tasks (kanban board + tree)
 *   - events (monthly tasks)
 *   - dashboard stats
 *
 * Khi online  → fetch từ server → lưu vào localStorage
 * Khi offline → đọc từ localStorage → hiển thị
 * Khi online lại → tự động sync dữ liệu mới nhất
 */
import { create } from 'zustand';

// ── Cache keys ──────────────────────────────────────────────
const CACHE_KEYS = {
  kanban:       'offline_kanban',
  taskTree:     'offline_task_tree',
  tasks:        'offline_tasks',
  monthlyTasks: 'offline_monthly_tasks',
  events:       'offline_events',
  stats:        'offline_stats',
  lastSync:     'offline_last_sync',
};

// ── Helpers ─────────────────────────────────────────────────
function saveCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      savedAt: new Date().toISOString(),
    }));
  } catch (e) {
    console.warn('Cache save failed:', e.message);
  }
}

function loadCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.data ?? null;
  } catch {
    return null;
  }
}

function getCacheTime(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw).savedAt ?? null;
  } catch {
    return null;
  }
}

// ── Store ────────────────────────────────────────────────────
export const useOfflineStore = create((set, get) => ({
  isOnline:    navigator.onLine,
  wasOffline:  false,   // true nếu vừa mất mạng và đang xem offline data
  lastSync:    localStorage.getItem(CACHE_KEYS.lastSync) || null,
  syncPending: false,   // true nếu có thay đổi chờ sync

  setOnline: (online) => {
    const { isOnline: wasOnline } = get();
    set({ isOnline: online });

    if (!wasOnline && online) {
      set({ wasOffline: true, syncPending: true });
    }
    if (wasOnline && !online) {
      set({ wasOffline: false });
    }
  },

  // Gọi khi server không trả lời (mất kết nối đến server dù navigator.onLine = true)
  setServerUnreachable: () => {
    if (get().isOnline) {
      set({ isOnline: false });
    }
  },

  markSynced: () => {
    const now = new Date().toISOString();
    localStorage.setItem(CACHE_KEYS.lastSync, now);
    set({ lastSync: now, syncPending: false, wasOffline: false });
  },

  // ── Lưu cache ──────────────────────────────────────────────
  cacheKanban:       (data) => saveCache(CACHE_KEYS.kanban,       data),
  cacheTaskTree:     (data) => saveCache(CACHE_KEYS.taskTree,      data),
  cacheTasks:        (data) => saveCache(CACHE_KEYS.tasks,         data),
  cacheMonthlyTasks: (data) => saveCache(CACHE_KEYS.monthlyTasks,  data),
  cacheEvents:       (data) => saveCache(CACHE_KEYS.events,        data),
  cacheStats:        (data) => saveCache(CACHE_KEYS.stats,         data),

  // ── Đọc cache ──────────────────────────────────────────────
  getCachedKanban:       () => loadCache(CACHE_KEYS.kanban),
  getCachedTaskTree:     () => loadCache(CACHE_KEYS.taskTree),
  getCachedTasks:        () => loadCache(CACHE_KEYS.tasks),
  getCachedMonthlyTasks: () => loadCache(CACHE_KEYS.monthlyTasks),
  getCachedEvents:       () => loadCache(CACHE_KEYS.events),
  getCachedStats:        () => loadCache(CACHE_KEYS.stats),

  // ── Thời gian cache ────────────────────────────────────────
  getKanbanCacheTime:   () => getCacheTime(CACHE_KEYS.kanban),
  getTasksCacheTime:    () => getCacheTime(CACHE_KEYS.tasks),
}));

export { CACHE_KEYS };
