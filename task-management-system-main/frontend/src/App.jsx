import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import ConfirmDialog from './components/ConfirmDialog';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UnifiedKanbanPage from './pages/UnifiedKanbanPage';
import UnifiedListPage from './pages/UnifiedListPage';
import UnifiedCalendarPage from './pages/UnifiedCalendarPage';
import StatsPage from './pages/StatsPage';
import StatsEventPage from './pages/StatsEventPage';
import StatsMonthlyPage from './pages/StatsMonthlyPage';
import UsersPage from './pages/UsersPage';
import MyTasksPage from './pages/MyTasksPage';
import TeamTasksPage from './pages/TeamTasksPage';
import HistoryPage from './pages/HistoryPage';
import TaskTemplatesPage from './pages/TaskTemplatesPage';
import PaymentPage from './pages/PaymentPage';
import ProfilePage from './pages/ProfilePage';

// ── Helpers phân quyền ──
// admin    : Toàn quyền (quản lý users, mọi trang)
// director : Giám đốc   (xem tất cả, không quản lý users)
// manager  : Phó GĐ     (xem tất cả, không quản lý users)
// member   : Nhân viên  (chỉ trang "Công việc của tôi")

const canViewDashboard = (role) => ['admin','director','manager'].includes(role);
const canManageUsers   = (role) => role === 'admin';
const isMemberOnly     = (role) => role === 'member';

function PrivateRoute({ children }) {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" replace />;
}

// Chỉ admin/director/manager
function StaffRoute({ children }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (isMemberOnly(user.role)) return <Navigate to="/my-tasks" replace />;
  return children;
}

// Chỉ admin
function AdminOnlyRoute({ children }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (!canManageUsers(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { user } = useAuthStore();

  const defaultPath = isMemberOnly(user?.role) ? '/my-tasks' : '/kanban';

  return (
    <BrowserRouter>
      <ConfirmDialog />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to={defaultPath} replace />} />

          {/* ── Admin / Director / Manager ── */}
          <Route path="dashboard" element={<Navigate to="/kanban" replace />} />
          <Route path="kanban"    element={<StaffRoute><UnifiedKanbanPage /></StaffRoute>} />
          <Route path="list"      element={<StaffRoute><UnifiedListPage /></StaffRoute>} />
          <Route path="calendar"  element={<StaffRoute><UnifiedCalendarPage /></StaffRoute>} />
          <Route path="stats"          element={<StaffRoute><StatsPage /></StaffRoute>} />
          <Route path="stats/event"   element={<StaffRoute><StatsEventPage /></StaffRoute>} />
          <Route path="stats/monthly" element={<StaffRoute><StatsMonthlyPage /></StaffRoute>} />
          <Route path="history"       element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
          <Route path="payments"      element={<StaffRoute><PaymentPage /></StaffRoute>} />

          {/* ── Admin only ── */}
          <Route path="users" element={<AdminOnlyRoute><UsersPage /></AdminOnlyRoute>} />

          {/* ── Tất cả đều vào được ── */}
          <Route path="my-tasks"   element={<PrivateRoute><MyTasksPage /></PrivateRoute>} />
          <Route path="team-tasks" element={<PrivateRoute><TeamTasksPage /></PrivateRoute>} />
          <Route path="profile"    element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
