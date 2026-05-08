import React, { useEffect } from 'react';
import { AlertTriangle, Clock, X, BellOff } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';

function Toast({ toast, onDismiss }) {
  const isOverdue = toast.type === 'overdue';
  const color     = isOverdue ? '#ef4444' : '#f59e0b';

  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast._toastId), 8000);
    return () => clearTimeout(t);
  }, [toast._toastId, onDismiss]);

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '12px 14px',
      backgroundColor: 'var(--bg-surface)',
      border: `1.5px solid ${color}50`,
      borderLeft: `4px solid ${color}`,
      borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      width: '100%',
      animation: 'slideInRight 0.3s ease',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
        backgroundColor: `${color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {isOverdue
          ? <AlertTriangle size={13} style={{ color }} />
          : <Clock size={13} style={{ color }} />
        }
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color, marginBottom: 2 }}>
          {isOverdue ? '⚠️ Công việc quá hạn!' : '⏰ Sắp đến hạn!'}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {toast.taskName}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          {toast.taskCode} · {isOverdue ? `Quá ${toast.daysOverdue} ngày` : toast.daysLeft === 0 ? 'Hết hạn hôm nay' : `Còn ${toast.daysLeft} ngày`}
        </div>
      </div>

      <button
        onClick={() => onDismiss(toast._toastId)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, flexShrink: 0 }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

export default function NotificationToastContainer() {
  const { toasts, dismissToast, dismissAllToasts } = useNotificationStore();

  if (toasts.length === 0) return null;

  const isMobile = window.innerWidth < 768;

  return (
    <div style={{
      position: 'fixed',
      bottom: isMobile ? 16 : 24,
      right: isMobile ? 8 : 24,
      left: isMobile ? 8 : 'auto',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      maxWidth: isMobile ? '100%' : 380,
    }}>
      {/* Nút tắt tất cả — hiện khi có từ 2 thông báo trở lên */}
      {toasts.length >= 2 && (
        <button
          onClick={dismissAllToasts}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
            backgroundColor: 'rgba(100,116,139,0.9)',
            color: '#fff', fontSize: 12, fontWeight: 700,
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            alignSelf: 'flex-end',
          }}
        >
          <BellOff size={13} />
          Tắt tất cả ({toasts.length})
        </button>
      )}

      {/* Danh sách toast — tối đa 4 cái */}
      {toasts.slice(-4).map(toast => (
        <Toast key={toast._toastId} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
