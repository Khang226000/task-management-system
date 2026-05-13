
import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, Clock, AlertTriangle, TrendingUp, Save, KeyRound, Eye, EyeOff, X, Paperclip, Upload, Trash2, FileText, Image, File, Filter } from 'lucide-react';
import { taskService, monthlyTaskService } from '../services/taskService';
import { useAuthStore } from '../store/authStore';
import { STATUS_CONFIG, WORK_CATEGORY, YEARS } from '../utils/constants';
import { format } from 'date-fns';
import api from '../services/api';
import { useFilterStore } from '../store/filterStore';
import FileAttachmentList from '../components/Tasks/FilePreview';
import { showConfirm } from '../utils/confirm';

const ML = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

// Safe date format — tránh crash khi date không hợp lệ
function safeFormat(dateStr, fmt = 'd/M/yyyy') {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return format(d, fmt);
  } catch { return ''; }
}

// ── Màu thanh tiến độ theo % ──
function progressColor(p) {
  if (p === 100) return '#10b981';
  if (p >= 70)  return '#0ea5e9';
  if (p >= 40)  return '#f59e0b';
  return '#ef4444';
}

// ── Thanh tiến độ đẹp ──
function ProgressBar({ value, height = 8 }) {
  const color = progressColor(value);
  return (
    <div style={{ width: '100%', height, borderRadius: height/2, backgroundColor: 'var(--bg-hover)', overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: height/2,
        width: `${value}%`,
        background: value === 100
          ? 'linear-gradient(90deg,#10b981,#34d399)'
          : `linear-gradient(90deg,${color},${color}cc)`,
        transition: 'width 0.4s ease',
        boxShadow: `0 0 8px ${color}60`
      }} />
    </div>
  );
}

// ── Helpers ──
const BASE_URL = 'http://localhost:5000';

function fileIcon(mime) {
  if (!mime) return <File size={16}/>;
  if (mime.startsWith('image/')) return <Image size={16} style={{ color:'#0ea5e9' }}/>;
  if (mime === 'application/pdf') return <FileText size={16} style={{ color:'#ef4444' }}/>;
  return <FileText size={16} style={{ color:'#f59e0b' }}/>;
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/1024/1024).toFixed(1) + ' MB';
}

// ── Khu vực đính kèm file ──
function AttachmentSection({ taskId, taskType, attachments: initAttachments, onAttachmentsChange }) {
  const [attachments, setAttachments] = useState(initAttachments || []);
  const [uploading, setUploading]     = useState(false);
  const [error, setError]             = useState('');

  const endpoint = taskType === 'event' ? 'task' : 'monthly';

  const updateAttachments = (newList) => {
    setAttachments(newList);
    onAttachmentsChange?.(newList);
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setError('');
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await api.post(`/upload/${endpoint}/${taskId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        updateAttachments([...attachments, res.data.data]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload thất bại');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (filename) => {
    const ok = await showConfirm({ title: 'Xóa file', message: 'Xóa file này?', confirmLabel: 'Xóa' });
    if (!ok) return;
    try {
      await api.delete(`/upload/${endpoint}/${taskId}/${filename}`);
      updateAttachments(attachments.filter(f => f.filename !== filename));
    } catch (err) {
      setError('Xóa file thất bại');
    }
  };

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <Paperclip size={13} style={{ color:'var(--text-muted)' }}/>
          <span style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)' }}>
            Kết quả đầu ra / Tài liệu đính kèm
          </span>
          {attachments.length > 0 && (
            <span style={{ fontSize:10, padding:'1px 6px', borderRadius:8, backgroundColor:'#0ea5e920', color:'#0ea5e9', fontWeight:800 }}>
              {attachments.length}
            </span>
          )}
        </div>
        <label style={{
          display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:7,
          backgroundColor: uploading ? 'rgba(14,165,233,0.1)' : '#0ea5e920',
          color: uploading ? 'var(--text-muted)' : '#0ea5e9',
          fontSize:12, fontWeight:700, cursor: uploading ? 'not-allowed' : 'pointer',
          border:'1px solid #0ea5e930'
        }}>
          {uploading
            ? <><span style={{ width:12,height:12,border:'2px solid rgba(14,165,233,0.3)',borderTopColor:'#0ea5e9',borderRadius:'50%',animation:'spin 0.8s linear infinite' }}/> Đang tải...</>
            : <><Upload size={12}/> Đính kèm file</>
          }
          <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            onChange={handleUpload} disabled={uploading}
            style={{ display:'none' }}/>
        </label>
      </div>

      {error && (
        <div style={{ fontSize:12, color:'#ef4444', backgroundColor:'rgba(239,68,68,0.08)', padding:'6px 10px', borderRadius:6, marginBottom:8 }}>
          {error}
        </div>
      )}

      {/* Dùng FileAttachmentList để xem trước + tải + xóa */}
      <FileAttachmentList attachments={attachments} onDelete={handleDelete}/>
    </div>
  );
}

// ── Modal đổi mật khẩu — inline fields để tránh re-mount ──
export function ChangePasswordModal({ onClose }) {
  const [curPwd,  setCurPwd]  = useState('');
  const [newPwd,  setNewPwd]  = useState('');
  const [conPwd,  setConPwd]  = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPwd.length < 6) return setError('Mật khẩu mới phải ít nhất 6 ký tự');
    if (newPwd !== conPwd)  return setError('Mật khẩu xác nhận không khớp');
    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword: curPwd, newPassword: newPwd });
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally { setLoading(false); }
  };

  const inputStyle = { width:'100%', backgroundColor:'var(--bg-input)', border:'1.5px solid var(--border)', borderRadius:10, padding:'10px 44px 10px 14px', fontSize:14, color:'var(--text-primary)', outline:'none', boxSizing:'border-box' };
  const eyeStyle  = { position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', padding:0 };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth:420 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'22px 28px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <KeyRound size={18} style={{ color:'#0ea5e9' }}/>
            <h3
  style={{
    fontSize:22,
    fontWeight:900,
    color:'var(--text-primary)',
    margin:0,
    lineHeight:1.4
  }}
>Đổi mật khẩu</h3>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
          {error && <div style={{ padding:'10px 14px', borderRadius:8, backgroundColor:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', fontSize:13, color:'#ef4444' }}>{error}</div>}
          {success && <div style={{ padding:'10px 14px', borderRadius:8, backgroundColor:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', fontSize:13, color:'#10b981', display:'flex', alignItems:'center', gap:6 }}><CheckCircle size={14}/> Đổi mật khẩu thành công!</div>}

          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'var(--text-secondary)', marginBottom:6 }}>Mật khẩu hiện tại</label>
            <div style={{ position:'relative' }}>
              <input type={showCur ? 'text' : 'password'} style={inputStyle} value={curPwd} onChange={e => setCurPwd(e.target.value)} required autoComplete="current-password"/>
              <button type="button" style={eyeStyle} onClick={() => setShowCur(v => !v)}>{showCur ? <EyeOff size={15}/> : <Eye size={15}/>}</button>
            </div>
          </div>

          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'var(--text-secondary)', marginBottom:6 }}>Mật khẩu mới</label>
            <div style={{ position:'relative' }}>
              <input type={showNew ? 'text' : 'password'} style={inputStyle} value={newPwd} onChange={e => setNewPwd(e.target.value)} required autoComplete="new-password"/>
              <button type="button" style={eyeStyle} onClick={() => setShowNew(v => !v)}>{showNew ? <EyeOff size={15}/> : <Eye size={15}/>}</button>
            </div>
          </div>

          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'var(--text-secondary)', marginBottom:6 }}>Xác nhận mật khẩu mới</label>
            <div style={{ position:'relative' }}>
              <input type={showCon ? 'text' : 'password'} style={inputStyle} value={conPwd} onChange={e => setConPwd(e.target.value)} required autoComplete="new-password"/>
              <button type="button" style={eyeStyle} onClick={() => setShowCon(v => !v)}>{showCon ? <EyeOff size={15}/> : <Eye size={15}/>}</button>
            </div>
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:4 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Hủy</button>
            <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Đang lưu...' : 'Đổi mật khẩu'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Toast thông báo giữa màn hình ──
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const config = {
    success: { bg:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.35)', color:'#10b981', icon:'✅' },
    info:    { bg:'rgba(14,165,233,0.12)', border:'rgba(14,165,233,0.35)', color:'#0ea5e9', icon:'ℹ️' },
    error:   { bg:'rgba(239,68,68,0.12)',  border:'rgba(239,68,68,0.35)',  color:'#ef4444', icon:'❌' },
    warning: { bg:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.35)', color:'#f59e0b', icon:'⚠️' },
  }[type] || config.success;

  return (
    <div style={{
      position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
      zIndex:9999, minWidth:320, maxWidth:420,
      backgroundColor:'var(--bg-surface)',
      border:`1.5px solid ${config.border}`,
      borderRadius:16, padding:'24px 28px',
      boxShadow:'0 20px 60px rgba(0,0,0,0.5)',
      display:'flex', flexDirection:'column', alignItems:'center', gap:12,
      animation:'fadeInScale 0.2s ease'
    }}>
      <div style={{ fontSize:36 }}>{config.icon}</div>
      <p style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', textAlign:'center', margin:0 }}>
        {message}
      </p>
      <button onClick={onClose}
        style={{ marginTop:4, padding:'8px 24px', borderRadius:8, border:'none',
          backgroundColor:`${config.color}20`, color:config.color,
          fontSize:13, fontWeight:700, cursor:'pointer' }}>
        OK
      </button>
    </div>
  );
}

// ── Nút yêu cầu duyệt ──
function RequestReviewButton({ taskId, currentStatus, onDone }) {
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);

  const handleRequest = async () => {
    setLoading(true);
    try {
      await api.patch(`/tasks/${taskId}/request-review`);
      setToast({ message: 'Đã gửi yêu cầu duyệt thành công!\nLãnh đạo sẽ xem xét sớm.', type: 'success' });
      onDone();
    } catch(e) {
      setToast({ message: 'Gửi yêu cầu thất bại. Vui lòng thử lại.', type: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>}
      <button onClick={handleRequest} disabled={loading}
        style={{
          padding:'8px 12px', borderRadius:9, border:'1px solid rgba(14,165,233,0.3)',
          background: loading ? 'rgba(14,165,233,0.1)' : 'linear-gradient(135deg,rgba(14,165,233,0.15),rgba(14,165,233,0.08))',
          color:'#0ea5e9', fontSize:12, fontWeight:800, cursor: loading ? 'not-allowed' : 'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          transition:'all 0.2s'
        }}>
        {loading
          ? <><span style={{ width:12,height:12,border:'2px solid rgba(14,165,233,0.3)',borderTopColor:'#0ea5e9',borderRadius:'50%',animation:'spin 0.8s linear infinite' }}/> Đang gửi...</>
          : <>📤 Gửi yêu cầu duyệt</>
        }
      </button>
    </>
  );
}

// ── Card task sự kiện — click mở modal ──
function EventTaskCard({ task, onUpdated }) {
  const [showModal, setShowModal] = useState(false);

  const today = new Date(); today.setHours(0,0,0,0);
  const dl     = task.extendedDeadline || task.deadline;
  const dlDate = dl ? new Date(dl) : null;
  const isOverdue  = dlDate && dlDate < today && task.status !== 'done';
  const isDueToday = dlDate && dlDate.getTime() === today.getTime() && task.status !== 'done';

  const category  = WORK_CATEGORY[task.workCategory];
  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.not_started;
  const borderColor = isOverdue ? '#ef4444' : isDueToday ? '#ef4444' : 'var(--border)';

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: `1.5px solid ${borderColor}`,
          borderRadius: 18, marginBottom: 10, overflow: 'hidden',
          boxShadow: isOverdue ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
          cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s'
        }}
        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.2)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=isOverdue?'0 0 0 3px rgba(239,68,68,0.1)':'none'; }}
      >
        <div style={{ height: 3, backgroundColor: category?.color || '#0ea5e9', width: '100%' }} />
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
            <span style={{ fontSize:12, fontFamily:'monospace', fontWeight:900, color: category?.color || '#0ea5e9', backgroundColor:`${category?.color || '#0ea5e9'}15`, padding:'2px 8px', borderRadius:5 }}>
              {task.taskCode}
            </span>
            <span style={{ fontSize:11, padding:'2px 8px', borderRadius:5, fontWeight:700,
              backgroundColor: statusCfg.bgHex || statusCfg.bg,
              color: statusCfg.textHex || statusCfg.text }}>
              {statusCfg.label}
            </span>
            {isOverdue && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:5, fontWeight:800, backgroundColor:'#ef444420', color:'#ef4444', display:'flex', alignItems:'center', gap:3 }}><AlertTriangle size={14}/> Quá hạn</span>}
            {isDueToday && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:5, fontWeight:800, backgroundColor:'#ef444420', color:'#ef4444' }}>⏰ Hôm nay</span>}
            {dl && <span style={{ fontSize:11, color:'var(--text-muted)', marginLeft:'auto' }}>📅 {safeFormat()}</span>}
            {task.approvalStatus === 'review' && <span style={{ fontSize:10, padding:'2px 7px', borderRadius:5, fontWeight:800, backgroundColor:'rgba(14,165,233,0.15)', color:'#0ea5e9' }}>⏳ Chờ duyệt</span>}
            {task.approvalStatus === 'approved' && <span style={{ fontSize:10, padding:'2px 7px', borderRadius:5, fontWeight:800, backgroundColor:'rgba(16,185,129,0.12)', color:'#10b981' }}>✅ Đã duyệt</span>}
            {task.approvalStatus === 'rejected' && <span style={{ fontSize:10, padding:'2px 7px', borderRadius:5, fontWeight:800, backgroundColor:'rgba(239,68,68,0.12)', color:'#ef4444' }}>❌ Bị từ chối</span>}
          </div>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:10, lineHeight:1.4 }}>
            {task.taskName}
          </div>
          <div style={{ marginBottom:0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
              <span style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)' }}>Tiến độ</span>
              <span style={{ fontSize:14, fontWeight:900, color: progressColor(task.progress) }}>{task.progress}%</span>
            </div>
            <ProgressBar value={task.progress} height={10}/>
          </div>
        </div>
      </div>

      {showModal && <TaskUpdateModal task={task} onClose={() => { setShowModal(false); onUpdated(); }}/>}
    </>
  );
}

// ── Modal cập nhật task cho nhân viên ──
function TaskUpdateModal({ task, onClose }) {
  const [progress, setProgress] = useState(task.progress || 0);
  const [status, setStatus]     = useState(task.status);
  const [attachments, setAttachments] = useState(task.attachments || []);
  const [extDeadline, setExtDeadline] = useState(task.extendedDeadline ? task.extendedDeadline.slice(0,10) : '');
  const [extReason,   setExtReason]   = useState(task.extensionReason || '');
  const [notes,       setNotes]       = useState(task.notes || '');
  const [saving, setSaving]     = useState(false);
  const [toast,  setToast]      = useState(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/tasks/${task.id}`, {
        progress, status,
        extendedDeadline: extDeadline || null,
        extensionReason:  extReason || null,
        notes: notes || null,
      });
      setToast({ message: 'Đã lưu thành công!', type: 'success' });
      setTimeout(() => onClose(), 1200);
    } catch(e) {
      setToast({ message: 'Lưu thất bại. Vui lòng thử lại.', type: 'error' });
    } finally { setSaving(false); }
  };

  const handleRequestReview = async () => {
    try {
      await api.patch(`/tasks/${task.id}/request-review`);
      setToast({ message: 'Đã gửi yêu cầu duyệt!\nLãnh đạo sẽ xem xét sớm.', type: 'success' });
      setTimeout(() => onClose(), 1500);
    } catch(e) {
      setToast({ message: 'Gửi yêu cầu thất bại.', type: 'error' });
    }
  };

  const cat = WORK_CATEGORY[task.workCategory];
  const st  = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>}
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div
<div
  className="modal-content"
  style={{
    maxWidth: 560,
    width: '95%',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 18,
    overflow: 'hidden',
    background: 'var(--bg-surface)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.45)'
  }}
>
          {/* Header */}
          <div
  style={{
    padding:'16px 20px',
    borderBottom:'1px solid var(--border)',
    flexShrink: 0
  }}
>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{ fontSize:13, fontFamily:'monospace', fontWeight:900, color:cat?.color||'#0ea5e9', backgroundColor:`${cat?.color||'#0ea5e9'}15`, padding:'3px 10px', borderRadius:6 }}>
                {task.taskCode}
              </span>
              <span style={{ fontSize:11, padding:'2px 8px', borderRadius:5, fontWeight:700, backgroundColor:st.bgHex, color:st.textHex }}>
                {st.label}
              </span>
            </div>
            <h3 style={{ fontSize:16, fontWeight:800, color:'var(--text-primary)', margin:0 }}>{task.taskName}</h3>
          </div>

          {/* Body */}
          <div
  className="task-detail-scroll"
  style={{
    padding: '28px 30px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 24,
    overflowY: 'auto',
    overflowX: 'hidden',
    flex: 1,
    minHeight: 0,
    maxHeight: 'calc(92vh - 140px)',
    alignItems: 'start',
    paddingRight: 12
  }}
>

            {/* ── Thông tin chi tiết (readonly) ── */}
            <div style={{ padding:'12px 14px', borderRadius:10, backgroundColor:'var(--bg-hover)', border:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ fontSize:11, fontWeight:800, color:'var(--text-muted)', letterSpacing:'0.05em', marginBottom:2 }}>THÔNG TIN CÔNG VIỆC</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  { label:'Deadline', value: task.deadline ? new Date(task.deadline).toLocaleDateString('vi-VN') : '—', color: task.deadline ? '#f59e0b' : undefined },
                  { label:'Gia hạn', value: task.extendedDeadline ? new Date(task.extendedDeadline).toLocaleDateString('vi-VN') : '—', color: task.extendedDeadline ? '#ef4444' : undefined },
                  { label:'Bộ phận', value: task.leadDepartment || '—' },
                  { label:'Lãnh đạo', value: task.deputyDirector || '—' },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', marginBottom:2 }}>{f.label.toUpperCase()}</div>
                    <div style={{ fontSize:15, fontWeight:600, color: f.color || 'var(--text-primary)' }}>{f.value}</div>
                  </div>
                ))}
              </div>
              {/* Người phối hợp */}
              {task.collaboratorUsers?.length > 0 && (
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', marginBottom:4 }}>NGƯỜI PHỐI HỢP</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                    {task.collaboratorUsers.map(u => (
                      <div key={u.id} style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 8px', borderRadius:6, backgroundColor:`${u.color||'#6366f1'}15` }}>
                        <div style={{ width:18, height:18, borderRadius:'50%', backgroundColor:u.color||'#6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color:'#fff' }}>{u.name?.charAt(0)}</div>
                        <span style={{ fontSize:11, fontWeight:600, color:'var(--text-secondary)' }}>{u.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Kết quả đầu ra */}
              {task.deliverable && (
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', marginBottom:2 }}>KẾT QUẢ ĐẦU RA</div>
                  <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5 }}>{task.deliverable}</div>
                </div>
              )}
              {/* Ghi chú */}
              {task.notes && (
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', marginBottom:2 }}>GHI CHÚ</div>
                  <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5 }}>{task.notes}</div>
                </div>
              )}
            </div>

            {/* Trạng thái */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>Trạng thái</label>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {Object.entries(STATUS_CONFIG).map(([k,v]) => (
                  <button key={k} onClick={() => { setStatus(k); if(k==='done') setProgress(100); }}
                    style={{ padding:'6px 14px', borderRadius:7, border:`1.5px solid ${status===k ? v.color : 'var(--border)'}`,
                      backgroundColor: status===k ? v.bgHex : 'var(--bg-surface)',
                      color: status===k ? v.textHex : 'var(--text-muted)',
                      fontSize:12, fontWeight:700, cursor:'pointer', transition:'all 0.15s' }}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tiến độ */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <label style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)' }}>Tiến độ: <strong style={{ color: progressColor(progress) }}>{progress}%</strong></label>
                <div style={{ display:'flex', gap:4 }}>
                  {[0,25,50,75,100].map(v => (
                    <button key={v} onClick={() => setProgress(v)}
                      style={{ padding:'5px 10px', borderRadius:5, border:'none', fontSize:13, fontWeight:700, cursor:'pointer',
                        backgroundColor: progress===v ? progressColor(v) : 'var(--bg-surface)',
                        color: progress===v ? '#fff' : 'var(--text-muted)' }}>
                      {v}%
                    </button>
                  ))}
                </div>
              </div>
              <input type="range" min="0" max="100" step="5" value={progress}
                onChange={e => setProgress(parseInt(e.target.value))}
                className="no-transition" style={{ width:'100%', accentColor: progressColor(progress) }}/>
              <ProgressBar value={progress} height={8}/>
            </div>

            {/* Đính kèm */}
            <AttachmentSection taskId={task.id} taskType="event" attachments={attachments}
              onAttachmentsChange={setAttachments}/>

            {/* Gia hạn deadline */}
            <div style={{ borderTop:'1px solid var(--border)', paddingTop:14 }}>
              <label style={{ fontSize:12, fontWeight:700, color:'#f59e0b', display:'block', marginBottom:6 }}>🔄 Xin gia hạn deadline</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:8 }}>
                <div>
                  <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:4 }}>Deadline hiện tại</label>
                  <div style={{ fontSize:13, fontWeight:700, color:'#f59e0b', padding:'8px 12px', borderRadius:8, backgroundColor:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)' }}>
                    {task.deadline ? new Date(task.deadline).toLocaleDateString('vi-VN') : '—'}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:4 }}>Ngày gia hạn mới</label>
                  <input type="date" className="input" value={extDeadline}
                    onChange={e => setExtDeadline(e.target.value)}
                    min={task.deadline ? task.deadline.slice(0,10) : undefined}
                    style={{
                    fontSize:15,
                    padding:'12px 14px'
}}/>
                </div>
              </div>
              {extDeadline && (
                <div>
                  <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:4 }}>Lý do gia hạn *</label>
                  <input className="input" placeholder="Lý do khách quan cần gia hạn..."
                    value={extReason} onChange={e => setExtReason(e.target.value)}
                    style={{ fontSize:13 }}/>
                </div>
              )}
            </div>

            {/* Ghi chú */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>📝 Ghi chú / Báo cáo tiến độ</label>
              <textarea className="input" rows={3} style={{ resize:'none', fontSize:13 }}
                placeholder="Ghi chú tiến độ, vấn đề gặp phải, cần hỗ trợ..."
                value={notes} onChange={e => setNotes(e.target.value)}/>
            </div>
          </div>

          {/* Footer */}
          <div
  style={{
    display:'flex',
    gap:10,
    padding:'20px 28px',
    backdropFilter:'blur(10px)',
    flexShrink: 0,
    background:'var(--bg-surface)'
  }}
>
            <button onClick={onClose} className="btn btn-secondary" style={{ flex:1 }}>Đóng</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary"
              style={{ flex:1, background:'linear-gradient(135deg,#0ea5e9,#0284c7)' }}>
              <Save size={14}/> {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
            {(task.approvalStatus === 'pending' || task.approvalStatus === 'rejected' || !task.approvalStatus) && (
              <button onClick={handleRequestReview} className="btn"
                style={{ flex:1, background:'linear-gradient(135deg,rgba(14,165,233,0.2),rgba(14,165,233,0.1))', color:'#0ea5e9', border:'1px solid rgba(14,165,233,0.3)', fontWeight:800 }}>
                📤 Yêu cầu duyệt
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}


// ── Card task tháng — click mở modal ──
function MonthlyTaskCard({ task, onUpdated }) {
  const [showModal, setShowModal] = useState(false);

  const today = new Date(); today.setHours(0,0,0,0);
  const dl     = task.extendedDueDate || task.dueDate;
  const dlDate = dl ? new Date(dl) : null;
  const isOverdue  = dlDate && dlDate < today && !task.completion;
  const isDueToday = dlDate && dlDate.getTime() === today.getTime() && !task.completion;

  const typeColor = task.taskType === 'R' ? '#6366f1' : '#f97316';
  const COMP = {
    OT: { bg:'#10b98120', color:'#10b981', label:'✅ OT' },
    OD: { bg:'#ef444420', color:'#ef4444', label:'⚠️ OD' },
    IC: { bg:'#ef444420', color:'#ef4444', label:'❌ IC' },
  };

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        style={{
          backgroundColor:'var(--bg-surface)', border:`1.5px solid ${isOverdue ? '#ef4444' : isDueToday ? '#ef4444' : 'var(--border)'}`,
          borderRadius:14, marginBottom:10, overflow:'hidden',
          cursor:'pointer', transition:'transform 0.15s, box-shadow 0.15s'
        }}
        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.2)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
      >
        <div style={{ height:3, backgroundColor: typeColor, width:'100%' }}/>
        <div style={{ padding:'20px 24px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
            <span
  style={{
    fontSize: 13,
    fontFamily:'monospace',
    fontWeight:900,
    color:'#0ea5e9',
    backgroundColor:'#0ea5e915',
    padding:'2px 8px',
    borderRadius:5
  }}
>
              {task.taskId}
            </span>
            <span style={{ fontSize:11, padding:'2px 8px', borderRadius:5, fontWeight:800, backgroundColor:`${typeColor}20`, color:typeColor }}>
              {task.taskType === 'R' ? 'Thường xuyên' : 'Phát sinh'}
            </span>
            {task.completion && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:5, fontWeight:800, backgroundColor:COMP[task.completion]?.bg, color:COMP[task.completion]?.color }}>{COMP[task.completion]?.label}</span>}
            {isOverdue && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:5, fontWeight:800, backgroundColor:'#ef444420', color:'#ef4444', display:'flex', alignItems:'center', gap:3 }}><AlertTriangle size={10}/> Quá hạn</span>}
            {isDueToday && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:5, fontWeight:800, backgroundColor:'#ef444420', color:'#ef4444' }}>⏰ Hôm nay</span>}
            {dl && <span style={{ fontSize:11, color:'var(--text-muted)', marginLeft:'auto' }}>📅 {safeFormat()}</span>}
          </div>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:10, lineHeight:1.4 }}>{task.taskName}</div>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
              <span style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)' }}>Tiến độ</span>
              <span style={{ fontSize:14, fontWeight:900, color: progressColor(task.progress) }}>{task.progress}%</span>
            </div>
            <ProgressBar value={task.progress} height={10}/>
          </div>
        </div>
      </div>

      {showModal && <MonthlyTaskUpdateModal task={task} onClose={() => { setShowModal(false); onUpdated(); }}/>}
    </>
  );
}

// ── Modal cập nhật CV tháng ──
function MonthlyTaskUpdateModal({ task, onClose }) {
  const [progress,   setProgress]   = useState(task.progress || 0);
  const [completion, setCompletion] = useState(task.completion || '');
  const [attachments, setAttachments] = useState(task.attachments || []);
  const [extDueDate, setExtDueDate] = useState(task.extendedDueDate ? task.extendedDueDate.slice(0,10) : '');
  const [notes,      setNotes]      = useState(task.notes || '');
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await monthlyTaskService.update(task.id, {
        progress,
        completion: completion || null,
        extendedDueDate: extDueDate || null,
        notes: notes || null,
      });
      setToast({ message: 'Đã lưu thành công!', type: 'success' });
      setTimeout(() => onClose(), 1200);
    } catch(e) {
      setToast({ message: 'Lưu thất bại.', type: 'error' });
    } finally { setSaving(false); }
  };

  const typeColor = task.taskType === 'R' ? '#6366f1' : '#f97316';

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>}
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div
  className="modal-content"
  style={{
    maxWidth: 1180,
    width: '98%',
    maxHeight: '96vh',
    borderRadius: 18
  }}
>
          <div
  style={{
    padding: '16px 20px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    position: 'sticky',
    top: 0,
    zIndex: 5
  }}
>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{ fontSize:13, fontFamily:'monospace', fontWeight:900, color:'#0ea5e9', backgroundColor:'#0ea5e915', padding:'3px 10px', borderRadius:6 }}>{task.taskId}</span>
              <span style={{ fontSize:11, padding:'2px 8px', borderRadius:5, fontWeight:800, backgroundColor:`${typeColor}20`, color:typeColor }}>{task.taskType === 'R' ? 'Thường xuyên' : 'Phát sinh'}</span>
            </div>
            <h3 style={{ fontSize:15, fontWeight:800, color:'var(--text-primary)', margin:0 }}>{task.taskName}</h3>
          </div>
          <div
  className="task-detail-scroll"
  style={{
    padding: '28px 30px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 24,
    overflowY: 'auto',
    overflowX: 'hidden',
    flex: 1,
    minHeight: 0,
    maxHeight: 'calc(92vh - 140px)',
    alignItems: 'start',
    paddingRight: 12
  }}
>

            {/* ── Thông tin chi tiết CV tháng (readonly) ── */}
            <div style={{ padding:'12px 14px', borderRadius:10, backgroundColor:'var(--bg-hover)', border:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ fontSize:11, fontWeight:800, color:'var(--text-muted)', letterSpacing:'0.05em', marginBottom:2 }}>THÔNG TIN CÔNG VIỆC</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  { label:'Loại', value: task.taskType === 'R' ? 'R – Thường xuyên' : 'A – Phát sinh', color: task.taskType === 'R' ? '#6366f1' : '#f97316' },
                  { label:'Bộ phận', value: task.department || '—' },
                  { label:'Ngày bắt đầu', value: task.startDate ? new Date(task.startDate).toLocaleDateString('vi-VN') : '—' },
                  { label:'Ngày kết thúc', value: task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : '—', color: '#f59e0b' },
                  { label:'Gia hạn', value: task.extendedDueDate ? new Date(task.extendedDueDate).toLocaleDateString('vi-VN') : '—', color: task.extendedDueDate ? '#ef4444' : undefined },
                  { label:'Người thực hiện', value: task.assignee?.name || '—' },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', marginBottom:2 }}>{f.label.toUpperCase()}</div>
                    <div style={{ fontSize:13, fontWeight:600, color: f.color || 'var(--text-primary)' }}>{f.value}</div>
                  </div>
                ))}
              </div>
              {/* Ghi chú */}
              {task.notes && (
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', marginBottom:2 }}>GHI CHÚ</div>
                  <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5 }}>{task.notes}</div>
                </div>
              )}
            </div>

            {/* Hoàn thành */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>Mức độ hoàn thành</label>
              <div style={{ display:'flex', gap:8 }}>
                {[['','— Chưa xác định','var(--border)','var(--text-muted)'],['OT','✅ Đúng hạn','#10b981','#10b981'],['OD','⚠️ Trễ hạn','#f59e0b','#f59e0b'],['IC','❌ Không HT','#ef4444','#ef4444']].map(([v,l,bc,tc]) => (
                  <button key={v} onClick={() => setCompletion(v)}
                    style={{ flex:1, padding:'7px 4px', borderRadius:8, border:`1.5px solid ${completion===v ? bc : 'var(--border)'}`,
                      backgroundColor: completion===v ? `${bc}20` : 'var(--bg-surface)',
                      color: completion===v ? tc : 'var(--text-muted)',
                      fontSize:11, fontWeight:700, cursor:'pointer', textAlign:'center' }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            {/* Tiến độ */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <label style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)' }}>Tiến độ: <strong style={{ color: progressColor(progress) }}>{progress}%</strong></label>
                <div style={{ display:'flex', gap:4 }}>
                  {[0,25,50,75,100].map(v => (
                    <button key={v} onClick={() => setProgress(v)}
                      style={{ padding:'2px 7px', borderRadius:5, border:'none', fontSize:11, fontWeight:700, cursor:'pointer',
                        backgroundColor: progress===v ? progressColor(v) : 'var(--bg-surface)',
                        color: progress===v ? '#fff' : 'var(--text-muted)' }}>
                      {v}%
                    </button>
                  ))}
                </div>
              </div>
              <input type="range" min="0" max="100" step="5" value={progress}
                onChange={e => setProgress(parseInt(e.target.value))}
                className="no-transition" style={{ width:'100%', accentColor: progressColor(progress) }}/>
              <ProgressBar value={progress} height={8}/>
            </div>
            {/* File đính kèm */}
<div style={{ gridColumn: '1 / -1' }}>
  <AttachmentSection
    taskId={task.id}
    taskType="monthly"
    attachments={attachments}
    onAttachmentsChange={setAttachments}
  />
</div>

            {/* Gia hạn */}
<div
  style={{
    gridColumn: '1 / -1',
    borderTop:'1px solid var(--border)',
    paddingTop:14
  }}
>
              <label style={{ fontSize:12, fontWeight:700, color:'#f59e0b', display:'block', marginBottom:6 }}>🔄 Xin gia hạn</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:4 }}>Ngày kết thúc hiện tại</label>
                  <div style={{ fontSize:13, fontWeight:700, color:'#f59e0b', padding:'8px 12px', borderRadius:8, backgroundColor:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)' }}>
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : '—'}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:4 }}>Ngày gia hạn mới</label>
                  <input type="date" className="input" value={extDueDate}
                    onChange={e => setExtDueDate(e.target.value)}
                    min={task.dueDate ? task.dueDate.slice(0,10) : undefined}
                    style={{ fontSize:13 }}/>
                </div>
              </div>
            </div>

            {/* Ghi chú */}
<div style={{ gridColumn: '1 / -1' }}>
  <label
    style={{
      fontSize:12,
      fontWeight:700,
      color:'var(--text-secondary)',
      display:'block',
      marginBottom:6
    }}
  >
    📝 Ghi chú / Báo cáo tiến độ
  </label>

  <textarea
    className="input"
    rows={3}
    style={{ resize:'none', fontSize:13 }}
    placeholder="Ghi chú tiến độ, vấn đề gặp phải..."
    value={notes}
    onChange={e => setNotes(e.target.value)}
  />
</div>
          </div>
          <div
  style={{
    display: 'flex',
    gap: 10,
    padding: '16px 20px',
    borderTop: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    position: 'sticky',
    bottom: 0,
    zIndex: 5
  }}
>
            <button onClick={onClose} className="btn btn-secondary" style={{ flex:1 }}>Đóng</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary"
              style={{ flex:1, background:'linear-gradient(135deg,#0ea5e9,#0284c7)' }}>
              <Save size={14}/> {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════
export default function MyTasksPage() {
  const { user } = useAuthStore();
  const [eventTasks,  setEventTasks]  = useState([]);
  const [monthlyTasks,setMonthlyTasks]= useState([]);
  const [teamTasks,   setTeamTasks]   = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [teamLoading, setTeamLoading] = useState(false);
  const [tab,  setTab]  = useState('event');
  const [searchText, setSearchText] = useState('');
  const [filterEventStatus,   setFilterEventStatus]   = useState('');
  const [filterMonthlyStatus, setFilterMonthlyStatus] = useState('');
  const [filterMonthlyType,   setFilterMonthlyType]   = useState('');
  // ── Filter từ store (persist qua tab) ──
  const { monthly: mf, setFilter } = useFilterStore();
  const month = mf.month;
  const year  = mf.year;
  const setMonth = (v) => setFilter('monthly', { month: parseInt(v) });
  const setYear  = (v) => setFilter('monthly', { year: parseInt(v) });
  const [showChangePwd, setShowChangePwd] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [etRes, mtRes] = await Promise.all([
        taskService.getTasks({ assigneeId: user.id, month, year }),
        monthlyTaskService.getTasks({ month, year })
      ]);
      const myTasks = etRes.data.data || [];
      setEventTasks(myTasks);
      setMonthlyTasks((mtRes.data.data || []).filter(t => t.assigneeId === user.id));

      const myDepts = [...new Set(myTasks.map(t => t.leadDepartment).filter(Boolean))];
      if (myDepts.length > 0) {
        setTeamLoading(true);
        try {
          const teamRes = await Promise.all(myDepts.map(dept => taskService.getTasks({ leadDepartment: dept, month, year })));
          const allTeam = teamRes.flatMap(r => r.data.data || []);
          const unique  = allTeam.filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i && t.assigneeId !== user.id);
          setTeamTasks(unique);
        } catch(e) { console.error(e); }
        finally { setTeamLoading(false); }
      } else { setTeamTasks([]); }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [user, month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const today = new Date(); today.setHours(0,0,0,0);

  // Stats theo tab đang chọn
  const total   = tab === 'monthly'
    ? monthlyTasks.length
    : eventTasks.length;
  const done    = tab === 'monthly'
    ? monthlyTasks.filter(t => t.completion === 'OT').length
    : eventTasks.filter(t => t.status === 'done').length;
  const inProg  = tab === 'monthly'
    ? monthlyTasks.filter(t => !t.completion && (t.progress||0) > 0).length
    : eventTasks.filter(t => t.status === 'in_progress').length;
  const overdue = tab === 'monthly'
    ? monthlyTasks.filter(t => { const dl = t.extendedDueDate||t.dueDate; return dl && new Date(dl)<today && !t.completion; }).length
    : eventTasks.filter(t => { const dl = t.extendedDeadline||t.deadline; return dl && new Date(dl)<today && t.status!=='done'; }).length;
  const avgProg = tab === 'monthly'
    ? (monthlyTasks.length ? Math.round(monthlyTasks.reduce((s,t) => s+(t.progress||0),0)/monthlyTasks.length) : 0)
    : (eventTasks.length ? Math.round(eventTasks.reduce((s,t) => s+(t.progress||0),0)/eventTasks.length) : 0);

  // Normalize tiếng Việt
  const normVN = (s) => (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
  const matchKw = (task, kw) => {
    if (!kw) return true;
    const n = normVN(kw);
    return normVN(task.taskName).includes(n) || normVN(task.taskCode||task.taskId).includes(n) || normVN(task.assignee?.name).includes(n);
  };

  const sortedEvents = [...eventTasks]
    .filter(t => (!filterEventStatus || t.status === filterEventStatus) && matchKw(t, searchText))
    .sort((a,b) => {
    const dlA = new Date(a.extendedDeadline||a.deadline||'9999');
    const dlB = new Date(b.extendedDeadline||b.deadline||'9999');
    const ovA = dlA<today && a.status!=='done';
    const ovB = dlB<today && b.status!=='done';
    if (ovA && !ovB) return -1;
    if (!ovA && ovB) return 1;
    return dlA-dlB;
  });

  const teamByDept = teamTasks.reduce((acc, t) => {
    const dept = t.leadDepartment || 'Khác';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(t);
    return acc;
  }, {});

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, maxWidth:1200, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:900, color:'var(--text-primary)', margin:0 }}>Công việc của tôi</h2>
          <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>
            Xin chào, <strong style={{ color:'var(--text-primary)' }}>{user?.name}</strong> · Tháng {month}/{year}
          </p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <select className="select" style={{ width:120 }} value={month} onChange={e => setMonth(parseInt(e.target.value))}>
            {ML.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="select" style={{ width:88 }} value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {tab === 'event' && (
            <select className="select" style={{ width:150 }} value={filterEventStatus} onChange={e => setFilterEventStatus(e.target.value)}>
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          )}
          {tab === 'monthly' && (
            <>
              <select className="select" style={{ width:160 }} value={filterMonthlyStatus} onChange={e => setFilterMonthlyStatus(e.target.value)}>
                <option value="">Tất cả hoàn thành</option>
                <option value="OT">OT – Đúng hạn</option>
                <option value="OD">OD – Trễ hạn</option>
                <option value="IC">IC – Không HT</option>
              </select>
              <select className="select" style={{ width:140 }} value={filterMonthlyType} onChange={e => setFilterMonthlyType(e.target.value)}>
                <option value="">Tất cả loại</option>
                <option value="R">R – Thường xuyên</option>
                <option value="A">A – Phát sinh</option>
              </select>
            </>
          )}
          {(filterEventStatus || filterMonthlyStatus || filterMonthlyType) && (
            <button onClick={() => { setFilterEventStatus(''); setFilterMonthlyStatus(''); setFilterMonthlyType(''); }}
              style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'1px solid var(--border)', backgroundColor:'var(--bg-hover)', color:'var(--text-muted)', cursor:'pointer' }}>
              ✕ Xóa lọc
            </button>
          )}
          {/* Search box */}
          <div style={{ position:'relative', minWidth:180 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Tìm kiếm công việc..."
              value={searchText} onChange={e => setSearchText(e.target.value)}
              style={{ width:'100%', paddingLeft:28, paddingRight:10, paddingTop:6, paddingBottom:6, fontSize:12, borderRadius:8,
                border:`1.5px solid ${searchText ? '#0ea5e9' : 'var(--border)'}`,
                backgroundColor:'var(--bg-input)', color:'var(--text-primary)', outline:'none',
                boxSizing:'border-box', boxShadow: searchText ? '0 0 0 3px rgba(14,165,233,0.12)' : 'none' }}/>
          </div>
        </div>
      </div>

      {/* Layout 2 cột */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:16, alignItems:'start' }}>

        {/* Cột trái: Tabs + Task list */}
        <div>
          <div style={{ display:'flex', gap:8, borderBottom:'1.5px solid var(--border)', marginBottom:16 }}>
            {[
              { key:'event',   label:'📋 Sự kiện của tôi', count:eventTasks.length },
              { key:'monthly', label:'📅 CV tháng',         count:monthlyTasks.length },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ padding:'10px 18px', borderRadius:'10px 10px 0 0', border:'none', fontSize:13, fontWeight:700, cursor:'pointer',
                  backgroundColor: tab===t.key ? 'var(--bg-surface)' : 'transparent',
                  color: tab===t.key ? '#0ea5e9' : 'var(--text-muted)',
                  borderBottom: tab===t.key ? '2px solid #0ea5e9' : '2px solid transparent',
                  transition:'all 0.2s' }}>
                {t.label}
                <span style={{ fontSize:11, padding:'1px 7px', borderRadius:10, backgroundColor: tab===t.key ? '#0ea5e920' : 'var(--bg-hover)', marginLeft:6 }}>{t.count}</span>
              </button>
            ))}
          </div>

          {tab === 'event' && (
            loading
              ? [1,2,3].map(i => <div key={i} style={{ height:90, borderRadius:18, backgroundColor:'var(--bg-hover)', marginBottom:10,minHeight:'unset', animation:'pulse 1.5s infinite' }}/>)
              : sortedEvents.length === 0
                ? <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}><CheckCircle size={36} style={{ margin:'0 auto 10px', opacity:0.3 }}/><p>Không có công việc nào trong tháng {month}/{year}</p></div>
                : sortedEvents.map(t => <EventTaskCard key={t.id} task={t} onUpdated={fetchData}/>)
          )}
          {tab === 'monthly' && (
            loading
              ? [1,2,3].map(i => <div key={i} style={{ height:90, borderRadius:14, backgroundColor:'var(--bg-hover)', marginBottom:10, animation:'pulse 1.5s infinite' }}/>)
              : monthlyTasks.length === 0
                ? <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}><CheckCircle size={36} style={{ margin:'0 auto 10px', opacity:0.3 }}/><p>Không có công việc tháng nào</p></div>
                : monthlyTasks
                    .filter(t => (!filterMonthlyStatus || t.completion === filterMonthlyStatus) && (!filterMonthlyType || t.taskType === filterMonthlyType) && matchKw(t, searchText))
                    .map(t => <MonthlyTaskCard key={t.id} task={t} onUpdated={fetchData}/>)
          )}
        </div>

        {/* Cột phải: Thống kê sticky */}
        <div style={{ position:'sticky', top:16, display:'flex', flexDirection:'column', gap:12 }}>

          {/* KPI 2x2 */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { label:'Tổng CV',    value:total,   color:'#0ea5e9', icon:'📋' },
              { label:'Hoàn thành', value:done,    color:'#10b981', icon:'✅' },
              { label:'Đang làm',   value:inProg,  color:'#f59e0b', icon:'⏳' },
              { label:'Quá hạn',    value:overdue, color:'#ef4444', icon:'⚠️' },
            ].map(s => (
              <div key={s.label} style={{ padding:'16px 12px', borderRadius:12, backgroundColor:'var(--bg-surface)', border:`1.5px solid ${s.color}20`, textAlign:'center' }}>
                <div style={{ fontSize:16, marginBottom:3 }}>{s.icon}</div>
                <div style={{ fontSize:28, fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', marginTop:3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tiến độ */}
          <div style={{ backgroundColor:'var(--bg-surface)', border:'1.5px solid var(--border)', borderRadius:14, padding:'14px 16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)' }}>Tiến độ TB</span>
              <span style={{ fontSize:20, fontWeight:900, color: progressColor(avgProg) }}>{avgProg}%</span>
            </div>
            <ProgressBar value={avgProg} height={8}/>
            <div style={{ display:'flex', flexDirection:'column', gap:7, marginTop:12 }}>
              {[
                { label:'Hoàn thành',   value:done,                      color:'#10b981', pct: total ? Math.round(done/total*100) : 0 },
                { label:'Đang làm',     value:inProg,                    color:'#f59e0b', pct: total ? Math.round(inProg/total*100) : 0 },
                { label:'Chưa bắt đầu', value:total-done-inProg-overdue, color:'#64748b', pct: total ? Math.round((total-done-inProg-overdue)/total*100) : 0 },
                { label:'Quá hạn',      value:overdue,                   color:'#ef4444', pct: total ? Math.round(overdue/total*100) : 0 },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontSize:11, color:'var(--text-muted)' }}>{s.label}</span>
                    <span style={{ fontSize:11, fontWeight:800, color:s.color }}>{s.value}</span>
                  </div>
                  <div style={{ width:'100%', height:4, borderRadius:2, backgroundColor:'var(--bg-hover)', overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:2, backgroundColor:s.color, width:`${s.pct}%`, transition:'width 0.8s ease' }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chất lượng */}
          {eventTasks.filter(t=>t.completion).length > 0 && (
            <div style={{ backgroundColor:'var(--bg-surface)', border:'1.5px solid var(--border)', borderRadius:14, padding:'14px 16px' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', marginBottom:10 }}>Chất lượng hoàn thành</div>
              <div style={{ display:'flex', gap:6 }}>
                {[
                  { key:'OT', label:'Đúng hạn', color:'#10b981' },
                  { key:'OD', label:'Trễ hạn',  color:'#f59e0b' },
                  { key:'IC', label:'Không HT', color:'#ef4444' },
                ].map(c => {
                  const cnt = eventTasks.filter(t => t.completion === c.key).length;
                  return (
                    <div key={c.key} style={{ flex:1, textAlign:'center', padding:'8px 4px', borderRadius:8, backgroundColor:`${c.color}10`, border:`1px solid ${c.color}25` }}>
                      <div style={{ fontSize:18, fontWeight:900, color:c.color }}>{cnt}</div>
                      <div style={{ fontSize:10, fontWeight:800, color:c.color }}>{c.key}</div>
                      <div style={{ fontSize:9, color:'var(--text-muted)' }}>{c.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {showChangePwd && <ChangePasswordModal onClose={() => setShowChangePwd(false)}/>}
    </div>
  );
}

