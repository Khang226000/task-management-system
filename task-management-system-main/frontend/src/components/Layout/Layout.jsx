import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationToastContainer from '../Notifications/NotificationToast';
import OfflineBanner from '../OfflineBanner';
import { useAuthStore } from '../../store/authStore';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useOfflineStore } from '../../store/offlineStore';
import { useTaskStore } from '../../store/taskStore';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { refreshUser } = useAuthStore();

  // Khởi động network listener
  useNetworkStatus();
  const { isOnline, syncPending } = useOfflineStore();
  const { fetchKanban, fetchTree, fetchTasks } = useTaskStore();

  useEffect(() => { refreshUser(); }, []);

  // Khi có mạng lại → tự động sync dữ liệu mới nhất
  useEffect(() => {
    if (isOnline && syncPending) {
      fetchKanban();
      fetchTree();
      fetchTasks();
    }
  }, [isOnline, syncPending]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setSidebarOpen(v => !v);
  const closeSidebar  = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* Banner offline — hiện ở trên cùng khi mất mạng */}
      <OfflineBanner />

      {/* Mobile overlay backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={closeSidebar}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            backgroundColor: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Sidebar — fixed on mobile, normal on desktop */}
      <div style={{
        position: isMobile ? 'fixed' : 'relative',
        top: 0, left: 0, bottom: 0,
        zIndex: isMobile ? 50 : 'auto',
        transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        flexShrink: 0,
      }}>
        <Sidebar open={isMobile ? true : sidebarOpen} onClose={closeSidebar} isMobile={isMobile} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden" style={{ minWidth: 0, paddingTop: isOnline ? 0 : 52 }}>
        <Header onToggleSidebar={toggleSidebar} isMobile={isMobile} />
        <main
          className="flex-1 overflow-auto"
          style={{
            color: 'var(--text-primary)',
            padding: isMobile ? '12px 12px 80px' : '16px',
          }}
        >
          <Outlet />
        </main>
      </div>

      <NotificationToastContainer />
    </div>
  );
}
