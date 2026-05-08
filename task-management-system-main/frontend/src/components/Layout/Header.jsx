import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Sun, Moon, Bell } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useNotificationStore } from '../../store/notificationStore';

import NotificationPanel from '../Notifications/NotificationPanel';

const PAGE_TITLES = {
  '/dashboard': '🏠 Tổng quan',
  '/kanban':    '📊 Bảng tiến độ',
  '/list':      '📝 Danh sách',
  '/calendar':  '📅 Lịch trình',
  '/stats':     '📊 Thống kê',
  '/users':     '👥 Người dùng',
  '/templates': '📖 Danh sách CV',
  '/history':   '🕐 Lịch sử'
};

// Polling interval: 5 phút (giảm tải server)
const POLL_INTERVAL = 5 * 60 * 1000;

export default function Header({ onToggleSidebar, isMobile }) {
  const location = useLocation();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { fetch: fetchNotifications, unreadCount, counts } = useNotificationStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const bellRef = useRef(null);

  const isDark = theme === 'dark';
  const title  = PAGE_TITLES[location.pathname] || 'TaskMaster';
  const unread = unreadCount();

  // Fetch ngay khi mount, sau đó poll mỗi 60s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="app-header h-[68px] flex items-center px-5 gap-4 shrink-0">
        {/* Hamburger */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <h1 className="text-base font-bold hidden sm:block" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>

        {/* Search */}
        {/* Đã chuyển search vào từng tab — bỏ ở header */}

        <div className="flex items-center gap-2 ml-auto">

          {/* Bell + Notification Panel */}
          <div ref={bellRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(v => !v)}
              className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)] relative"
              style={{ color: unread > 0 ? '#f59e0b' : 'var(--text-secondary)' }}
              title="Thông báo deadline"
            >
              <Bell size={17} />
              {unread > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  minWidth: 16, height: 16, borderRadius: 8,
                  backgroundColor: counts.overdue > 0 ? '#ef4444' : '#f59e0b',
                  color: '#fff', fontSize: 9, fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px', lineHeight: 1
                }}>
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>

            <NotificationPanel
              open={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
          </div>

          {/* Theme toggle — ẩn trên mobile nhỏ */}
          {!isMobile && (
          <button
            onClick={toggleTheme}
            title={isDark ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
            className="theme-switch"
          >
            <Sun
              size={15}
              className="theme-switch-icon"
              style={{
                color: isDark ? 'var(--text-muted)' : '#f59e0b',
                opacity: isDark ? 0.4 : 1,
                transform: isDark ? 'scale(0.8) rotate(-30deg)' : 'scale(1) rotate(0deg)'
              }}
            />
            <div
              className="theme-switch-track"
              style={{ backgroundColor: isDark ? '#0284c7' : '#cbd5e1' }}
            >
              <div
                className="theme-switch-thumb"
                style={{ transform: isDark ? 'translateX(20px)' : 'translateX(0px)' }}
              />
            </div>
            <Moon
              size={15}
              className="theme-switch-icon"
              style={{
                color: isDark ? '#38bdf8' : 'var(--text-muted)',
                opacity: isDark ? 1 : 0.4,
                transform: isDark ? 'scale(1) rotate(0deg)' : 'scale(0.8) rotate(30deg)'
              }}
            />
          </button>
          )}

          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer shrink-0"
            style={{ backgroundColor: user?.color || '#6366f1' }}
            title={user?.name}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>
    </>
  );
}
