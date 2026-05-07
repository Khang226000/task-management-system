import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, X, Eye, EyeOff, Users, CheckCircle, Building2 } from 'lucide-react';
import { userService, departmentService } from '../services/taskService';
import api from '../services/api';
import { showConfirm } from '../utils/confirm';

// ── Toast thông báo ──
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  const cfg = {
    success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', color: '#10b981', icon: '✅' },
    error:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)',  color: '#ef4444', icon: '❌' },
  }[type] || {};
  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
      zIndex: 99998, minWidth: 320, maxWidth: 420,
      backgroundColor: 'var(--bg-surface)',
      border: `1.5px solid ${cfg.border}`,
      borderRadius: 16, padding: '24px 28px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      animation: 'fadeInScale 0.2s ease'
    }}>
      <div style={{ fontSize: 36 }}>{cfg.icon}</div>
      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', margin: 0 }}>{message}</p>
      <button onClick={onClose} style={{ marginTop: 4, padding: '8px 24px', borderRadius: 8, border: 'none', backgroundColor: `${cfg.color}20`, color: cfg.color, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>OK</button>
    </div>
  );
}

const ROLE_CONFIG = {
  admin:    { label: 'Admin',         color: '#6366f1', bg: 'rgba(99,102,241,0.12)'  },
  director: { label: 'Giám đốc',     color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  manager:  { label: 'Phó Giám đốc', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  member:   { label: 'Nhân viên',    color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)'  },
};

// Phân quyền dựa trên role
const PERMISSION = {
  admin:    'Toàn quyền (quản lý users)',
  director: 'Toàn quyền (xem tất cả)',
  manager:  'Xem + quản lý task',
  member:   'Chỉ xem task của mình',
};

const COLORS = [
  '#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6',
  '#ec4899','#14b8a6','#f97316','#0ea5e9','#84cc16',
  '#d946ef','#06b6d4','#65a30d','#b45309','#be185d',
  '#0369a1','#15803d','#b91c1c','#92400e','#1d4ed8',
];

// Tạo ID hiển thị ngắn gọn
function shortId(id) {
  if (!id) return '—';
  return 'User' + id.substring(0, 4).toUpperCase();
}

export default function UsersPage() {
  const [users,     setUsers]     = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editUser,  setEditUser]  = useState(null);
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [toast,     setToast]     = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'member', color: '#0ea5e9', department: ''
  });

  // ── Department state ──────────────────────────────────
  const [departments,    setDepartments]    = useState([]);
  const [showDeptModal,  setShowDeptModal]  = useState(false);
  const [deptForm,       setDeptForm]       = useState({ code: '', name: '', color: '#6366f1' });
  const [deptLoading,    setDeptLoading]    = useState(false);
  const [deptError,      setDeptError]      = useState('');

  const fetchDepartments = useCallback(() => {
    departmentService.getAll()
      .then(r => setDepartments(r.data.data || []))
      .catch(console.error);
  }, []);

  const fetchUsers = () => {
    userService.getUsers().then(r => setUsers(r.data.data)).catch(console.error);
  };

  useEffect(() => { fetchUsers(); fetchDepartments(); }, []);

  const handleAddDept = async (e) => {
    e.preventDefault();
    setDeptError('');
    setDeptLoading(true);
    try {
      await departmentService.create(deptForm);
      fetchDepartments();
      setDeptForm({ code: '', name: '', color: '#6366f1' });
      setShowDeptModal(false);
      setToast({ message: `Đã thêm bộ phận "${deptForm.name}"`, type: 'success' });
      // Invalidate cache để FilterBar và TaskModal tự fetch lại
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('departments-updated'));
      }
    } catch (err) {
      setDeptError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setDeptLoading(false);
    }
  };

  const handleDeleteDept = async (dept) => {
    const ok = await showConfirm({ title: 'Xóa bộ phận', message: `Xóa bộ phận "${dept.name}"?`, confirmLabel: 'Xóa' });
    if (!ok) return;
    await departmentService.delete(dept.id);
    fetchDepartments();
    setToast({ message: `Đã xóa bộ phận "${dept.name}"`, type: 'success' });
  };

  const openAdd = () => {
    setEditUser(null);
    setForm({ name: '', email: '', password: '', role: 'member', color: '#0ea5e9' });
    setError(''); setShowPass(false);
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role, color: user.color || '#0ea5e9', department: user.department || '' });
    setError(''); setShowPass(false);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (editUser) {
        const payload = { name: form.name, email: form.email, role: form.role, color: form.color, department: form.department };
        if (form.password) payload.password = form.password;
        await userService.update(editUser.id, payload);
        setToast({ message: form.password ? `Đã cập nhật và đặt lại mật khẩu cho "${form.name}"` : `Đã cập nhật thông tin "${form.name}"`, type: 'success' });
      } else {
        await api.post('/auth/register', form);
        setToast({ message: `Đã tạo tài khoản "${form.name}" thành công`, type: 'success' });
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally { setLoading(false); }
  };

  const handleDelete = async (user) => {
    const ok = await showConfirm({ title: 'Vô hiệu hóa tài khoản', message: `Vô hiệu hóa tài khoản "${user.name}"? Người dùng sẽ không thể đăng nhập.`, confirmLabel: 'Vô hiệu hóa' });
    if (!ok) return;
    await userService.delete(user.id);
    setToast({ message: `Đã vô hiệu hóa tài khoản "${user.name}"`, type: 'success' });
    fetchUsers();
  };

  const HEADERS = ['ID', 'Tên', 'Email', 'Bộ phận', 'Vai trò', 'Màu Avatar', 'Phân quyền', 'Thao tác'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Toast thông báo */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={22} style={{ color: '#0ea5e9' }} />
          <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
            Quản Lý Người Dùng
          </h2>
          <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 10, backgroundColor: '#0ea5e920', color: '#0ea5e9', fontWeight: 700 }}>
            {users.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowDeptModal(true)} className="btn btn-secondary">
            <Building2 size={15} /> Quản lý bộ phận
          </button>
          <button onClick={openAdd} className="btn btn-primary">
            <Plus size={15} /> Thêm Người Dùng
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1.5px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-hover)' }}>
                {HEADERS.map((h, i) => (
                  <th key={i} style={{
                    padding: '12px 16px', fontSize: 12, fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    color: i === 0 ? '#0ea5e9' : i === 3 ? '#f59e0b' : i === 4 ? '#ec4899' : i === 5 ? '#10b981' : i === 6 ? '#f59e0b' : 'var(--text-muted)',
                    borderBottom: '1.5px solid var(--border)', textAlign: 'left', whiteSpace: 'nowrap'
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                    Chưa có người dùng nào
                  </td>
                </tr>
              ) : users.map((user, idx) => {
                const role = ROLE_CONFIG[user.role] || ROLE_CONFIG.member;
                const perm = PERMISSION[user.role] || 'Chỉ xem';
                return (
                  <tr key={user.id}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* ID */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-muted)' }}>
                        User{idx + 1}
                      </span>
                    </td>

                    {/* Tên */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', backgroundColor: user.color || '#6366f1',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 900, color: '#fff', flexShrink: 0
                        }}>
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{user.email}</span>
                    </td>

                    {/* Bộ phận */}
                    <td style={{ padding: '12px 16px' }}>
                      {user.department ? (
                        <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 5, fontWeight: 700, backgroundColor: 'rgba(14,165,233,0.1)', color: '#0ea5e9' }}>
                          {user.department}
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                    </td>

                    {/* Vai trò */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 12, padding: '3px 10px', borderRadius: 6, fontWeight: 700,
                        backgroundColor: role.bg, color: role.color
                      }}>
                        {role.label}
                      </span>
                    </td>

                    {/* Màu Avatar */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: user.color || '#6366f1', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                          {user.color || '#6366f1'}
                        </span>
                      </div>
                    </td>

                    {/* Phân quyền */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: perm.includes('Toàn quyền') ? '#10b981' : perm.includes('Xem +') ? '#f59e0b' : 'var(--text-secondary)'
                      }}>
                        {perm}
                      </span>
                    </td>

                    {/* Thao tác */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(user)}
                          style={{ padding: '5px 10px', borderRadius: 7, border: 'none', backgroundColor: 'rgba(99,102,241,0.12)', color: '#818cf8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Chỉnh sửa">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(user)}
                          style={{ padding: '5px 10px', borderRadius: 7, border: 'none', backgroundColor: 'rgba(239,68,68,0.12)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Vô hiệu hóa">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal thêm/sửa */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: 480 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0ea5e9', margin: 0 }}>
                {editUser ? 'Chỉnh sửa Người Dùng' : 'Thêm Người Dùng'}
              </h3>
              <button onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 13, color: '#ef4444' }}>
                  {error}
                </div>
              )}

              {/* Tên người dùng */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 7 }}>Tên người dùng</label>
                <input className="input" placeholder="Nhập tên..." value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required style={{ fontSize: 14 }} />
              </div>

              {/* Vai trò + Phân quyền */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 7 }}>Vai trò</label>
                  <select className="select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ fontSize: 14 }}>
                    <option value="member">Nhân viên</option>
                    <option value="manager">Phó Giám đốc</option>
                    <option value="director">Giám đốc</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 7 }}>Phân quyền</label>
                  <div style={{
                    padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)',
                    backgroundColor: 'var(--bg-input)', fontSize: 14, fontWeight: 700,
                    color: PERMISSION[form.role]?.includes('Toàn quyền') ? '#10b981' : PERMISSION[form.role]?.includes('Xem +') ? '#f59e0b' : 'var(--text-secondary)'
                  }}>
                    {PERMISSION[form.role] || 'Chỉ xem'}
                  </div>
                </div>
              </div>

              {/* Bộ phận */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 7 }}>Bộ phận</label>
                <select className="select" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} style={{ fontSize: 14 }}>
                  <option value="">— Chưa phân bộ phận</option>
                  {departments.length > 0
                    ? departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)
                    : <>
                        <option value="Ban Giám đốc">Ban Giám đốc</option>
                        <option value="KN&DMST">KN&DMST</option>
                        <option value="Hành chính tổng hợp">Hành chính tổng hợp</option>
                        <option value="Thông tin thống kê">Thông tin thống kê</option>
                        <option value="Dịch vụ">Dịch vụ</option>
                      </>
                  }
                </select>
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 7 }}>Email đăng nhập</label>
                <input type="email" className="input" placeholder="email@qlcv.vn" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required style={{ fontSize: 14 }} />
              </div>

              {/* Mật khẩu */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 7 }}>
                  {editUser
                    ? <span>Đặt lại mật khẩu <span style={{ fontSize: 11, fontWeight: 400, color: '#f59e0b' }}>(để trống nếu không đổi)</span></span>
                    : 'Mật khẩu'
                  }
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input"
                    placeholder="Nhập mật khẩu..."
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required={!editUser}
                    style={{ fontSize: 14, paddingRight: 44 }}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Màu Avatar */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 7 }}>Màu Avatar</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', backgroundColor: c, border: 'none', cursor: 'pointer',
                        outline: form.color === c ? `3px solid ${c}` : 'none',
                        outlineOffset: 2,
                        transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                        transition: 'transform 0.15s'
                      }} />
                  ))}
                </div>
                {/* Color picker tùy chỉnh */}
                <input type="color" value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  style={{ width: '100%', height: 44, borderRadius: 10, border: '1.5px solid var(--border)', cursor: 'pointer', padding: 4, backgroundColor: 'var(--bg-input)' }} />
              </div>

              {/* Preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, backgroundColor: 'var(--bg-hover)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: form.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                  {form.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{form.name || 'Tên người dùng'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{form.email || 'email@qlcv.vn'} · {ROLE_CONFIG[form.role]?.label}</div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Hủy</button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ minWidth: 80 }}>
                  {loading ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Quản lý bộ phận ── */}
      {showDeptModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDeptModal(false)}>
          <div className="modal-content" style={{ maxWidth: 520 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Building2 size={18} style={{ color: '#0ea5e9' }} />
                <h3 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Quản lý bộ phận</h3>
              </div>
              <button onClick={() => setShowDeptModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Form thêm bộ phận mới */}
              <div style={{ backgroundColor: 'var(--bg-hover)', borderRadius: 12, padding: '16px 18px', border: '1.5px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  ➕ Thêm bộ phận mới
                </div>
                <form onSubmit={handleAddDept} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {deptError && (
                    <div style={{ padding: '8px 12px', borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 13, color: '#ef4444' }}>
                      {deptError}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 8, alignItems: 'end' }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>MÃ BỘ PHẬN *</label>
                      <input
                        className="input"
                        placeholder="VD: HC-TH"
                        value={deptForm.code}
                        onChange={e => setDeptForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                        required
                        style={{ fontSize: 13, fontFamily: 'monospace' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>TÊN BỘ PHẬN *</label>
                      <input
                        className="input"
                        placeholder="VD: Hành chính tổng hợp"
                        value={deptForm.name}
                        onChange={e => setDeptForm(f => ({ ...f, name: e.target.value }))}
                        required
                        style={{ fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>MÀU</label>
                      <input
                        type="color"
                        value={deptForm.color}
                        onChange={e => setDeptForm(f => ({ ...f, color: e.target.value }))}
                        style={{ width: 44, height: 40, borderRadius: 8, border: '1.5px solid var(--border)', cursor: 'pointer', padding: 3, backgroundColor: 'var(--bg-input)' }}
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={deptLoading} className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>
                    <Plus size={14} /> {deptLoading ? 'Đang lưu...' : 'Thêm bộ phận'}
                  </button>
                </form>
              </div>

              {/* Danh sách bộ phận hiện có */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 10 }}>
                  Danh sách bộ phận ({departments.length})
                </div>
                {departments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: 13 }}>
                    Chưa có bộ phận nào
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {departments.map(dept => (
                      <div key={dept.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', borderRadius: 10,
                        backgroundColor: 'var(--bg-surface)',
                        border: '1.5px solid var(--border)',
                      }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: dept.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 800, color: dept.color, backgroundColor: `${dept.color}15`, padding: '2px 8px', borderRadius: 5 }}>
                          {dept.code}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
                          {dept.name}
                        </span>
                        <button
                          onClick={() => handleDeleteDept(dept)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 6 }}
                          title="Xóa bộ phận"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '12px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeptModal(false)} className="btn btn-secondary">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
