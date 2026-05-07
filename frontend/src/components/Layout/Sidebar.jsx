import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Kanban, List, Calendar, BarChart2, Users, LogOut, ClipboardList, KeyRound, History, ChevronDown, ChevronRight, CreditCard, UserCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ChangePasswordModal } from '../../pages/MyTasksPage';

const ADMIN_NAV = [
  { to: '/kanban',    icon: Kanban,       label: 'Bảng tiến độ' },
  { to: '/list',      icon: List,         label: 'Danh sách' },
  { to: '/calendar',  icon: Calendar,     label: 'Lịch trình' },
  { to: '/payments',  icon: CreditCard,   label: 'Phụ trách TT' },
  { to: '/history',   icon: History,      label: 'Lịch sử' },
];

const STATS_SUB = [
  { to: '/stats/event',   emoji: '📋', label: 'Sự kiện' },
  { to: '/stats/monthly', emoji: '📅', label: 'CV hằng tháng' },
];

const MEMBER_NAV = [
  { to: '/my-tasks',   icon: ClipboardList, label: 'Công việc của tôi' },
  { to: '/team-tasks', icon: Users,         label: 'Công việc nhóm' },
  { to: '/history',    icon: History,       label: 'Lịch sử' },
];

const ROLE_BADGE = {
  admin:    { label: 'Admin',         color: '#6366f1' },
  director: { label: 'Giám đốc',     color: '#10b981' },
  manager:  { label: 'Phó Giám đốc', color: '#f59e0b' },
  member:   { label: 'Nhân viên',    color: '#0ea5e9' },
};

export default function Sidebar({ open, onClose, isMobile }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [statsOpen, setStatsOpen] = useState(
    location.pathname.startsWith('/stats')
  );

  const isAdmin  = user?.role === 'admin';
  const isStaff  = ['admin','director','manager'].includes(user?.role);
  const navItems = isStaff ? ADMIN_NAV : MEMBER_NAV;
  const roleBadge = ROLE_BADGE[user?.role] || ROLE_BADGE.member;

  const statsActive = location.pathname.startsWith('/stats');

  return (
    <>
    <aside className="app-sidebar flex flex-col shrink-0 transition-all duration-300"
      style={{ width: isMobile ? '240px' : (open ? '210px' : '58px'), height: '100%' }}>

      {/* Logo */}
      <div style={{ height: 68, display: 'flex', alignItems: 'center', padding: '0 14px', borderBottom: '1.5px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', flex: 1 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#6366f1,#0ea5e9)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </div>
          {(open || isMobile) && (
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>Quản lý CV</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>v2.0</div>
            </div>
          )}
        </div>
        {/* Close button on mobile */}
        {isMobile && (
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, display: 'flex', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 6px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} title={(!open && !isMobile) ? label : undefined}
            onClick={isMobile ? onClose : undefined}
            className={({ isActive }) =>
              `sidebar-item flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold overflow-hidden ${isActive ? 'active' : ''}`
            }>
            <Icon size={18} className="shrink-0" />
            {(open || isMobile) && <span className="truncate">{label}</span>}
          </NavLink>
        ))}

        {/* Thống kê — chỉ staff */}
        {isStaff && (
          <div>
            {/* Nút mở/đóng submenu */}
            <button
              title={(!open && !isMobile) ? 'Thống kê' : undefined}
              onClick={() => {
                if (!open && !isMobile) {
                  navigate('/stats/event');
                } else {
                  setStatsOpen(v => !v);
                }
              }}
              className={`sidebar-item w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold overflow-hidden ${statsActive ? 'active' : ''}`}
            >
              <BarChart2 size={18} className="shrink-0" />
              {(open || isMobile) && (
                <>
                  <span className="truncate flex-1 text-left">Thống kê</span>
                  {statsOpen
                    ? <ChevronDown size={14} style={{ flexShrink: 0, opacity: 0.6 }} />
                    : <ChevronRight size={14} style={{ flexShrink: 0, opacity: 0.6 }} />
                  }
                </>
              )}
            </button>

            {/* Submenu items */}
            {(open || isMobile) && statsOpen && (
              <div style={{ marginLeft: 12, marginTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {STATS_SUB.map(({ to, emoji, label }) => (
                  <NavLink key={to} to={to}
                    onClick={isMobile ? onClose : undefined}
                    className={({ isActive }) =>
                      `sidebar-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold overflow-hidden ${isActive ? 'active' : ''}`
                    }
                    style={{ paddingLeft: 14 }}
                  >
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{emoji}</span>
                    <span className="truncate">{label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '10px 6px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Users — chỉ admin */}
        {isAdmin && (
          <NavLink to="/users" title={(!open && !isMobile) ? 'Người dùng' : undefined}
            onClick={isMobile ? onClose : undefined}
            className={({ isActive }) =>
              `sidebar-item flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold overflow-hidden ${isActive ? 'active' : ''}`
            }>
            <Users size={18} className="shrink-0" />
            {(open || isMobile) && <span className="truncate">Người dùng</span>}
          </NavLink>
        )}

        <NavLink to="/profile" title={(!open && !isMobile) ? 'Tài khoản' : undefined}
          onClick={isMobile ? onClose : undefined}
          className={({ isActive }) =>
            `sidebar-item flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold overflow-hidden ${isActive ? 'active' : ''}`
          }>
          <UserCircle size={18} className="shrink-0" />
          {(open || isMobile) && <span className="truncate">Tài khoản</span>}
        </NavLink>

        <button onClick={() => setShowChangePwd(true)}
          title={(!open && !isMobile) ? 'Đổi mật khẩu' : undefined}
          className="sidebar-item w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold overflow-hidden hover:text-sky-400 hover:bg-sky-500/10">
          <KeyRound size={18} className="shrink-0" />
          {(open || isMobile) && <span className="truncate">Đổi mật khẩu</span>}
        </button>

        <button onClick={() => setShowLogoutConfirm(true)}
          title={(!open && !isMobile) ? 'Đăng xuất' : undefined}
          className="sidebar-item w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold overflow-hidden hover:text-red-400 hover:bg-red-500/10">
          <LogOut size={18} className="shrink-0" />
          {(open || isMobile) && <span className="truncate">Đăng xuất</span>}
        </button>

        {/* User info */}
        {(open || isMobile) && user && (
          <div style={{ marginTop: 6, padding: '10px 12px', borderRadius: 12, backgroundColor: 'var(--bg-hover)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: user.color || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: roleBadge.color, marginTop: 1 }}>{roleBadge.label}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>

    {showChangePwd && createPortal(
      <ChangePasswordModal onClose={() => setShowChangePwd(false)} />,
      document.body
    )}

    {showLogoutConfirm && createPortal(
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowLogoutConfirm(false)}>
        <div className="modal-content" style={{ maxWidth: 380, width: '100%' }}>
          <div style={{ padding: '32px 28px 16px', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <LogOut size={26} style={{ color: '#ef4444' }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px' }}>Xác nhận đăng xuất</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
              Bạn có chắc muốn đăng xuất khỏi hệ thống không?
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, padding: '16px 28px 28px' }}>
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="btn btn-secondary"
              style={{ flex: 1, justifyContent: 'center', minHeight: 44 }}
            >
              Hủy
            </button>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="btn btn-danger"
              style={{ flex: 1, justifyContent: 'center', minHeight: 44 }}
            >
              <LogOut size={16} /> Đăng xuất
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
