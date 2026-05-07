import React, { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar, AlertTriangle, Clock, CheckCircle, XCircle, ShieldCheck, Save, Trash2, Search } from 'lucide-react';
import { eventService, taskService, monthlyTaskService, userService } from '../services/taskService';
import { EVENT_TYPE_CONFIG, STATUS_CONFIG, WORK_CATEGORY, COMPLETION_CONFIG } from '../utils/constants';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameDay, isToday, addMonths, subMonths, differenceInCalendarDays
} from 'date-fns';
import { vi } from 'date-fns/locale';
import TaskDetailModal from '../components/Tasks/TaskDetailModal';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

// ── Deadline badge helper ──────────────────────────────────────────────────────
function getDeadlineStyle(dueDate, isDone) {
  if (isDone || !dueDate) return null;
  const diff = differenceInCalendarDays(new Date(dueDate), new Date());
  if (diff < 0)   return { color: '#ef4444', bg: '#ef444420', label: `Quá ${Math.abs(diff)}n` };
  if (diff === 0) return { color: '#f97316', bg: '#f9731620', label: 'Hôm nay' };
  if (diff <= 3)  return { color: '#f59e0b', bg: '#f59e0b20', label: `${diff}n` };
  return null;
}

// ── Monthly Task Detail Modal ─────────────────────────────────────────────────
function MonthlyTaskDetailModal({ task: initialTask, onClose, onSaved }) {
  const { user: currentUser } = useAuthStore();
  const canApprove = ['admin','director','manager'].includes(currentUser?.role);
  const [task, setTask] = useState(initialTask);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [showRejectNote, setShowRejectNote] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [saveOk, setSaveOk] = useState(false);
  const [form, setForm] = useState({
    taskName: initialTask.taskName || '',
    startDate: initialTask.startDate ? initialTask.startDate.slice(0,10) : '',
    dueDate: initialTask.dueDate ? initialTask.dueDate.slice(0,10) : '',
    extendedDueDate: initialTask.extendedDueDate ? initialTask.extendedDueDate.slice(0,10) : '',
    assigneeId: initialTask.assigneeId || '',
    taskType: initialTask.taskType || 'R',
    completion: initialTask.completion || '',
    progress: initialTask.progress ?? 0,
    notes: initialTask.notes || '',
    department: initialTask.department || '',
  });

  useEffect(() => {
    userService.getUsers().then(r => setUsers(r.data.data || [])).catch(() => {});
  }, []);

  const s = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await monthlyTaskService.update(task.id, form);
      setTask(res.data.data);
      setSaveOk(true);
      setTimeout(() => { setSaveOk(false); onSaved?.(); }, 800);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleApprove = async (action) => {
    setApproving(true);
    try {
      const res = await api.patch(`/monthly-tasks/${task.id}/approve`, { action, note: rejectNote });
      setTask(res.data.data);
      setShowRejectNote(false);
      setRejectNote('');
      onSaved?.();
    } catch (e) { console.error(e); }
    finally { setApproving(false); }
  };

  const handleRequestReview = async () => {
    setApproving(true);
    try {
      const res = await api.patch(`/monthly-tasks/${task.id}/request-review`);
      setTask(res.data.data);
      onSaved?.();
    } catch (e) { console.error(e); }
    finally { setApproving(false); }
  };

  const APPROVAL_CONFIG = {
    pending:  { label:'Chờ duyệt',     color:'#f59e0b', bg:'rgba(245,158,11,0.12)',  Icon:Clock },
    review:   { label:'Yêu cầu duyệt', color:'#0ea5e9', bg:'rgba(14,165,233,0.12)', Icon:ShieldCheck },
    approved: { label:'Đã duyệt',      color:'#10b981', bg:'rgba(16,185,129,0.12)', Icon:CheckCircle },
    rejected: { label:'Từ chối',       color:'#ef4444', bg:'rgba(239,68,68,0.12)',  Icon:XCircle },
  };
  const ap = APPROVAL_CONFIG[task.approvalStatus] || APPROVAL_CONFIG.pending;
  const ApIcon = ap.Icon;

  const Label = ({ children }) => (
    <label style={{ display:'block', fontSize:12, fontWeight:700, color:'var(--text-secondary)', marginBottom:5 }}>{children}</label>
  );

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth:580, maxHeight:'92vh', overflowY:'auto', width:'100%' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 22px', borderBottom:'1px solid var(--border)', position:'sticky', top:0, backgroundColor:'var(--bg-surface)', zIndex:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontFamily:'monospace', fontSize:13, fontWeight:900, color:'#38bdf8', backgroundColor:'#38bdf820', padding:'3px 10px', borderRadius:6 }}>
              {task.taskId}
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:6, backgroundColor:ap.bg, color:ap.color }}>
              <ApIcon size={12}/> {ap.label}
            </span>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}>
            <X size={20}/>
          </button>
        </div>

        {/* Approval banner */}
        <div style={{ padding:'12px 22px', borderBottom:'1px solid var(--border)', backgroundColor: task.approvalStatus==='approved' ? 'rgba(16,185,129,0.06)' : task.approvalStatus==='rejected' ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)' }}>
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
          <div>
            <Label>Tên công việc *</Label>
            <input className="input" value={form.taskName} onChange={e => s('taskName', e.target.value)} required/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div><Label>Ngày bắt đầu</Label><input type="date" className="input" value={form.startDate} onChange={e => s('startDate', e.target.value)}/></div>
            <div><Label>Ngày kết thúc *</Label><input type="date" className="input" value={form.dueDate} onChange={e => s('dueDate', e.target.value)} required/></div>
            <div><Label>Gia hạn</Label><input type="date" className="input" value={form.extendedDueDate} onChange={e => s('extendedDueDate', e.target.value)}/></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <Label>Người thực hiện</Label>
              <select className="select" value={form.assigneeId} onChange={e => s('assigneeId', e.target.value)}>
                <option value="">-- Chọn --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Loại (R/A)</Label>
              <select className="select" value={form.taskType} onChange={e => s('taskType', e.target.value)}>
                <option value="R">R – Thường xuyên</option>
                <option value="A">A – Phát sinh</option>
              </select>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
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
              <input type="range" min="0" max="100" step="5" value={form.progress} onChange={e => s('progress', parseInt(e.target.value))} style={{ width:'100%', accentColor:'#0ea5e9', marginTop:8 }}/>
            </div>
          </div>
          <div>
            <Label>Ghi chú</Label>
            <textarea className="input" rows={2} style={{ resize:'none' }} value={form.notes} onChange={e => s('notes', e.target.value)}/>
          </div>
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

export default function UnifiedCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents]           = useState([]);
  const [eventTasks, setEventTasks]   = useState([]);
  const [monthlyTasks, setMonthlyTasks] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);   // sự kiện task
  const [selectedMonthly, setSelectedMonthly] = useState(null); // CV tháng
  const [viewMode, setViewMode] = useState('all');
  const [search, setSearch] = useState('');

  const month = currentDate.getMonth() + 1;
  const year  = currentDate.getFullYear();

  const fetchData = useCallback(async () => {
    try {
      // Fetch events filtered by month/year (events are month-specific)
      // Fetch tasks WITHOUT month filter — filter by deadline date client-side
      // This ensures tasks with deadlines in this month are shown regardless of creation month
      const [evRes, etRes, mtRes] = await Promise.all([
        eventService.getEvents({ month, year }),
        taskService.getTasks({ year }),          // fetch all tasks for the year
        monthlyTaskService.getTasks({ year })    // fetch all monthly tasks for the year
      ]);
      setEvents(evRes.data.data || []);
      setEventTasks(etRes.data.data || []);
      setMonthlyTasks(mtRes.data.data || []);
    } catch (e) { console.error(e); }
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd   = endOfMonth(currentDate);
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad   = getDay(monthStart);

  const getItemsForDay = (day) => {
    const items = [];
    if (viewMode === 'all' || viewMode === 'event') {
      // Sự kiện lịch — theo startDate
      events.forEach(e => {
        if (e.startDate && isSameDay(new Date(e.startDate), day))
          items.push({ type:'calEvent', data:e });
      });
      // Event tasks — theo deadline (extendedDeadline ưu tiên)
      eventTasks.forEach(t => {
        const dl = t.extendedDeadline || t.deadline;
        if (dl && isSameDay(new Date(dl), day))
          items.push({ type:'eventTask', data:t });
        // Cũng hiện nếu startDate trùng ngày
        else if (t.startDate && isSameDay(new Date(t.startDate), day) && !items.find(x => x.data?.id === t.id))
          items.push({ type:'eventTask', data:t });
      });
    }
    if (viewMode === 'all' || viewMode === 'monthly') {
      monthlyTasks.forEach(t => {
        const dl = t.extendedDueDate || t.dueDate;
        if (dl && isSameDay(new Date(dl), day))
          items.push({ type:'monthlyTask', data:t });
        // Cũng hiện nếu startDate trùng ngày
        else if (t.startDate && isSameDay(new Date(t.startDate), day) && !items.find(x => x.data?.id === t.id))
          items.push({ type:'monthlyTask', data:t });
      });
    }
    return items;
  };

  // Items cho ngày đang chọn, có filter search
  const selectedItems = selectedDay
    ? getItemsForDay(selectedDay).filter(item => {
        if (!search.trim()) return true;
        const kw = search.toLowerCase();
        const d = item.data;
        return (
          d.title?.toLowerCase().includes(kw) ||
          d.taskName?.toLowerCase().includes(kw) ||
          d.taskCode?.toLowerCase().includes(kw) ||
          d.taskId?.toLowerCase().includes(kw)
        );
      })
    : [];

  return (
    <div style={{ display:'flex', gap:0, height:'100%', overflow:'hidden' }}>

      {/* ── Left: Calendar ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12, minWidth:0, overflow:'hidden' }}>

        {/* Top bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <h2 style={{ fontSize:18, fontWeight:900, color:'var(--text-primary)', margin:0 }}>Lịch Biểu</h2>
            {['all','event','monthly'].map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                style={{ padding:'6px 14px', borderRadius:8, border:'none', fontSize:12, fontWeight:700, cursor:'pointer',
                  backgroundColor: viewMode===m ? '#0ea5e9' : 'var(--bg-hover)',
                  color: viewMode===m ? '#fff' : 'var(--text-secondary)', transition:'all 0.2s' }}>
                {m==='all' ? 'Tất cả' : m==='event' ? 'Sự kiện' : 'CV tháng'}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={() => setCurrentDate(d => subMonths(d,1))}
              style={{ padding:7, borderRadius:8, border:'none', backgroundColor:'var(--bg-hover)', color:'var(--text-secondary)', cursor:'pointer', display:'flex' }}>
              <ChevronLeft size={17}/>
            </button>
            <span style={{ fontSize:15, fontWeight:800, minWidth:130, textAlign:'center', color:'var(--text-primary)' }}>
              THÁNG {month} {year}
            </span>
            <button onClick={() => setCurrentDate(d => addMonths(d,1))}
              style={{ padding:7, borderRadius:8, border:'none', backgroundColor:'var(--bg-hover)', color:'var(--text-secondary)', cursor:'pointer', display:'flex' }}>
              <ChevronRight size={17}/>
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div style={{ backgroundColor:'var(--bg-surface)', borderRadius:14, border:'1.5px solid var(--border)', overflow:'hidden', flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
          {/* Weekday headers */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'1.5px solid var(--border)', flexShrink:0 }}>
            {WEEKDAYS.map((d,i) => (
              <div key={d} style={{ padding:'9px 0', textAlign:'center', fontSize:11, fontWeight:800, letterSpacing:'0.05em',
                color: i===0 ? '#ef4444' : i===6 ? '#0ea5e9' : 'var(--text-muted)' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', flex:1, gridAutoRows:'minmax(90px,1fr)', overflowY:'auto' }}>
            {Array.from({ length: startPad }).map((_,i) => (
              <div key={`pad-${i}`} style={{ borderBottom:'1px solid var(--border)', borderRight:'1px solid var(--border)', backgroundColor:'var(--bg-base)', opacity:0.3 }}/>
            ))}

            {days.map((day, idx) => {
              const items = getItemsForDay(day);
              const today = isToday(day);
              const colIdx = (startPad + idx) % 7;
              const isSat = colIdx === 6;
              const isSelected = selectedDay && isSameDay(day, selectedDay);

              return (
                <div key={day.toISOString()} onClick={() => setSelectedDay(isSameDay(day, selectedDay) ? null : day)}
                  style={{
                    borderBottom:'1px solid var(--border)',
                    borderRight: isSat ? 'none' : '1px solid var(--border)',
                    padding:'6px 6px 4px', cursor:'pointer', overflow:'hidden',
                    backgroundColor: isSelected ? 'rgba(14,165,233,0.12)' : today ? 'rgba(14,165,233,0.05)' : 'var(--bg-surface)',
                    outline: isSelected ? '2px solid #0ea5e9' : 'none',
                    outlineOffset: '-2px',
                    transition:'background 0.15s'
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = today ? 'rgba(14,165,233,0.05)' : 'var(--bg-surface)'; }}
                >
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:12, fontWeight:800,
                      backgroundColor: today ? '#0ea5e9' : 'transparent',
                      color: today ? '#fff' : colIdx===0 ? '#ef4444' : colIdx===6 ? '#0ea5e9' : 'var(--text-primary)' }}>
                      {format(day,'d')}
                    </div>
                    {items.length > 0 && (
                      <span style={{ fontSize:10, fontWeight:800, color:'#0ea5e9', backgroundColor:'#0ea5e920', padding:'1px 5px', borderRadius:4 }}>
                        {items.length}
                      </span>
                    )}
                  </div>

                  {items.slice(0,3).map((item, i) => {
                    if (item.type === 'calEvent') {
                      const ev = item.data;
                      return (
                        <div key={i} style={{ fontSize:10, padding:'2px 5px', borderRadius:4, marginBottom:2,
                          backgroundColor:`${ev.color||'#6366f1'}25`, color:ev.color||'#6366f1',
                          fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          📅 {ev.title}
                        </div>
                      );
                    }
                    if (item.type === 'eventTask') {
                      const t = item.data;
                      const st = STATUS_CONFIG[t.status];
                      const dl = getDeadlineStyle(t.extendedDeadline || t.deadline, t.status==='done');
                      return (
                        <div key={i} style={{ fontSize:10, padding:'2px 5px', borderRadius:4, marginBottom:2,
                          backgroundColor: dl ? dl.bg : (st?.bgHex || '#37415120'),
                          color: dl ? dl.color : (st?.textHex || '#9ca3af'),
                          fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                          border: dl ? `1px solid ${dl.color}40` : 'none' }}>
                          {dl && '⚠ '}{t.taskCode}
                        </div>
                      );
                    }
                    if (item.type === 'monthlyTask') {
                      const t = item.data;
                      const comp = t.completion;
                      const compColor = comp==='OT' ? '#10b981' : comp==='OD' ? '#f59e0b' : comp==='IC' ? '#ef4444' : '#6366f1';
                      const dl = getDeadlineStyle(t.extendedDueDate || t.dueDate, comp==='OT' || t.progress===100);
                      return (
                        <div key={i} style={{ fontSize:10, padding:'2px 5px', borderRadius:4, marginBottom:2,
                          backgroundColor: dl ? dl.bg : `${compColor}20`,
                          color: dl ? dl.color : compColor,
                          fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                          border: dl ? `1px solid ${dl.color}40` : 'none' }}>
                          {dl && '⚠ '}{t.taskId || t.taskName?.slice(0,12)}
                        </div>
                      );
                    }
                    return null;
                  })}
                  {items.length > 3 && (
                    <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', marginTop:1 }}>+{items.length-3} nữa</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Right: Day detail panel ── */}
      {selectedDay && (
        <div style={{ width:340, flexShrink:0, display:'flex', flexDirection:'column', backgroundColor:'var(--bg-surface)', borderLeft:'1.5px solid var(--border)', borderRadius:'0 14px 14px 0', overflow:'hidden', marginLeft:12 }}>
          {/* Panel header */}
          <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div>
              <div style={{ fontSize:15, fontWeight:900, color:'var(--text-primary)' }}>
                {format(selectedDay, 'EEEE', { locale:vi }).charAt(0).toUpperCase() + format(selectedDay, 'EEEE', { locale:vi }).slice(1)}
              </div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
                {format(selectedDay, 'dd/MM/yyyy')} · {selectedItems.length} mục
              </div>
            </div>
            <button onClick={() => setSelectedDay(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}>
              <X size={18}/>
            </button>
          </div>

          {/* Search */}
          <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
            <div style={{ position:'relative' }}>
              <Search size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }}/>
              <input type="text" placeholder="Tìm trong ngày này..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width:'100%', paddingLeft:28, paddingRight:10, paddingTop:6, paddingBottom:6, fontSize:12, borderRadius:8, border:'1.5px solid var(--border)', backgroundColor:'var(--bg-input)', color:'var(--text-secondary)', outline:'none', boxSizing:'border-box' }}/>
            </div>
          </div>

          {/* Items list */}
          <div style={{ flex:1, overflowY:'auto', padding:'10px 12px', display:'flex', flexDirection:'column', gap:8 }}>
            {selectedItems.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>
                <Calendar size={28} style={{ margin:'0 auto 8px', opacity:0.3 }}/>
                <p style={{ fontSize:12 }}>{search ? 'Không tìm thấy' : 'Không có công việc'}</p>
              </div>
            ) : selectedItems.map((item, i) => {

              // ── Sự kiện lịch ──
              if (item.type === 'calEvent') {
                const ev = item.data;
                return (
                  <div key={i} style={{ padding:'10px 12px', borderRadius:10, backgroundColor:`${ev.color||'#6366f1'}12`, border:`1.5px solid ${ev.color||'#6366f1'}30` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:10, height:10, borderRadius:'50%', backgroundColor:ev.color||'#6366f1', flexShrink:0 }}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{ev.title}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                          {EVENT_TYPE_CONFIG[ev.type]?.label} {ev.description && `· ${ev.description}`}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // ── Event Task (Sự kiện CV) ──
              if (item.type === 'eventTask') {
                const t = item.data;
                const st = STATUS_CONFIG[t.status];
                const cat = WORK_CATEGORY[t.workCategory];
                const dl = getDeadlineStyle(t.extendedDeadline || t.deadline, t.status==='done');
                return (
                  <div key={i} onClick={() => setSelectedTask(t)}
                    style={{ padding:'10px 12px', borderRadius:10, backgroundColor:'var(--bg-hover)',
                      border:`1.5px solid ${cat?.color||'#0ea5e9'}40`, cursor:'pointer', transition:'transform 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
                    onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontSize:11, fontFamily:'monospace', fontWeight:800, color:cat?.color||'#0ea5e9', backgroundColor:`${cat?.color||'#0ea5e9'}15`, padding:'2px 7px', borderRadius:4 }}>
                        {t.taskCode}
                      </span>
                      {st && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:5, fontWeight:700, backgroundColor:st.bgHex, color:st.textHex }}>{st.label}</span>}
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', marginBottom:6, lineHeight:1.4 }}>{t.taskName}</div>
                    {t.assignee && (
                      <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:6 }}>
                        <div style={{ width:18, height:18, borderRadius:'50%', backgroundColor:t.assignee.color||'#6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color:'#fff' }}>
                          {t.assignee.name?.charAt(0)}
                        </div>
                        <span style={{ fontSize:11, color:'var(--text-secondary)' }}>{t.assignee.name}</span>
                      </div>
                    )}
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ flex:1, height:5, borderRadius:3, backgroundColor:'var(--bg-base)', overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:3, backgroundColor:cat?.color||'#0ea5e9', width:`${t.progress||0}%` }}/>
                      </div>
                      <span style={{ fontSize:11, fontWeight:800, color:'var(--text-muted)', minWidth:28 }}>{t.progress||0}%</span>
                    </div>
                    {dl && (
                      <div style={{ marginTop:6, display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:5, backgroundColor:dl.bg, color:dl.color, border:`1px solid ${dl.color}40` }}>
                        <AlertTriangle size={10}/> {dl.label}
                      </div>
                    )}
                  </div>
                );
              }

              // ── Monthly Task ──
              if (item.type === 'monthlyTask') {
                const t = item.data;
                const comp = t.completion;
                const compColor = comp==='OT' ? '#10b981' : comp==='OD' ? '#f59e0b' : comp==='IC' ? '#ef4444' : '#6366f1';
                const compLabel = comp==='OT' ? 'OT – Đúng hạn' : comp==='OD' ? 'OD – Trễ hạn' : comp==='IC' ? 'IC – Không HT' : '—';
                const dl = getDeadlineStyle(t.extendedDueDate || t.dueDate, comp==='OT' || t.progress===100);
                const typeColor = t.taskType==='A' ? '#f97316' : '#6366f1';
                return (
                  <div key={i} onClick={() => setSelectedMonthly(t)}
                    style={{ padding:'10px 12px', borderRadius:10, backgroundColor:'var(--bg-hover)',
                      border:`1.5px solid ${typeColor}40`, cursor:'pointer', transition:'transform 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
                    onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontSize:11, fontFamily:'monospace', fontWeight:800, color:'#38bdf8', backgroundColor:'#38bdf820', padding:'2px 7px', borderRadius:4 }}>
                        {t.taskId}
                      </span>
                      <div style={{ display:'flex', gap:4 }}>
                        <span style={{ fontSize:10, padding:'2px 7px', borderRadius:4, fontWeight:800, backgroundColor:`${typeColor}20`, color:typeColor }}>{t.taskType}</span>
                        {comp && <span style={{ fontSize:10, padding:'2px 7px', borderRadius:4, fontWeight:800, backgroundColor:`${compColor}20`, color:compColor }}>{comp}</span>}
                      </div>
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', marginBottom:6, lineHeight:1.4 }}>{t.taskName}</div>
                    {t.assignee && (
                      <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:6 }}>
                        <div style={{ width:18, height:18, borderRadius:'50%', backgroundColor:t.assignee.color||'#6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color:'#fff' }}>
                          {t.assignee.name?.charAt(0)}
                        </div>
                        <span style={{ fontSize:11, color:'var(--text-secondary)' }}>{t.assignee.name}</span>
                      </div>
                    )}
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ flex:1, height:5, borderRadius:3, backgroundColor:'var(--bg-base)', overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:3, backgroundColor:compColor, width:`${t.progress||0}%` }}/>
                      </div>
                      <span style={{ fontSize:11, fontWeight:800, color:'var(--text-muted)', minWidth:28 }}>{t.progress||0}%</span>
                    </div>
                    {dl && (
                      <div style={{ marginTop:6, display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:5, backgroundColor:dl.bg, color:dl.color, border:`1px solid ${dl.color}40` }}>
                        <AlertTriangle size={10}/> {dl.label}
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* ── Task Detail Modal (Sự kiện) ── */}
      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => { setSelectedTask(null); fetchData(); }}/>
      )}

      {/* ── Monthly Task Detail Modal ── */}
      {selectedMonthly && (
        <MonthlyTaskDetailModal
          task={selectedMonthly}
          onClose={() => setSelectedMonthly(null)}
          onSaved={() => { fetchData(); }}
        />
      )}
    </div>
  );
}

