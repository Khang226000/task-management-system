/**
 * Wrapper cho monthlyTaskService và taskService
 * Tự động cache khi online, dùng cache khi offline
 */
import { monthlyTaskService, taskService } from './taskService';
import { useOfflineStore } from '../store/offlineStore';

const getOffline = () => useOfflineStore.getState();

export const offlineMonthlyTaskService = {
  getTasks: async (params) => {
    const offline = getOffline();

    if (!offline.isOnline) {
      const cached = offline.getCachedMonthlyTasks();
      if (cached) return { data: { data: cached } };
      return { data: { data: [] } };
    }

    try {
      const res = await monthlyTaskService.getTasks(params);
      // Cache kết quả
      offline.cacheMonthlyTasks(res.data.data || []);
      offline.markSynced();
      return res;
    } catch (e) {
      // Fallback cache
      const cached = offline.getCachedMonthlyTasks();
      if (cached) return { data: { data: cached } };
      throw e;
    }
  },

  create:  (...args) => {
    if (!getOffline().isOnline) throw new Error('OFFLINE');
    return monthlyTaskService.create(...args);
  },
  update:  (...args) => {
    if (!getOffline().isOnline) throw new Error('OFFLINE');
    return monthlyTaskService.update(...args);
  },
  delete:  (...args) => {
    if (!getOffline().isOnline) throw new Error('OFFLINE');
    return monthlyTaskService.delete(...args);
  },
};

export const offlineTaskService = {
  getTasks: async (params) => {
    const offline = getOffline();

    if (!offline.isOnline) {
      const cached = offline.getCachedTasks();
      if (cached) return { data: { data: cached } };
      return { data: { data: [] } };
    }

    try {
      const res = await taskService.getTasks(params);
      offline.cacheTasks(res.data.data || []);
      return res;
    } catch (e) {
      const cached = offline.getCachedTasks();
      if (cached) return { data: { data: cached } };
      throw e;
    }
  },
};
