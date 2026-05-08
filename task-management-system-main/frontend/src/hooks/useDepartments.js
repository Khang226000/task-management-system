/**
 * Hook fetch danh sách bộ phận từ API
 * Cache trong memory để tránh fetch nhiều lần
 */
import { useState, useEffect } from 'react';
import { departmentService } from '../services/taskService';

let _cache = null;
let _listeners = [];

function notifyListeners(data) {
  _listeners.forEach(fn => fn(data));
}

export function invalidateDeptCache() {
  _cache = null;
}

export function useDepartments() {
  const [departments, setDepartments] = useState(_cache || []);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    const listener = (data) => setDepartments(data);
    _listeners.push(listener);

    if (_cache) {
      setDepartments(_cache);
      setLoading(false);
    } else {
      departmentService.getAll()
        .then(r => {
          _cache = r.data.data || [];
          notifyListeners(_cache);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }

    // Lắng nghe event khi departments được cập nhật
    const handleUpdate = () => refresh();
    window.addEventListener('departments-updated', handleUpdate);

    return () => {
      _listeners = _listeners.filter(fn => fn !== listener);
      window.removeEventListener('departments-updated', handleUpdate);
    };
  }, []);

  const refresh = () => {
    _cache = null;
    setLoading(true);
    departmentService.getAll()
      .then(r => {
        _cache = r.data.data || [];
        notifyListeners(_cache);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  return { departments, loading, refresh };
}
