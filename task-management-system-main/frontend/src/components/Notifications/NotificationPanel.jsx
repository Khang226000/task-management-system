import React, { useEffect, useRef, useState } from 'react';
import { Bell, AlertTriangle, Clock, CheckCircle, X } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import TaskDetailModal from '../Tasks/TaskDetailModal';
import api from '../../services/api';

export default function NotificationPanel({ open, onClose }) {
  const { notifications, counts, readIds, markRead, markAllRead, loading } = useNotificationStore();
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState(null);
  const [loadingTask, setLoadingTask] = useState(false);

  // Đóng khi click ngoài
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const unread = notifications.filter(n => !readIds.has(n.id));

  const fmtDeadline = (dl) => {
    try { return format(new Date(dl), 'dd/MM/yyyy', { locale: vi }); }
    catch { return dl; }
  };

  // Click vào thông báo → đánh dấu đã đọc + mở chi tiết task
  const handleNotificationClick = async (n) => {
    markRead(n.id);
    onClose();
    if (!n.taskId) return;

    // CV tháng → navigate đến /list (tab monthly)
    if (n.taskType === 'monthly') {
      navigate('/list');
      return;
    }

    // Sự kiện → fetch task rồi mở TaskDetailModal
    setLoadingTask(true);
    try {
      const res = await api.get(`/tasks/${n.taskId}`);
      if (res.data?.data) {
        setSelectedTask(res.data.data);
      } else {
        navigate('/kanban');
      }
    } catch {
      navigate('/kanban');
    } finally {
      setLoadingTask(false);
    }
  };

  return (
    <>
    <div
      ref={panelRef}
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: 8,
        width: 380,
        maxHeight: 520,
        backgroundColor: 'var(--bg-surface)',
        border: '1.5px solid var(--border)',
        borderRadius: 16,
        boxShadow: 'var(--shadow)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={16} style={{ color: '#0ea5e9' }} />
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
            Thông báo
          </span>
          {counts.total > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 10,
              backgroundColor: counts.overdue > 0 ? '#ef444420' : '#f59e0b20',
              color: counts.overdue > 0 ? '#ef4444' : '#f59e0b'
            }}>
              {counts.total}
            </span>
          )}
        </div>
        {unread.length > 0 && (
          <button
            onClick={markAllRead}
            style={{ fontSize: 12, color: '#0ea5e9', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Summary chips */}
      {counts.total > 0 && (
        <div style={{ display: 'flex', gap: 8, padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
          {counts.overdue > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, backgroundColor: '#ef444415', border: '1px solid #ef444430' }}>
              <AlertTriangle size={12} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>{counts.overdue} quá hạn</span>
            </div>
          )}
          {counts.due_soon > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, backgroundColor: '#f59e0b15', border: '1px solid #f59e0b30' }}>
              <Clock size={12} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{counts.due_soon} sắp đến hạn</span>
            </div>
          )}
        </div>
      )}

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && notifications.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Đang tải...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <CheckCircle size={32} style={{ margin: '0 auto 10px', color: '#10b981', opacity: 0.5 }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Không có thông báo nào</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Tất cả công việc đang đúng tiến độ 🎉</p>
          </div>
        ) : (
          notifications.map(n => {
            const isRead    = readIds.has(n.id);
            const isOverdue = n.type === 'overdue';
            const color     = isOverdue ? '#ef4444' : '#f59e0b';
            const bgColor   = isOverdue ? '#ef444410' : '#f59e0b10';

            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                style={{
                  display: 'flex', gap: 12, padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: isRead ? 'transparent' : bgColor,
                  cursor: 'pointer',
                  opacity: isRead ? 0.6 : 1,
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = isRead ? 'transparent' : bgColor}
              >
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  backgroundColor: `${color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {isOverdue
                    ? <AlertTriangle size={16} style={{ color }} />
                    : <Clock size={16} style={{ color }} />
                  }
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 800, color }}>
                      {n.taskCode}
                    </span>
                    <span style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 700,
                      backgroundColor: `${color}20`, color
                    }}>
                      {isOverdue ? `Quá ${n.daysOverdue} ngày` : n.daysLeft === 0 ? 'Hôm nay' : `Còn ${n.daysLeft} ngày`}
                    </span>
                    {!isRead && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color, marginLeft: 'auto', flexShrink: 0 }} />
                    )}
                  </div>
                  <p style={{
                    fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3
                  }}>
                    {n.taskName}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>📅 {fmtDeadline(n.deadline)}</span>
                    {n.assignee && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{
                          width: 14, height: 14, borderRadius: '50%',
                          backgroundColor: n.assignee.color || '#6366f1',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 8, fontWeight: 900, color: '#fff'
                        }}>
                          {n.assignee.name?.charAt(0)}
                        </div>
                        <span>{n.assignee.name}</span>
                      </div>
                    )}
                    <span style={{
                      fontSize: 10, padding: '1px 5px', borderRadius: 4,
                      backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)'
                    }}>
                      {n.taskType === 'event' ? 'Sự kiện' : 'CV tháng'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>

    {/* Loading overlay */}
    {loadingTask && (
      <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
        <div style={{ padding:'18px 28px', borderRadius:12, backgroundColor:'var(--bg-surface)', fontSize:14, fontWeight:700, color:'var(--text-primary)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:16, height:16, border:'2.5px solid var(--border)', borderTopColor:'#0ea5e9', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
          Đang mở chi tiết...
        </div>
      </div>
    )}

    {/* Task Detail Modal */}
    {selectedTask && (
      <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)}/>
    )}
  </>
  );
}