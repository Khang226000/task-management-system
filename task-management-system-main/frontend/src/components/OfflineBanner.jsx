import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, RefreshCw, Clock, Database } from 'lucide-react';
import { useOfflineStore } from '../store/offlineStore';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function OfflineBanner() {
  const { isOnline, wasOffline, lastSync, syncPending } = useOfflineStore();
  const [showSyncMsg, setShowSyncMsg] = useState(false);

  // Khi vừa có mạng lại → hiện thông báo đồng bộ 4 giây
  useEffect(() => {
    if (wasOffline && isOnline) {
      setShowSyncMsg(true);
      const t = setTimeout(() => setShowSyncMsg(false), 4000);
      return () => clearTimeout(t);
    }
  }, [wasOffline, isOnline]);

  const formatSync = (iso) => {
    if (!iso) return 'Chưa có dữ liệu cache';
    try {
      return format(new Date(iso), 'HH:mm - dd/MM/yyyy', { locale: vi });
    } catch { return iso; }
  };

  // Online bình thường → không hiện gì
  if (isOnline && !showSyncMsg) return null;

  // Vừa có mạng lại → banner xanh
  if (isOnline && showSyncMsg) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9000,
        backgroundColor: '#059669',
        padding: '10px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        boxShadow: '0 2px 12px rgba(5,150,105,0.4)',
        animation: 'slideDown 0.3s ease',
      }}>
        <Wifi size={16} style={{ color: '#fff' }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
          Đã kết nối lại — Đang cập nhật dữ liệu mới nhất...
        </span>
        <RefreshCw size={14} style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />
        <style>{`
          @keyframes slideDown { from { transform:translateY(-100%) } to { transform:translateY(0) } }
          @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
        `}</style>
      </div>
    );
  }

  // Offline → banner vàng
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9000,
      backgroundColor: '#1e293b',
      borderBottom: '2px solid #f59e0b',
      padding: '10px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, flexWrap: 'wrap',
      animation: 'slideDown 0.3s ease',
      boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
    }}>
      {/* Trái: icon + thông báo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
          backgroundColor: 'rgba(245,158,11,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <WifiOff size={16} style={{ color: '#f59e0b' }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f59e0b' }}>
            📵 Đang ở chế độ offline
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
            Hiển thị dữ liệu đã lưu · Không thể thêm / sửa / xóa
          </div>
        </div>
      </div>

      {/* Phải: thời gian sync */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Database size={11} style={{ color: '#64748b' }} />
        <Clock size={11} style={{ color: '#64748b' }} />
        <span style={{ fontSize: 11, color: '#64748b' }}>
          Cache: {formatSync(lastSync)}
        </span>
      </div>

      <style>{`
        @keyframes slideDown { from { transform:translateY(-100%) } to { transform:translateY(0) } }
      `}</style>
    </div>
  );
}
