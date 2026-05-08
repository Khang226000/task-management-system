/**
 * Hook theo dõi trạng thái mạng
 * Kết hợp navigator.onLine + ping server thực tế
 */
import { useEffect, useRef } from 'react';
import { useOfflineStore } from '../store/offlineStore';

// Ping server với timeout ngắn để phát hiện offline nhanh
async function pingServer() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout
    const res = await fetch('/api/health', {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

export function useNetworkStatus() {
  const { isOnline, setOnline, setServerUnreachable } = useOfflineStore();
  const pingRef = useRef(null);

  useEffect(() => {
    // Xử lý sự kiện mạng của trình duyệt
    const handleOnline  = () => {
      // Khi browser báo online → ping server để xác nhận
      pingServer().then(ok => {
        if (ok) setOnline(true);
        // Nếu ping fail → giữ offline
      });
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    // Kiểm tra ngay khi mount
    if (!navigator.onLine) {
      setOnline(false);
    } else {
      // Có mạng theo browser → ping server xác nhận
      pingServer().then(ok => {
        if (ok) setOnline(true);
        else setServerUnreachable();
      });
    }

    // Ping định kỳ mỗi 30s để phát hiện mất kết nối
    pingRef.current = setInterval(async () => {
      if (!navigator.onLine) {
        setOnline(false);
        return;
      }
      const ok = await pingServer();
      if (ok) {
        if (!useOfflineStore.getState().isOnline) setOnline(true);
      } else {
        setServerUnreachable();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (pingRef.current) clearInterval(pingRef.current);
    };
  }, []);

  return isOnline;
}
