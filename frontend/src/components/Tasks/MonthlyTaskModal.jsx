/**
 * MonthlyTaskModal.jsx — Modal chi tiết/chỉnh sửa CV tháng dùng chung
 * Export: MonthlyTaskModal
 */
import React, { useState, useEffect } from 'react';
import { X, Save, CheckCircle, XCircle, Clock, ShieldCheck } from 'lucide-react';
import { monthlyTaskService, userService } from '../../services/taskService';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

const APPROVAL_CFG = {
  pending:  { label:'Chờ duyệt',     color:'#f59e0b', bg:'rgba(245,158,11,0.12)',  Icon:Clock },
  review:   { label:'Yêu cầu duyệt', color:'#0ea5e9', bg:'rgba(14,165,233,0.12)', Icon:ShieldCheck },
  approved: { label:'Đã duyệt',      color:'#10b981', bg:'rgba(16,185,129,0.12)', Icon:CheckCircle },
  rejected: { label:'Từ chối',       color:'#ef4444', bg:'rgba(239,68,68,0.12)',  Icon:XCircle },
};

const DEPT_OPTIONS = ['KN&DMST', 'Hành chính tổng hợp', 'Thông tin thống kê', 'Dịch vụ'];

function cleanDate(d) {
  if (!d) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0,10);
}

export default function MonthlyTaskModal({ task: initialTask, onClose, onSaved }) {
  const { user: currentUser } = useAuthStore();
  const canApprove = ['admin','director','manager'].includes(currentUser?.role);
  const [task, setTask] = useState(initialTask);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [showRejectNote, setShowRejectNote] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [saveOk, setSaveOk] = useState(false);
  const [saveErr, setSaveErr] = useState('');

  const [form, setForm] = useState({
    taskName:        initialTask.taskName || '',
    startDate:       cleanDate(initialTask.startDate),
    dueDate:         cleanDate(initialTask.dueDate),
    extendedDueDate: cleanDate(initialTask.extendedDueDate),
    assigneeId:      initialTask.assigneeId || '',
    taskType:        initialTask.taskType || 'R',
    completion:      initialTask.completion || '',
    progress:        initialTask.progress ?? 0,
    notes:           initialTask.notes || '',
    department:      initialTask.department || '',
  });

  useEffect(() => {
    userService.getUsers().then(r => setUsers(r.data.data || [])).catch(() => {});
  }, []);

  const s = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setSaveErr('');
    try {
      const payload = {
        ...form,
        startDate:       form.startDate || null,
        dueDate:         form.dueDate || null,
        extendedDueDate: form.extendedDueDate || null,
        assigneeId:      form.assigneeId || null,
        completion:      form.completion || null,
      };
      const res = await monthlyTaskService.update(task.id, payload);
      setTask(res.data.data);
      setSaveOk(true);
      setTimeout(() => { setSaveOk(false); onSaved?.(); }, 800);
    } catch (err) {
      setSaveErr(err.response?.data?.message || 'Có lỗi xảy ra khi lưu');
    } finally { setSaving(false); }
  };

  const handleApprove = async (action) => {
    setApproving(true);
    try {
      const res = await api.patch(`/monthly-tasks/${task.id}/approve`, { action, note: rejectNote });
      setTask(res.data.data);
      setShowRejectNote(false); setRejectNote('');
      onSaved?.();
    } catch (e) { console.error(e); }
    finally { setApproving(false); }
  };

  const handleRequestReview = async () => {
    setApproving(true);
    try {
      const res = await api.patch(`/monthly-tasks/${task.id}/request-review`);
      setTask(res.data.data); onSaved?.();
    } catch (e) { console.error(e); }
    finally { setApproving(false); }
  };

  const ap = APPROVAL_CFG[task.approvalStatus] || APPROVAL_CFG.pending;
  const ApIcon = ap.Icon;
  const typeColor = form.taskType === 'R' ? '#6366f1' : '#f97316';

  const Label = ({ children }) => (
    <label style={{ display:'block', fontSize:12, fontWeight:700, color:'var(--text-secondary)', marginBottom:5 }}>{children}</label>
  );

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth:600, maxHeight:'92vh', overflowY:'auto', width:'100%' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 22px', borderBottom:'1px solid var(--border)', position:'sticky', top:0, backgroundColor:'var(--bg-surface)', zIndex:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontFamily:'monospace', fontSize:13, fontWeight:900, color:'#38bdf8', backgroundColor:'#38bdf820', padding:'3px 10px', borderRadius:6 }}>
              {task.taskId}
            </span>
            <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:5, backgroundColor:`${typeColor}20`, color:typeColor }}>
              {form.taskType === 'R' ? 'Thường xuyên' : 'Phát sinh'}
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:6, backgroundColor:ap.bg, color:ap.color }}>
              <ApIcon size={12}/> {ap.label}
            </span>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}>
            <X size={20}/>
          </button>
        </div>

        {/* Approval banner */}
        <div style={{ padding:'12px 22px', borderBottom:'1px solid var(--border)', backgroundColor: task.approvalStatus==='approved'?'rgba(16,185,129,0.06)':task.approvalStatus==='rejected'?'rgba(239,68,68,0.06)':'rgba(245,158,11,0.06)' }}>
          {task.approvalStatus === 'approved' ? (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <CheckCircle size={15} style={{ color:'#10b981' }}/>
              <span style={{ fontSize:13, fontWeight:700, color:'#10b981' }}>Đã duyệt {task.approvedAt && `· ${new Date(task.approvedAt).toLocaleDateString('vi-VN')}`}</span>
              {canApprove && <button onClick={() => handleApprove('reject')} disabled={approving} style={{ marginLeft:'auto', padding:'4px 12px', borderRadius:6, border:'1px solid #ef4444', backgroundColor:'transparent', color:'#ef4444', fontSize:12, fontWeight:700, cursor:'pointer' }}>Hủy duyệt</button>}
            </div>
          ) : task.approvalStatus === 'rejected' ? (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <XCircle size={15} style={{ color:'#ef4444' }}/>
              <span style={{ fontSize:13, fontWeight:700, color:'#ef4444' }}>Từ chối {task.approvalNote ? `· ${task.approvalNote}` : ''}</span>
              {canApprove && <button onClick={() => handleApprove('approve')} disabled={approving} style={{ marginLeft:'auto', padding:'4px 12px', borderRadius:6, border:'none', backgroundColor:'#10b981', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>Duyệt lại</button>}
            </div>
          ) : task.approvalStatus === 'review' ? (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <ShieldCheck size={15} style={{ color:'#0ea5e9' }}/>
              <span style={{ fontSize:13, fontWeight:600, color:'#0ea5e9' }}>Đang yêu cầu duyệt</span>
              {canApprove && (
                <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                  <button onClick={() => setShowRejectNote(v=>!v)} style={{ padding:'5px 12px', borderRadius:7, border:'1px solid var(--border)', backgroundColor:'var(--bg-hover)', color:'var(--text-secondary)', fontSize:12, fontWeight:700, cursor:'pointer' }}>Từ chối</button>
                  <button onClick={() => handleApprove('approve')} disabled={approving} style={{ padding:'5px 12px', borderRadius:7, border:'none', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontSize:12, fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                    <CheckCircle size={13}/> {approving ? 'Đang duyệt...' : 'Duyệt'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Clock size={15} style={{ color:'#f59e0b' }}/>
              <span style={{ fontSize:13, fontWeight:600, color:'var(--text-secondary)' }}>Chờ phê duyệt</span>
              <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                {!canApprove && (
                  <button onClick={handleRequestReview} disabled={approving} style={{ padding:'5px 12px', borderRadius:7, border:'none', background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'#fff', fontSize:12, fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                    <ShieldCheck size={13}/> {approving ? 'Đang gửi...' : 'Yêu cầu duyệt'}
                  </button>
                )}
                {canApprove && (
                  <>
                    <button onClick={() => setShowRejectNote(v=>!v)} style={{ padding:'5px 12px', borderRadius:7, border:'1px solid var(--border)', backgroundColor:'var(--bg-hover)', color:'var(--text-secondary)', fontSize:12, fontWeight:700, cursor:'pointer' }}>Từ chối</button>
                    <button onClick={() => handleApprove('approve')} disabled={approving} style={{ padding:'5px 12px', borderRadius:7, border:'none', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontSize:12, fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                      <CheckCircle size={13}/> {approving ? 'Đang duyệt...' : 'Duyệt'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
          {showRejectNote && (
            <div style={{ marginTop:10, display:'flex', gap:8 }}>
              <input className="input" placeholder="Lý do từ chối..." value={rejectNote} onChange={e => setRejectNote(e.target.value)} style={{ flex:1, fontSize:13 }}/>
              <button onClick={() => handleApprove('reject')} disabled={approving} style={{ padding:'8px 16px', borderRadius:8, border:'none', backgroundColor:'#ef4444', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>Xác nhận</button>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSave} style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:14 }}>
          {saveErr && (
            <div style={{ padding:'10px 14px', borderRadius:8, backgroundColor:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', fontSize:13, color:'#ef4444' }}>{saveErr}</div>
          )}

          {/* Tên công việc */}
          <div>
            <Label>Tên công việc *</Label>
            <textarea className="input" rows={2} style={{ resize:'none' }} required
              value={form.taskName} onChange={e => s('taskName', e.target.value)}/>
          </div>

          {/* Ngày */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div>
              <Label>Ngày bắt đầu</Label>
              <input type="date" className="input" value={form.startDate} onChange={e => s('startDate', e.target.value)}/>
            </div>
            <div>
              <Label>Ngày kết thúc *</Label>
              <input type="date" className="input" required value={form.dueDate} onChange={e => s('dueDate', e.target.value)}/>
            </div>
            <div>
              <Label>Gia hạn</Label>
              <input type="date" className="input" value={form.extendedDueDate} onChange={e => s('extendedDueDate', e.target.value)}/>
            </div>
          </div>

          {/* Người thực hiện + Bộ phận */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <Label>Người thực hiện</Label>
              <select className="select" value={form.assigneeId} onChange={e => s('assigneeId', e.target.value)}>
                <option value="">-- Chọn --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Bộ phận</Label>
              <select className="select" value={form.department} onChange={e => s('department', e.target.value)}>
                <option value="">-- Chọn bộ phận --</option>
                {DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Loại + Hoàn thành + Tiến độ */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div>
              <Label>Loại (R/A)</Label>
              <select className="select" value={form.taskType} onChange={e => { s('taskType', e.target.value); }}>
                <option value="R">R – Thường xuyên</option>
                <option value="A">A – Phát sinh</option>
              </select>
            </div>
            <div>
              <Label>Hoàn thành</Label>
              <select className="select" value={form.completion} onChange={e => s('completion', e.target.value)}>
                <option value="">— Chưa xác định</option>
                <option value="OT">OT – Đúng hạn</option>
                <option value="OD">OD – Trễ hạn</option>
                <option value="IC">IC – Không HT</option>
              </select>
            </div>
            <div>
              <Label>Tiến độ: {form.progress}%</Label>
              <input type="range" min="0" max="100" step="5" value={form.progress}
                onChange={e => s('progress', parseInt(e.target.value))}
                style={{ width:'100%', accentColor:'#0ea5e9', marginTop:8 }}/>
              <div style={{ width:'100%', height:6, borderRadius:3, backgroundColor:'var(--bg-hover)', overflow:'hidden', marginTop:4 }}>
                <div style={{ height:'100%', borderRadius:3, backgroundColor: form.progress===100?'#10b981':'#0ea5e9', width:`${form.progress}%` }}/>
              </div>
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <Label>Ghi chú</Label>
            <textarea className="input" rows={2} style={{ resize:'none' }}
              value={form.notes} onChange={e => s('notes', e.target.value)}/>
          </div>

          {/* Footer */}
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10, paddingTop:4, borderTop:'1px solid var(--border)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Đóng</button>
            <button type="submit" className="btn btn-primary" disabled={saving || saveOk}
              style={{ background: saveOk ? 'linear-gradient(135deg,#10b981,#059669)' : undefined }}>
              {saveOk ? <><CheckCircle size={14}/> Đã lưu!</> : saving ? 'Đang lưu...' : <><Save size={14}/> Lưu</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
