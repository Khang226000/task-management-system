import api from './api';

export const taskService = {
  getKanban: (params) => api.get('/tasks/kanban', { params }),
  getTasks: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  updateStatus: (id, data) => api.patch(`/tasks/${id}/status`, data),
  delete: (id) => api.delete(`/tasks/${id}`)
};

export const eventService = {
  getEvents: (params) => api.get('/events', { params }),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`)
};

export const userService = {
  getUsers: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`)
};

export const monthlyTaskService = {
  getTasks:  (params) => api.get('/monthly-tasks', { params }),
  getById:   (id)     => api.get(`/monthly-tasks/${id}`),
  getStats:  (params) => api.get('/monthly-tasks/stats', { params }),
  create:    (data)   => api.post('/monthly-tasks', data),
  update:    (id, data) => api.put(`/monthly-tasks/${id}`, data),
  delete:    (id)     => api.delete(`/monthly-tasks/${id}`)
};

export const statsService = {
  getDashboard: (params) => api.get('/stats/dashboard', { params })
};

export const departmentService = {
  getAll:  ()           => api.get('/departments'),
  create:  (data)       => api.post('/departments', data),
  update:  (id, data)   => api.put(`/departments/${id}`, data),
  delete:  (id)         => api.delete(`/departments/${id}`),
};
