import React, { useState, useEffect } from 'react';
import { X, Trash2, Save, CheckCircle, XCircle, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services/taskService';
import api from '../../services/api';
import UserPicker from './UserPicker';
import FileAttachmentList from './FilePreview';
import DatePicker from '../DatePicker';
import {
  STATUS_CONFIG, WORK_CATEGORY, LEAD_DEPT,
  TASK_TYPE, COMPLETION_CONFIG, DEPUTY_DIRECTORS
} from '../../utils/constants';

import { showConfirm } from '../../utils/confirm';

const APPROVAL_CONFIG = {
  pending:  { label: 'Chờ duyệt', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Clock },
  approved: { label: 'Đã duyệt',  color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle },
  rejected: { label: 'Từ chối',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: XCircle },
};

export default function TaskDetailModal({ task, onClose }) {
  const { updateTask, deleteTask, fetchTree, fetchKanban } = useTaskStore();
  const { user } = useAuthStore();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [approving, setApproving] = useState(false);
  const [showApproveNote, setShowApproveNote] = useState(false);
  const [approveNote, setApproveNote] = useState('');
  const [currentTask, setCurrentTask] = useState(task);
  const [refreshing, setRefreshing] = useState(false);

  const canEdit    = !user?.role || ['admin','director','manager'].includes(user?.role);
  const canApprove = !user?.role || ['admin','director','manager'].includes(user?.role);

  // ── Refresh task từ server để lấy dữ liệu mới nhất ──
  const refreshTask = async () => {
    setRefreshing(true);
    try {
      const res = await api.get(`/tasks/${task.id}`);
      const fresh = res.data.data;
      setCurrentTask(fresh);
      // Cập nhật form với dữ liệu mới
      setForm(f => ({
        ...f,
        status:    fresh.status,
        progress:  fresh.progress,
        notes:     fresh.notes || f.notes,
        deliverable: fresh.deliverable || f.deliverable,
        completion: fresh.completion || f.completion,
      }));
    } catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  };

  // Auto-refresh mỗi 30s khi modal mở (để admin thấy cập nhật của nhân viên)
  useEffect(() => {
    const interval = setInterval(refreshTask, 30000);
    return () => clearInterval(interval);
  }, [task.id]);

  // Chuẩn hóa collaborators: luôn là array of IDs (string), không phải objects
  const normalizeCollaborators = (collab) => {
    if (!Array.isArray(collab)) return [];
    return collab.map(c => (typeof c === 'object' && c !== null) ? c.id : c).filter(Boolean);
  };

  const [form, setForm] = useState({
    taskName:         task.taskName || '',
    status:           task.status || 'not_started',
    workCategory:     task.workCategory || 'ADM',
    leadDepartment:   task.leadDepartment || 'LD-ADM',
    deputyDirector:   task.deputyDirector || '',
    assigneeId:       task.assigneeId || '',
    collaborators:    normalizeCollaborators(task.collaborators),
    deadline:         task.deadline ? task.deadline.substring(0, 10) : '',
    extendedDeadline: task.extendedDeadline ? task.extendedDeadline.substring(0, 10) : '',
    extensionReason:  task.extensionReason || '',
    taskType:         task.taskType || 'R',
    completion:       task.completion || '',
    progress:         task.progress || 0,
    deliverable:      task.deliverable || '',
    notes:            task.notes || '',
  });

  useEffect(() => {
    userService.getUsers().then(r => setUsers(r.data.data)).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setLoading(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      // Đảm bảo payload sạch trước khi gửi
      const payload = {
        ...form,
        // date fields: rỗng → null
        deadline:         form.deadline || null,
        extendedDeadline: form.extendedDeadline || null,
        // assigneeId rỗng → null
        assigneeId:       form.assigneeId || null,
        // collaborators: luôn là array of IDs
        collaborators:    normalizeCollaborators(form.collaborators),
        // completion rỗng → null
        completion:       form.completion || null,
      };
      await updateTask(task.id, payload);
      setSaveSuccess(true);
      setTimeout(() => onClose(), 800);
    } catch (e) {
      console.error('[handleSave error]', e);
      setSaveError(e.response?.data?.message || e.message || 'Có lỗi xảy ra khi lưu');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const ok = await showConfirm({ title:'Xóa công việc', message:`Xóa công việc "${task.taskCode}"? Các task con cũng sẽ bị xóa.`, confirmLabel:'Xóa' });
    if (!ok) return;
    await deleteTask(task.id);
    onClose();
  };

  const handleApprove = async (action) => {
    setApproving(true);
    try {
      const res = await api.patch(`/tasks/${task.id}/approve`, { action, note: approveNote });
      setCurrentTask(res.data.data);
      setShowApproveNote(false);
      setApproveNote('');
      await fetchTree();
      await fetchKanban();
    } catch (e) { console.error(e); }
    finally { setApproving(false); }
  };

  const approval = APPROVAL_CONFIG[currentTask.approvalStatus || 'pending'] || APPROVAL_CONFIG.pending;
  const ApprovalIcon = approval.icon || Clock;
  const category = WORK_CATEGORY[form.workCategory];

  const Label = ({ children }) => (
    <label style={{ display:'block', fontSize:12, fontWeight:700, color:'var(--text-secondary)', marginBottom:6 }}>
      {children}
    </label>
  );

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth:'620px', maxHeight:'92vh', overflowY:'auto', width:'100%' }}>

        {/* ── Header ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 22px', borderBottom:'1px solid var(--border)', position:'sticky', top:0, backgroundColor:'var(--bg-surface)', zIndex:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontFamily:'monospace', fontSize:13, fontWeight:900, color:category?.color||'#0ea5e9', backgroundColor:`${category?.color||'#0ea5e9'}15`, padding:'3px 10px', borderRadius:6 }}>
              {task.taskCode}
            </span>
            {/* Trạng thái duyệt */}
            <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:6, backgroundColor:approval.bg, color:approval.color }}>
              <ApprovalIcon size={12}/> {approval.label}
            </span>
            {canEdit && (
              <button onClick={handleDelete}
                style={{ padding:'4px 8px', borderRadius:6, border:'none', backgroundColor:'rgba(239,68,68,0.1)', color:'#ef4444', cursor:'pointer', display:'flex', alignItems:'center' }}>
                <Trash2 size={14}/>
              </button>
            )}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {/* Nút refresh — lấy dữ liệu mới nhất từ nhân viên */}
            <button onClick={refreshTask} disabled={refreshing}
              title="Làm mới dữ liệu"
              style={{ padding:'5px 10px', borderRadius:7, border:'1px solid var(--border)',
                backgroundColor:'var(--bg-hover)', color:'var(--text-muted)',
                cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600 }}>
              <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}/>
              {refreshing ? 'Đang tải...' : 'Làm mới'}
            </button>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}>
              <X size={20}/>
            </button>
          </div>
        </div>

        {/* ── Approval banner ── */}
        {canApprove && (
          <div style={{ padding:'12px 22px', borderBottom:'1px solid var(--border)', backgroundColor: currentTask.approvalStatus === 'approved' ? 'rgba(16,185,129,0.06)' : currentTask.approvalStatus === 'rejected' ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)' }}>
            {currentTask.approvalStatus === 'approved' ? (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <CheckCircle size={16} style={{ color:'#10b981' }}/>
                <span style={{ fontSize:13, fontWeight:700, color:'#10b981' }}>
                  Đã duyệt bởi {currentTask.approvedBy?.name || 'Admin'}
                  {currentTask.approvedAt && ` · ${new Date(currentTask.approvedAt).toLocaleDateString('vi-VN')}`}
                </span>
                <button onClick={() => handleApprove('reject')} disabled={approving}
                  style={{ marginLeft:'auto', padding:'4px 12px', borderRadius:6, border:'1px solid #ef4444', backgroundColor:'transparent', color:'#ef4444', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  Hủy duyệt
                </button>
              </div>
            ) : currentTask.approvalStatus === 'rejected' ? (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <XCircle size={16} style={{ color:'#ef4444' }}/>
                <span style={{ fontSize:13, fontWeight:700, color:'#ef4444' }}>
                  Đã từ chối {currentTask.approvalNote ? `· ${currentTask.approvalNote}` : ''}
                </span>
                <button onClick={() => handleApprove('approve')} disabled={approving}
                  style={{ marginLeft:'auto', padding:'4px 12px', borderRadius:6, border:'none', backgroundColor:'#10b981', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  Duyệt lại
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <ShieldCheck size={16} style={{ color:'#f59e0b' }}/>
                <span style={{ fontSize:13, fontWeight:600, color:'var(--text-secondary)' }}>Công việc chờ phê duyệt</span>
                <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                  <button onClick={() => setShowApproveNote(v => !v)}
                    style={{ padding:'5px 14px', borderRadius:7, border:'1px solid var(--border)', backgroundColor:'var(--bg-hover)', color:'var(--text-secondary)', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                    Từ chối
                  </button>
                  <button onClick={() => handleApprove('approve')} disabled={approving}
                    style={{ padding:'5px 14px', borderRadius:7, border:'none', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontSize:12, fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                    <CheckCircle size={13}/> {approving ? 'Đang duyệt...' : 'Duyệt công việc'}
                  </button>
                </div>
              </div>
            )}
            {showApproveNote && (
              <div style={{ marginTop:10, display:'flex', gap:8 }}>
                <input className="input" placeholder="Lý do từ chối (tùy chọn)..." value={approveNote}
                  onChange={e => setApproveNote(e.target.value)}
                  style={{ flex:1, fontSize:13 }}/>
                <button onClick={() => handleApprove('reject')} disabled={approving}
                  style={{ padding:'8px 16px', borderRadius:8, border:'none', backgroundColor:'#ef4444', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  Xác nhận từ chối
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Body ── */}
        <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Thông báo lỗi / thành công */}
          {saveError && (
            <div style={{ padding:'10px 14px', borderRadius:8, backgroundColor:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', fontSize:13, color:'#ef4444', display:'flex', alignItems:'center', gap:8 }}>
              <XCircle size={15}/> {saveError}
            </div>
          )}
          {saveSuccess && (
            <div style={{ padding:'10px 14px', borderRadius:8, backgroundColor:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', fontSize:13, color:'#10b981', display:'flex', alignItems:'center', gap:8 }}>
              <CheckCircle size={15}/> Đã lưu thành công!
            </div>
          )}

          {/* Tên công việc */}
          <div>
            <Label>Tên công việc</Label>
            {canEdit ? (
              <textarea className="input resize-none" rows={2} value={form.taskName}
                onChange={e => set('taskName', e.target.value)} style={{ fontSize:15, fontWeight:500 }}/>
            ) : (
              <div style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)', padding:'10px 0' }}>{form.taskName}</div>
            )}
          </div>

          {/* Trạng thái + Loại */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <Label>Trạng thái</Label>
              {canEdit ? (
                <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
                  {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              ) : (
                <span style={{ fontSize:12, padding:'4px 12px', borderRadius:6, fontWeight:700, backgroundColor:STATUS_CONFIG[form.status]?.bgHex, color:STATUS_CONFIG[form.status]?.textHex }}>
                  {STATUS_CONFIG[form.status]?.label}
                </span>
              )}
            </div>
            <div>
              <Label>Tính chất</Label>
              {canEdit ? (
                <select className="select" value={form.taskType} onChange={e => set('taskType', e.target.value)}>
                  {Object.entries(TASK_TYPE).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              ) : (
                <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{TASK_TYPE[form.taskType]?.label}</span>
              )}
            </div>
          </div>

          {/* Bộ phận + Lãnh đạo */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <Label>Bộ phận phụ trách</Label>
              {canEdit ? (
                <select className="select" value={form.leadDepartment} onChange={e => set('leadDepartment', e.target.value)}>
                  {Object.entries(LEAD_DEPT).map(([k,v]) => <option key={k} value={k}>{k} – {v.label}</option>)}
                </select>
              ) : (
                <span style={{ fontSize:12, color:LEAD_DEPT[form.leadDepartment]?.color }}>{form.leadDepartment}</span>
              )}
            </div>
            <div>
              <Label>Lãnh đạo phụ trách</Label>
              {canEdit ? (
                <select className="select" value={form.deputyDirector} onChange={e => set('deputyDirector', e.target.value)}>
                  <option value="">-- Chọn --</option>
                  {DEPUTY_DIRECTORS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              ) : (
                <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{form.deputyDirector || '—'}</span>
              )}
            </div>
          </div>

          {/* Người thực hiện + Phối hợp */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <Label>Người thực hiện chính</Label>
              {canEdit ? (
                <UserPicker
                  users={users}
                  value={form.assigneeId}
                  onChange={v => set('assigneeId', v)}
                  placeholder="-- Chọn người thực hiện --"
                />
              ) : (
                <span style={{ fontSize:12, color:'var(--text-secondary)' }}>
                  {users.find(u => u.id === form.assigneeId)?.name || '—'}
                </span>
              )}
            </div>
            <div>
              <Label>Người phối hợp</Label>
              {canEdit ? (
                <UserPicker
                  users={users}
                  value={form.collaborators}
                  onChange={v => set('collaborators', v)}
                  multi
                  placeholder="-- Chọn người phối hợp --"
                />
              ) : (
                <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                  {form.collaborators.map(cId => {
                    const u = users.find(u => u.id === cId);
                    return u ? <span key={cId} style={{ fontSize:11, padding:'2px 8px', borderRadius:20, backgroundColor:u.color||'#6366f1', color:'#fff', fontWeight:700 }}>{u.name}</span> : null;
                  })}
                  {form.collaborators.length === 0 && <span style={{ fontSize:12, color:'var(--text-muted)' }}>—</span>}
                </div>
              )}
            </div>
          </div>

          {/* Deadline + Gia hạn */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <Label>Hạn chót</Label>
              {canEdit ? (
                <DatePicker value={form.deadline} onChange={v => set('deadline', v)} placeholder="Chọn hạn chót"/>
              ) : (
                <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{form.deadline || '—'}</span>
              )}
            </div>
            <div>
              <Label>Gia hạn deadline</Label>
              {canEdit ? (
                <DatePicker value={form.extendedDeadline} onChange={v => set('extendedDeadline', v)} placeholder="Chọn ngày gia hạn" minDate={form.deadline || undefined}/>
              ) : (
                <span style={{ fontSize:12, color: form.extendedDeadline ? '#f59e0b' : 'var(--text-muted)' }}>{form.extendedDeadline || '—'}</span>
              )}
            </div>
          </div>

          {canEdit && form.extendedDeadline && (
            <div>
              <Label>Lý do gia hạn</Label>
              <input className="input" placeholder="Lý do khách quan..." value={form.extensionReason} onChange={e => set('extensionReason', e.target.value)}/>
            </div>
          )}

          {/* Hoàn thành + Tiến độ */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <Label>Mức độ hoàn thành</Label>
              {canEdit ? (
                <select className="select" value={form.completion} onChange={e => set('completion', e.target.value)}>
                  <option value="">-- Chưa xác định --</option>
                  {Object.entries(COMPLETION_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              ) : (
                <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{form.completion || '—'}</span>
              )}
            </div>
            <div>
              <Label>Tiến độ: {form.progress}%</Label>
              {canEdit ? (
                <>
                  <input type="range" min="0" max="100" step="5" value={form.progress}
                    onChange={e => set('progress', parseInt(e.target.value))}
                    className="no-transition" style={{ width:'100%', accentColor:'#0ea5e9' }}/>
                  <div style={{ width:'100%', height:6, borderRadius:3, backgroundColor:'var(--bg-hover)', overflow:'hidden', marginTop:4 }}>
                    <div style={{ height:'100%', borderRadius:3, backgroundColor:form.progress===100?'#10b981':'#0ea5e9', width:`${form.progress}%` }}/>
                  </div>
                </>
              ) : (
                <div style={{ width:'100%', height:8, borderRadius:4, backgroundColor:'var(--bg-hover)', overflow:'hidden', marginTop:4 }}>
                  <div style={{ height:'100%', borderRadius:4, backgroundColor:form.progress===100?'#10b981':'#0ea5e9', width:`${form.progress}%` }}/>
                </div>
              )}
            </div>
          </div>

          {/* Kết quả đầu ra */}
          <div>
            <Label>Kết quả đầu ra (Deliverable)</Label>
            {canEdit ? (
              <textarea className="input resize-none" rows={2} placeholder="Mô tả kết quả cần đạt..."
                value={form.deliverable} onChange={e => set('deliverable', e.target.value)}/>
            ) : (
              <div style={{ fontSize:13, color:'var(--text-secondary)', padding:'8px 0', whiteSpace:'pre-wrap' }}>{form.deliverable || '—'}</div>
            )}
          </div>

          {/* Ghi chú */}
          <div>
            <Label>Ghi chú</Label>
            {canEdit ? (
              <textarea className="input resize-none" rows={2} placeholder="Ghi chú thêm..."
                value={form.notes} onChange={e => set('notes', e.target.value)}/>
            ) : (
              <div style={{ fontSize:13, color:'var(--text-secondary)', padding:'8px 0' }}>{form.notes || '—'}</div>
            )}
          </div>
        </div>

        {/* ── Kết quả đầu ra & File đính kèm ── */}
        <div style={{ padding:'0 22px 16px' }}>
          <div style={{ fontSize:13, fontWeight:800, color:'var(--text-secondary)', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
            📎 Kết quả đầu ra / Tài liệu đính kèm
            {currentTask.attachments?.length > 0 && (
              <span style={{ fontSize:11, padding:'1px 7px', borderRadius:8, backgroundColor:'#0ea5e920', color:'#0ea5e9', fontWeight:700 }}>
                {currentTask.attachments.length} file
              </span>
            )}
            <button onClick={refreshTask} disabled={refreshing}
              style={{ marginLeft:'auto', fontSize:10, padding:'2px 8px', borderRadius:5,
                border:'1px solid var(--border)', backgroundColor:'var(--bg-hover)',
                color:'var(--text-muted)', cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>
              <RefreshCw size={10} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}/>
              Làm mới
            </button>
          </div>
          <FileAttachmentList attachments={currentTask.attachments || []}/>
        </div>

        {/* ── Footer ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 22px', borderTop:'1px solid var(--border)', position:'sticky', bottom:0, backgroundColor:'var(--bg-surface)' }}>
          <button onClick={onClose} className="btn btn-secondary">Đóng</button>
          {canEdit && (
            <button onClick={handleSave} disabled={loading || saveSuccess} className="btn btn-primary"
              style={{
                background: saveSuccess
                  ? 'linear-gradient(135deg,#10b981,#059669)'
                  : 'linear-gradient(135deg,#0ea5e9,#0284c7)',
                boxShadow:'0 2px 12px rgba(14,165,233,0.3)'
              }}>
              {saveSuccess ? <><CheckCircle size={15}/> Đã lưu!</> :
               loading     ? <><span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }}/> Đang lưu...</> :
               <><Save size={15}/> Lưu lại</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
