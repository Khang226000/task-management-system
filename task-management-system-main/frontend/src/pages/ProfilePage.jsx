import React, { useState } from 'react';
import { User, Save, CheckCircle, Eye, EyeOff, KeyRound, Palette } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

// Bộ phận cho nhân viên thường (không có Ban Giám đốc)
const DEPT_OPTIONS_MEMBER = ['KN&DMST', 'Hành chính tổng hợp', 'Thông tin thống kê', 'Dịch vụ'];
// Bộ phận đầy đủ cho admin
const DEPT_OPTIONS_ADMIN  = ['KN&DMST', 'Hành chính tổng hợp', 'Thông tin thống kê', 'Dịch vụ', 'Ban Giám đốc'];

const AVATAR_COLORS = [
  '#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444',
  '#8b5cf6','#ec4899','#14b8a6','#f97316','#06b6d4',
  '#84cc16','#a855f7','#64748b','#dc2626','#059669',
];

const ROLE_LABELS = {
  admin:    'Quản trị viên',
  director: 'Giám đốc',
  manager:  'Phó Giám đốc',
  member:   'Nhân viên',
};

export default function ProfilePage() {
  const { user, refreshUser } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  // Bộ phận được phép chọn tùy theo role
  const deptOptions = isAdmin ? DEPT_OPTIONS_ADMIN : DEPT_OPTIONS_MEMBER;
  // Nếu user đang ở Ban Giám đốc nhưng không phải admin → không cho đổi
  const isDeptLocked = !isAdmin && user?.department === 'KN&DMST';

  // Profile form
  const [name,       setName]       = useState(user?.name || '');
  const [color,      setColor]      = useState(user?.color || '#6366f1');
  const [department, setDepartment] = useState(user?.department || '');
  const [saving,     setSaving]     = useState(false);
  const [saveOk,     setSaveOk]     = useState(false);
  const [saveErr,    setSaveErr]    = useState('');

  // Password form
  const [curPwd,   setCurPwd]   = useState('');
  const [newPwd,   setNewPwd]   = useState('');
  const [conPwd,   setConPwd]   = useState('');
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [pwdSaving,setPwdSaving]= useState(false);
  const [pwdOk,    setPwdOk]    = useState(false);
  const [pwdErr,   setPwdErr]   = useState('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setSaveErr('Tên không được để trống');
    setSaving(true); setSaveErr(''); setSaveOk(false);
    try {
      await api.put('/auth/profile', { name: name.trim(), color, department });
      await refreshUser();
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    } catch(err) {
      setSaveErr(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally { setSaving(false); }
  };

  const handleChangePwd = async (e) => {
    e.preventDefault();
    if (newPwd.length < 6) return setPwdErr('Mật khẩu mới phải ít nhất 6 ký tự');
    if (newPwd !== conPwd)  return setPwdErr('Mật khẩu xác nhận không khớp');
    setPwdSaving(true); setPwdErr(''); setPwdOk(false);
    try {
      await api.put('/auth/change-password', { currentPassword: curPwd, newPassword: newPwd });
      setPwdOk(true);
      setCurPwd(''); setNewPwd(''); setConPwd('');
      setTimeout(() => setPwdOk(false), 3000);
    } catch(err) {
      setPwdErr(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally { setPwdSaving(false); }
  };

  const inputStyle = {
    width:'100%', boxSizing:'border-box',
    backgroundColor:'var(--bg-input)', border:'1.5px solid var(--border)',
    borderRadius:10, padding:'10px 14px', fontSize:14,
    color:'var(--text-primary)', outline:'none'
  };

  const Label = ({ children }) => (
    <label style={{ display:'block', fontSize:12, fontWeight:700, color:'var(--text-secondary)', marginBottom:6 }}>{children}</label>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, maxWidth:640, margin:'0 auto' }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize:22, fontWeight:900, color:'var(--text-primary)', margin:0, display:'flex', alignItems:'center', gap:10 }}>
          <User size={22} style={{ color:'#0ea5e9' }}/> Thông tin cá nhân
        </h2>
        <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>
          Cập nhật tên hiển thị, màu avatar và thông tin cá nhân
        </p>
      </div>

      {/* Avatar preview */}
      <div style={{ display:'flex', alignItems:'center', gap:20, padding:'20px 24px', backgroundColor:'var(--bg-surface)', borderRadius:16, border:'1.5px solid var(--border)' }}>
        <div style={{ width:72, height:72, borderRadius:'50%', backgroundColor:color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:900, color:'#fff', flexShrink:0, boxShadow:`0 0 0 4px ${color}30` }}>
          {name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--text-primary)' }}>{name || 'Chưa đặt tên'}</div>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:3 }}>{user?.email}</div>
          <div style={{ fontSize:12, fontWeight:700, color:'#0ea5e9', marginTop:4 }}>
            {ROLE_LABELS[user?.role] || user?.role}
            {user?.department && ` · ${user.department}`}
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div style={{ backgroundColor:'var(--bg-surface)', borderRadius:16, border:'1.5px solid var(--border)', padding:'22px 24px' }}>
        <h3 style={{ fontSize:15, fontWeight:800, color:'var(--text-primary)', margin:'0 0 18px', display:'flex', alignItems:'center', gap:8 }}>
          <User size={16} style={{ color:'#0ea5e9' }}/> Thông tin cơ bản
        </h3>
        <form onSubmit={handleSaveProfile} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {saveErr && (
            <div style={{ padding:'10px 14px', borderRadius:8, backgroundColor:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', fontSize:13, color:'#ef4444' }}>{saveErr}</div>
          )}
          {saveOk && (
            <div style={{ padding:'10px 14px', borderRadius:8, backgroundColor:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', fontSize:13, color:'#10b981', display:'flex', alignItems:'center', gap:6 }}>
              <CheckCircle size={14}/> Đã cập nhật thành công!
            </div>
          )}

          <div>
            <Label>Họ tên hiển thị *</Label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Nhập tên của bạn..." required/>
          </div>

          <div>
            <Label>Bộ phận</Label>
            {isDeptLocked ? (
              <div style={{ ...inputStyle, color: 'var(--text-muted)', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{user?.department}</span>
                <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>🔒 Chỉ admin mới đổi được</span>
              </div>
            ) : (
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={department} onChange={e => setDepartment(e.target.value)}>
                <option value="">-- Chọn bộ phận --</option>
                {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
          </div>

          {/* Màu avatar */}
          <div>
            <Label>Màu avatar</Label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>
              {AVATAR_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  style={{ width:32, height:32, borderRadius:'50%', backgroundColor:c, border:`3px solid ${color===c ? '#fff' : 'transparent'}`, cursor:'pointer', outline: color===c ? `2px solid ${c}` : 'none', outlineOffset:2, transition:'all 0.15s' }}
                  title={c}/>
              ))}
            </div>
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end', paddingTop:4 }}>
            <button type="submit" disabled={saving || saveOk} className="btn btn-primary"
              style={{ background: saveOk ? 'linear-gradient(135deg,#10b981,#059669)' : undefined }}>
              {saveOk ? <><CheckCircle size={15}/> Đã lưu!</> : saving ? 'Đang lưu...' : <><Save size={15}/> Lưu thay đổi</>}
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div style={{ backgroundColor:'var(--bg-surface)', borderRadius:16, border:'1.5px solid var(--border)', padding:'22px 24px' }}>
        <h3 style={{ fontSize:15, fontWeight:800, color:'var(--text-primary)', margin:'0 0 18px', display:'flex', alignItems:'center', gap:8 }}>
          <KeyRound size={16} style={{ color:'#f59e0b' }}/> Đổi mật khẩu
        </h3>
        <form onSubmit={handleChangePwd} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {pwdErr && (
            <div style={{ padding:'10px 14px', borderRadius:8, backgroundColor:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', fontSize:13, color:'#ef4444' }}>{pwdErr}</div>
          )}
          {pwdOk && (
            <div style={{ padding:'10px 14px', borderRadius:8, backgroundColor:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', fontSize:13, color:'#10b981', display:'flex', alignItems:'center', gap:6 }}>
              <CheckCircle size={14}/> Đổi mật khẩu thành công!
            </div>
          )}

          {[
            { label:'Mật khẩu hiện tại', val:curPwd, set:setCurPwd, show:showCur, toggle:()=>setShowCur(v=>!v) },
            { label:'Mật khẩu mới',      val:newPwd, set:setNewPwd, show:showNew, toggle:()=>setShowNew(v=>!v) },
            { label:'Xác nhận mật khẩu mới', val:conPwd, set:setConPwd, show:showNew, toggle:()=>setShowNew(v=>!v) },
          ].map((f,i) => (
            <div key={i}>
              <Label>{f.label}</Label>
              <div style={{ position:'relative' }}>
                <input type={f.show ? 'text' : 'password'} value={f.val}
                  onChange={e => { f.set(e.target.value); setPwdErr(''); }}
                  required style={{ ...inputStyle, paddingRight:44 }}
                  placeholder="••••••••"
                  autoComplete={i===0 ? 'current-password' : 'new-password'}/>
                <button type="button" onClick={f.toggle}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', padding:0 }}>
                  {f.show ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>
          ))}

          <div style={{ display:'flex', justifyContent:'flex-end', paddingTop:4 }}>
            <button type="submit" disabled={pwdSaving || pwdOk} className="btn btn-primary"
              style={{ background: pwdOk ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
              {pwdOk ? <><CheckCircle size={15}/> Đã đổi!</> : pwdSaving ? 'Đang lưu...' : <><KeyRound size={15}/> Đổi mật khẩu</>}
            </button>
          </div>
        </form>
      </div>

      {/* Account info (readonly) */}
      <div style={{ backgroundColor:'var(--bg-surface)', borderRadius:16, border:'1.5px solid var(--border)', padding:'18px 24px' }}>
        <h3 style={{ fontSize:14, fontWeight:800, color:'var(--text-secondary)', margin:'0 0 12px' }}>Thông tin tài khoản</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[
            { label:'Email', value: user?.email },
            { label:'Vai trò', value: ROLE_LABELS[user?.role] || user?.role },
            { label:'Trạng thái', value: user?.isActive ? '✅ Đang hoạt động' : '❌ Đã khóa' },
            { label:'ID', value: user?.id?.slice(0,8)+'...' },
          ].map(f => (
            <div key={f.label} style={{ padding:'8px 12px', borderRadius:8, backgroundColor:'var(--bg-hover)' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', marginBottom:3 }}>{f.label.toUpperCase()}</div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', fontFamily: f.label==='ID'?'monospace':undefined }}>{f.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
