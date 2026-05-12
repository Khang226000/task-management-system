import React, { useEffect, useState } from 'react';
import { Plus, Trash2, X, Save, Filter, CheckCircle, XCircle, Clock, ShieldCheck, Search, Paperclip, Upload } from 'lucide-react';
import { monthlyTaskService, userService, departmentService } from '../services/taskService';
import { MONTHS, YEARS } from '../utils/constants';
import { format } from 'date-fns';
import { useFilterStore } from '../store/filterStore';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import FileAttachmentList from '../components/Tasks/FilePreview';
import DatePicker from '../components/DatePicker';
import { showConfirm } from '../utils/confirm';

const APPROVAL_CONFIG = {
  pending:  { label: 'Chờ duyệt',       color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: Clock },
  review:   { label: 'Yêu cầu duyệt',   color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)', icon: ShieldCheck },
  approved: { label: 'Đã duyệt',         color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle },
  rejected: { label: 'Từ chối',          color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: XCircle },
};

const COMPLETION_STYLE = {
  OT: { label: 'OT',  bg: '#10b98120', color: '#10b981', border: '#10b98140' },
  OD: { label: 'OD',  bg: '#f59e0b20', color: '#f59e0b', border: '#f59e0b40' },
  IC: { label: 'IC',  bg: '#ef444420', color: '#ef4444', border: '#ef444440' },
  null: { label: '—', bg: 'transparent', color: 'var(--text-muted)', border: 'transparent' }
};

const TYPE_STYLE = {
  R: { bg: '#6366f120', color: '#818cf8' },
  A: { bg: '#f9731620', color: '#fb923c' }
};

const GROUP_LABELS = {
  THUONG_XUYEN: 'NHIỆM VỤ THƯỜNG XUYÊN',
  PHAT_SINH:    'NHIỆM VỤ PHÁT SINH'
};

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '—' : format(dt, 'dd/MM');
};
function getDeadlineBadge(task) {
  const isDone = task.completion === 'OT' || task.progress === 100;
  const effectiveDue = task.extendedDueDate || task.dueDate;
  if (!effectiveDue) return null;
  if (isDone) return null; // ệ hoàn thành, khng cảnh bo
  const due = new Date(effectiveDue);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due - today) / 86400000);
  if (diffDays < 0)   return { color: '#dc2626', bg: '#dc262618', label: `Quá hạn ${Math.abs(diffDays)} ngày`, icon: '=4' };
  if (diffDays === 0) return { color: '#ef4444', bg: '#ef444418', label: 'Đến hạn hôm nay', icon: '=4' };
  if (diffDays <= 3)  return { color: '#f97316', bg: '#f9731618', label: `Còn ${diffDays} ngày`, icon: '' };
  return null;
}

const BASE_URL = 'http://localhost:5000';

// —— File attachment section cho Monthly Task modal ——
function MonthlyFileSection({ taskId, attachments: initAttachments }) {
  const [attachments, setAttachments] = useState(initAttachments || []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setError('');
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await api.post(`/upload/monthly/${taskId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setAttachments(prev => [...prev, res.data.data]);
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
      await api.delete(`/upload/monthly/${taskId}/${filename}`);
      setAttachments(prev => prev.filter(f => f.filename !== filename));
    } catch { setError('Xóa file thất bại'); }
  };

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Paperclip size={13} style={{ color: 'var(--text-muted)' }}/>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
            Kết quả đầu ra / Tài liệu đính kèm
          </span>
          {attachments.length > 0 && (
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, backgroundColor: '#0ea5e920', color: '#0ea5e9', fontWeight: 800 }}>
              {attachments.length}
            </span>
          )}
        </div>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7,
          backgroundColor: uploading ? 'rgba(14,165,233,0.1)' : '#0ea5e920',
          color: uploading ? 'var(--text-muted)' : '#0ea5e9',
          fontSize: 12, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer',
          border: '1px solid #0ea5e930'
        }}>
          {uploading
            ? <><span style={{ width: 12, height: 12, border: '2px solid rgba(14,165,233,0.3)', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/> ĐĐang tải...</>
            : <><Upload size={12}/> Đính kèm file</>
          }
          <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            onChange={handleUpload} disabled={uploading} style={{ display: 'none' }}/>
        </label>
      </div>
      {error && (
        <div style={{ fontSize: 12, color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', padding: '6px 10px', borderRadius: 6, marginBottom: 8 }}>
          {error}
        </div>
      )}
      {/* Dng FileAttachmentList ệỒ xem tr:c + tải */}
      <FileAttachmentList attachments={attachments} onDelete={handleDelete}/>
    </div>
  );
}

export default function MonthlyTaskPage() {
  const [tasks, setTasks]       = useState([]);
  const [users, setUsers]       = useState([]);
  const [apiDepts, setApiDepts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuthStore();
  const canApprove = ['admin','director','manager'].includes(currentUser?.role);
  const canEdit    = ['admin','director','manager'].includes(currentUser?.role);

  // —— Filter từ store (persist qua tab) ——
  const { monthly, setFilter } = useFilterStore();
  const month = monthly.month;
  const year  = monthly.year;
  const filterAssignee   = monthly.assigneeId;
  const filterDepartment = monthly.department;
  const filterCompletion = monthly.completion;
  const filterGroup      = monthly.taskGroup;
  const filterType       = monthly.taskType;

  const setMonth = (v) => setFilter('monthly', { month: v });
  const setYear  = (v) => setFilter('monthly', { year: v });
  const setFilterAssignee   = (v) => setFilter('monthly', { assigneeId: v });
  const setFilterDepartment = (v) => setFilter('monthly', { department: v });
  const setFilterCompletion = (v) => setFilter('monthly', { completion: v });
  const setFilterGroup      = (v) => setFilter('monthly', { taskGroup: v });
  const setFilterType       = (v) => setFilter('monthly', { taskType: v });
  const [searchText, setSearchText] = useState('');  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask]   = useState(null);
  const [currentTask, setCurrentTask] = useState(null);
  const [approving, setApproving] = useState(false);
  const [showApproveNote, setShowApproveNote] = useState(false);
  const [approveNote, setApproveNote] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [form, setForm] = useState({
    taskId: '', taskName: '', startDate: '', dueDate: '', extendedDueDate: '',
    assigneeId: '', taskType: 'R', completion: '', progress: 0,
    notes: '', taskGroup: 'THUONG_XUYEN', department: '', stt: 0
  });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = { month, year };
      if (filterAssignee)   params.assigneeId = filterAssignee;
      if (filterDepartment) params.department = filterDepartment;
      if (filterCompletion) params.completion = filterCompletion;
      // filterGroup (THUONG_XUYEN/PHAT_SINH)   map sang taskType (R/A) ệỒ lọc chính xác
      if (filterGroup === 'THUONG_XUYEN') params.taskType = 'R';
      else if (filterGroup === 'PHAT_SINH') params.taskType = 'A';
      // filterType ghi ệ nếu c (u tin filter Loại trực tiếp)
      if (filterType) params.taskType = filterType;
      const res = await monthlyTaskService.getTasks(params);
      setTasks(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTasks(); }, [month, year, filterAssignee, filterDepartment, filterGroup, filterType, filterCompletion]);
  useEffect(() => {
    userService.getUsers().then(r => setUsers(r.data.data)).catch(() => {});
    departmentService.getAll().then(r => setApiDepts(r.data.data || [])).catch(() => {});
    const handleUpdate = () => departmentService.getAll().then(r => setApiDepts(r.data.data || [])).catch(() => {});
    window.addEventListener('departments-updated', handleUpdate);
    return () => window.removeEventListener('departments-updated', handleUpdate);
  }, []);

  const openCreate = () => {
    setEditTask(null);
    setCurrentTask(null);
    setSaveError('');
    setSaveSuccess(false);
    setShowApproveNote(false);
    setApproveNote('');
    setForm({ taskId: '', taskName: '', startDate: '', dueDate: '', extendedDueDate: '',
      assigneeId: '', taskType: 'R', completion: '', progress: 0,
      notes: '', taskGroup: 'THUONG_XUYEN', department: '', stt: tasks.length + 1 });
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditTask(task);
    setCurrentTask(task);
    setSaveError('');
    setSaveSuccess(false);
    setShowApproveNote(false);
    setApproveNote('');
    // cleanDate helper defined below handleSave — use inline here
    const cd = (d) => {
      if (!d) return '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 10);
    };
    setForm({
      taskId: task.taskId, taskName: task.taskName,
      startDate: cd(task.startDate), dueDate: cd(task.dueDate),
      extendedDueDate: cd(task.extendedDueDate),
      assigneeId: task.assigneeId || '', taskType: task.taskType || 'R',
      completion: task.completion || '', progress: task.progress || 0,
      notes: task.notes || '', taskGroup: task.taskGroup || 'THUONG_XUYEN',
      department: task.department || '', stt: task.stt || 0
    });
    setShowModal(true);
  };

  // Helper: chuẩn ha date string về YYYY-MM-DD hoặc null
  const cleanDate = (d) => {
    if (!d) return null;
    // Nếu ệ l YYYY-MM-DD th giữ nguyên
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    // Nếu l ISO string th lấy phần date
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return null;
    return dt.toISOString().slice(0, 10);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess(false);
    try {
      const payload = {
        ...form,
        month,
        year,
        // ảm bảo date fields đúng format YYYY-MM-DD hoặc null
        startDate:       cleanDate(form.startDate),
        dueDate:         cleanDate(form.dueDate),
        extendedDueDate: cleanDate(form.extendedDueDate),
        // assigneeId rộng   null
        assigneeId:      form.assigneeId || null,
        // completion rộng   null
        completion:      form.completion || null,
      };
      if (editTask) await monthlyTaskService.update(editTask.id, payload);
      else await monthlyTaskService.create(payload);
      setSaveSuccess(true);
      setTimeout(() => { setShowModal(false); fetchTasks(); }, 700);
    } catch (err) {
      console.error(err);
      setSaveError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi lưu');
    }
  };

  const handleDelete = async (id) => {
    const ok = await showConfirm({ title:'Xóa công việc', message:'Bạn có chắc muốn xóa công việc tháng này?', confirmLabel:'Xóa' });
    if (!ok) return;
    await monthlyTaskService.delete(id);
    setShowModal(false);
    fetchTasks();
  };

  // Approval handlers
  const handleApprove = async (action) => {
    if (!editTask) return;
    setApproving(true);
    try {
      const res = await api.patch(`/monthly-tasks/${editTask.id}/approve`, { action, note: approveNote });
      const updated = res.data.data;
      setCurrentTask(updated);
      setShowApproveNote(false);
      setApproveNote('');
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch (e) { console.error(e); }
    finally { setApproving(false); }
  };

  const handleRequestReview = async () => {
    if (!editTask) return;
    setApproving(true);
    try {
      const res = await api.patch(`/monthly-tasks/${editTask.id}/request-review`);
      const updated = res.data.data;
      setCurrentTask(updated);
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch (e) { console.error(e); }
    finally { setApproving(false); }
  };

  // Inline update completion/progress
  const handleInlineUpdate = async (id, field, value) => {
    try {
      await monthlyTaskService.update(id, { [field]: value });
      setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    } catch (e) { console.error(e); }
  };

  // —— Drag & Drop ——
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const handleDragStart = (e, taskId) => {
    setDraggedId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e, taskId) => {
    e.preventDefault();
    if (taskId !== draggedId) setDragOverId(taskId);
  };
  const handleDrop = async (e, targetTask) => {
    e.preventDefault();
    setDragOverId(null);
    if (!draggedId || draggedId === targetTask.id) return;
    const dragged = tasks.find(t => t.id === draggedId);
    if (!dragged) return;
    // Ko thả   ệ"i completion của task kéo thành completion của task đích
    const newCompletion = targetTask.completion || null;
    if (dragged.completion === newCompletion) return;
    await handleInlineUpdate(draggedId, 'completion', newCompletion);
    setDraggedId(null);
  };
  const handleDragEnd = () => { setDraggedId(null); setDragOverId(null); };

  // Server ệ lọc — p dụng thêm search client-side
  const kw = searchText.trim().toLowerCase();
  const filtered = kw
    ? tasks.filter(t =>
        t.taskName?.toLowerCase().includes(kw) ||
        t.taskId?.toLowerCase().includes(kw) ||
        t.notes?.toLowerCase().includes(kw) ||
        t.assignee?.name?.toLowerCase().includes(kw)
      )
    : tasks;

  const grouped = {
    THUONG_XUYEN: filtered.filter(t => t.taskGroup === 'THUONG_XUYEN'),
    PHAT_SINH:    filtered.filter(t => t.taskGroup === 'PHAT_SINH')
  };
  // Danh sch b" phận — fetch riêng khng kèm filter ệỒ dropdown luôn đầy đủ
  const [allDepts, setAllDepts] = useState([]);
  useEffect(() => {
    monthlyTaskService.getTasks({ month, year })
      .then(r => setAllDepts([...new Set(r.data.data.map(t => t.department).filter(Boolean))]))
      .catch(() => {});
  }, [month, year]);

  const hasFilter = filterAssignee || filterDepartment || filterCompletion || filterGroup || filterType;

  const s = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const colStyle = { padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 15, color: 'var(--text-primary)', verticalAlign: 'middle' };
  const thStyle  = { padding: '12px 14px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap', backgroundColor: 'var(--bg-surface)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
            Quản lý công việc hằng tháng
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 4 }}>
            Theo dõi tiến độ công việc thuờng xuyên và phát sinh
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Thêm công việc
        </button>
      </div>

      {/* Bộ lọc — tháng/năm nằm trong ệy */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', padding:'10px 14px', backgroundColor:'var(--bg-surface)', borderRadius:12, border:'1.5px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text-muted)', marginRight:4 }}>
          <Filter size={13}/> <span style={{ fontWeight:700 }}>Lọc:</span>
        </div>

        {/* Tháng / Năm */}
        <select className="select" style={{ width:120, fontSize:12, padding:'5px 10px' }}
          value={month} onChange={e => setMonth(parseInt(e.target.value))}>
          {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select className="select" style={{ width:80, fontSize:12, padding:'5px 10px' }}
          value={year} onChange={e => setYear(parseInt(e.target.value))}>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <div style={{ width:1, height:20, backgroundColor:'var(--border)', margin:'0 2px' }}/>

        {/* Bộ phận */}
        <select className="select" style={{ width:150, fontSize:12, padding:'5px 10px' }}
          value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)}>
          <option value="">Tất cả bộ phận</option>
          {allDepts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Người thực hiện */}
        <select className="select" style={{ width:160, fontSize:12, padding:'5px 10px' }}
          value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
          <option value="">Tất cả ngườii thực hiện</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>

        {/* Nhm — lọc theo taskType v taskGroup ệợc sync tự ệ"ng */}
        <select className="select" style={{ width:145, fontSize:12, padding:'5px 10px' }}
          value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
          <option value="">Tất cả nhóm</option>
          <option value="THUONG_XUYEN">Thường xuyên (R)</option>
          <option value="PHAT_SINH">Phát sinh (A)</option>
        </select>

        {/* Loại R/A */}
        <select className="select" style={{ width:130, fontSize:12, padding:'5px 10px' }}
          value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Tất cả loại</option>
          <option value="R">R – Thuờng xuyên</option>
          <option value="A">A – Phát sinh</option>
        </select>

        {/* Hoàn thành */}
        <select className="select" style={{ width:145, fontSize:12, padding:'5px 10px' }}
          value={filterCompletion} onChange={e => setFilterCompletion(e.target.value)}>
          <option value="">Tất cả hoàn thành</option>
          <option value="OT">OT – Đúng hạn</option>
          <option value="OD">OD – Trễ hạn</option>
          <option value="IC">IC – Không HT</option>
        </select>

        {hasFilter && (
          <button onClick={() => { setFilter('monthly', { assigneeId:'', department:'', completion:'', taskGroup:'', taskType:'' }); }}
            style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'1px solid var(--border)', backgroundColor:'var(--bg-hover)', color:'var(--text-muted)', cursor:'pointer' }}>
            ✕ Xóa lọc
          </button>
        )}

        {/* Search */}
        <div style={{ position:'relative', flex:1, minWidth:180, maxWidth:260 }}>
          <Search size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }}/>
          <input
            type="text"
            placeholder="Tìm kiếm công việc..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width:'100%', paddingLeft:28, paddingRight:10, paddingTop:5, paddingBottom:5, fontSize:12, borderRadius:8, border:'1.5px solid var(--border)', backgroundColor:'var(--bg-input)', color:'var(--text-secondary)', outline:'none', boxSizing:'border-box' }}
          />
        </div>

        <span style={{ fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap' }}>
          {filtered.length} CV
        </span>
        <button className="btn btn-primary" onClick={openCreate} style={{ fontSize:12, padding:'5px 14px' }}>
          <Plus size={14}/> Thêm
        </button>
      </div>

      {/* Drop zones — ch0 hi!n khi ệang kéo */}
      {draggedId && (
        <div style={{ display:'flex', gap:10, padding:'8px 0', animation:'fadeIn 0.15s' }}>
          {[
            { key:'OT', label:'S& OT – Đúng hạn',    bg:'#10b98120', border:'#10b981', color:'#10b981' },
            { key:'OD', label:'⏰ OD – Trễ hạn',     bg:'#f59e0b20', border:'#f59e0b', color:'#f59e0b' },
            { key:'IC', label:'R IC – Không HT',     bg:'#ef444420', border:'#ef4444', color:'#ef4444' },
            { key:'',   label:'— Chưa xác định',      bg:'var(--bg-hover)', border:'var(--border)', color:'var(--text-muted)' },
          ].map(zone => (
            <div key={zone.key}
              onDragOver={e => e.preventDefault()}
              onDrop={async e => {
                e.preventDefault();
                if (!draggedId) return;
                await handleInlineUpdate(draggedId, 'completion', zone.key || null);
                setDraggedId(null);
              }}
              style={{ flex:1, padding:'12px 8px', borderRadius:10, border:`2px dashed ${zone.border}`, backgroundColor:zone.bg, color:zone.color, textAlign:'center', fontSize:12, fontWeight:800, cursor:'copy', transition:'transform 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.transform='scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
              {zone.label}
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 14, border: '1.5px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 40 }}>STT</th>
                <th style={{ ...thStyle, width: 130 }}>Task ID</th>
                <th style={{ ...thStyle, minWidth: 220 }}>Tên công việc</th>
                <th style={{ ...thStyle, width: 80 }}>Bắt đầu</th>
                <th style={{ ...thStyle, width: 80 }}>Kết thúc</th>
                <th style={{ ...thStyle, width: 90 }}>Gia hạn</th>
                <th style={{ ...thStyle, width: 120 }}>Người thực hiện</th>
                <th style={{ ...thStyle, width: 60 }}>Loại</th>
                <th style={{ ...thStyle, width: 80 }}>Hoàn thành</th>
                <th style={{ ...thStyle, width: 80 }}>Tiến độ</th>
                <th style={{ ...thStyle, minWidth: 150 }}>Ghi chú</th>
                <th style={{ ...thStyle, width: 110 }}>Duyệt</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={12} style={{ ...colStyle, textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Đang tải...
                </td></tr>
              ) : tasks.length === 0 ? (
                <tr><td colSpan={12} style={{ ...colStyle, textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Chưa có công việc nào {hasFilter ? 'khớp bộ lọc' : `trong tháng ${month}/${year}`}
                </td></tr>
              ) : (
                Object.entries(grouped).map(([group, groupTasks]) => groupTasks.length > 0 && (
                  <React.Fragment key={group}>
                    {/* Group header */}
                    <tr>
                      <td colSpan={12} style={{
                        padding: '10px 16px', fontWeight: 800, fontSize: 13,
                        backgroundColor: group === 'THUONG_XUYEN' ? 'rgba(14,165,233,0.15)' : 'rgba(249,115,22,0.15)',
                        color: group === 'THUONG_XUYEN' ? '#38bdf8' : '#fb923c',
                        borderBottom: '1px solid var(--border)'
                      }}>
                        {GROUP_LABELS[group]}
                      </td>
                    </tr>
                    {groupTasks.map((task, idx) => {
                      const comp = COMPLETION_STYLE[task.completion] || COMPLETION_STYLE.null;
                      const type = TYPE_STYLE[task.taskType] || TYPE_STYLE.R;
                      const isOverdue = task.extendedDueDate;
                      const deadlineBadge = getDeadlineBadge(task);
                      const isDragging = draggedId === task.id;
                      const isDragOver = dragOverId === task.id;
                      return (
                        <tr key={task.id}
                          draggable
                          onDragStart={e => handleDragStart(e, task.id)}
                          onDragOver={e => handleDragOver(e, task.id)}
                          onDrop={e => handleDrop(e, task)}
                          onDragEnd={handleDragEnd}
                          onClick={() => openEdit(task)}
                          style={{
                            transition: 'background 0.15s, opacity 0.15s',
                            cursor: 'grab',
                            opacity: isDragging ? 0.4 : 1,
                            outline: isDragOver ? '2px dashed #0ea5e9' : 'none',
                            outlineOffset: '-2px',
                            backgroundColor: isDragOver ? 'rgba(14,165,233,0.08)' : 'transparent',
                          }}
                          onMouseEnter={e => { if (!isDragging) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                          onMouseLeave={e => { if (!isDragOver) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                          <td style={{ ...colStyle, textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700 }}>
                            {task.stt || idx + 1}
                          </td>
                          <td style={{ ...colStyle, fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#38bdf8' }}>
                            {task.taskId}
                          </td>
                          <td style={{ ...colStyle, fontWeight: 600 }}>
                            <div>{task.taskName}</div>
                            {/* Cảnh bo deadline */}
                            {deadlineBadge && (
                              <div style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:4, fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:5, backgroundColor:deadlineBadge.bg, color:deadlineBadge.color, border:`1px solid ${deadlineBadge.color}40` }}>
                                {deadlineBadge.icon} {deadlineBadge.label}
                              </div>
                            )}
                          </td>
                          <td style={{ ...colStyle, textAlign: 'center', color: 'var(--text-secondary)' }}>
                            {fmtDate(task.startDate)}
                          </td>
                          <td style={{ ...colStyle, textAlign: 'center', color: isOverdue ? '#f59e0b' : 'var(--text-secondary)' }}>
                            {isOverdue ? <s style={{ opacity: 0.5 }}>{fmtDate(task.dueDate)}</s> : fmtDate(task.dueDate)}
                          </td>
                          <td style={{ ...colStyle, textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>
                            {task.extendedDueDate ? fmtDate(task.extendedDueDate) : '—'}
                          </td>
                          <td style={colStyle}>
                            {task.assignee ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: task.assignee.color || '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                                  {task.assignee.name?.charAt(0)}
                                </div>
                                <span style={{ fontSize: 15, fontWeight: 700 }}>{task.assignee.name}</span>
                              </div>
                            ) : '—'}
                          </td>
                          <td style={{ ...colStyle, textAlign: 'center' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 800, backgroundColor: type.bg, color: type.color }}>
                              {task.taskType}
                            </span>
                          </td>
                          {/* Completion - inline select */}
                          <td style={{ ...colStyle, textAlign: 'center' }}>
                            <select
                              value={task.completion || ''}
                              onClick={e => e.stopPropagation()}
                              onChange={e => { e.stopPropagation(); handleInlineUpdate(task.id, 'completion', e.target.value || null); }}
                              style={{ padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 800, backgroundColor: comp.bg, color: comp.color, border: `1px solid ${comp.border}`, cursor: 'pointer', outline: 'none' }}>
                              <option value="">—</option>
                              <option value="OT">OT</option>
                              <option value="OD">OD</option>
                              <option value="IC">IC</option>
                            </select>
                          </td>
                          {/* Progress - inline */}
                          <td style={colStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: 'var(--bg-hover)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 4, backgroundColor: task.progress === 100 ? '#10b981' : '#0ea5e9', width: `${task.progress}%`, transition: 'width 0.3s' }} />
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-secondary)', minWidth: 32 }}>
                                {task.progress}%
                              </span>
                            </div>
                          </td>
                          <td style={{ ...colStyle, fontSize: 12, color: 'var(--text-muted)' }}>
                            {task.notes || '—'}
                          </td>
                          <td style={colStyle}>
                            {/* Approval badge */}
                            {(() => {
                              const ap = APPROVAL_CONFIG[task.approvalStatus] || APPROVAL_CONFIG.pending;
                              const ApIcon = ap.icon;
                              return (
                                <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6, backgroundColor:ap.bg, color:ap.color, whiteSpace:'nowrap' }}>
                                  <ApIcon size={11}/> {ap.label}
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: 620, maxHeight: '92vh', overflowY: 'auto', width: '100%' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, backgroundColor: 'var(--bg-surface)', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {editTask ? 'Chỉnh sửa công việc tháng' : 'Thêm công việc tháng'}
                </h3>
                {editTask && (() => {
                  const ap = APPROVAL_CONFIG[currentTask?.approvalStatus] || APPROVAL_CONFIG.pending;
                  const ApIcon = ap.icon;
                  return (
                    <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:6, backgroundColor:ap.bg, color:ap.color }}>
                      <ApIcon size={12}/> {ap.label}
                    </span>
                  );
                })()}
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Approval banner — chỉ hiện khi đang edit */}
            {editTask && (
              <div style={{ padding: '12px 22px', borderBottom: '1px solid var(--border)', backgroundColor: currentTask?.approvalStatus === 'approved' ? 'rgba(16,185,129,0.06)' : currentTask?.approvalStatus === 'rejected' ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)' }}>
                {currentTask?.approvalStatus === 'approved' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={16} style={{ color: '#10b981' }}/>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>
                      Đã duyệt {currentTask.approvedAt && ` ${new Date(currentTask.approvedAt).toLocaleDateString('vi-VN')}`}
                    </span>
                    {canApprove && (
                      <button onClick={() => handleApprove('reject')} disabled={approving}
                        style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 6, border: '1px solid #ef4444', backgroundColor: 'transparent', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Hủy duyệt
                      </button>
                    )}
                  </div>
                ) : currentTask?.approvalStatus === 'rejected' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <XCircle size={16} style={{ color: '#ef4444' }}/>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>
                       Từ chối {currentTask.approvalNote ? ` ${currentTask.approvalNote}` : ''}
                    </span>
                    {canApprove && (
                      <button onClick={() => handleApprove('approve')} disabled={approving}
                        style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 6, border: 'none', backgroundColor: '#10b981', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Duyệt lại
                      </button>
                    )}
                  </div>
                ) : currentTask?.approvalStatus === 'review' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={16} style={{ color: '#0ea5e9' }}/>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0ea5e9' }}>Đang yêu cầu duyệt</span>
                    {canApprove && (
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        <button onClick={() => setShowApproveNote(v => !v)}
                          style={{ padding: '5px 14px', borderRadius: 7, border: '1px solid var(--border)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          Từ chối
                        </button>
                        <button onClick={() => handleApprove('approve')} disabled={approving}
                          style={{ padding: '5px 14px', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <CheckCircle size={13}/> {approving ? 'Đang duyệt...' : 'Duyệt'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* pending */
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={16} style={{ color: '#f59e0b' }}/>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Công việc chờ phê duyệt</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                      {!canApprove && (
                        <button onClick={handleRequestReview} disabled={approving}
                          style={{ padding: '5px 14px', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <ShieldCheck size={13}/> {approving ? 'Đang gửi...' : 'Yêu cầu duyệt'}
                        </button>
                      )}
                      {canApprove && (
                        <>
                          <button onClick={() => setShowApproveNote(v => !v)}
                            style={{ padding: '5px 14px', borderRadius: 7, border: '1px solid var(--border)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            Từ chối
                          </button>
                          <button onClick={() => handleApprove('approve')} disabled={approving}
                            style={{ padding: '5px 14px', borderRadius: 7, border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <CheckCircle size={13}/> {approving ? 'Đang duyệt...' : 'Duyệt công việc'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {showApproveNote && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                    <input className="input" placeholder="L do Từ chối (ty chọn)..." value={approveNote}
                      onChange={e => setApproveNote(e.target.value)}
                      style={{ flex: 1, fontSize: 13 }}/>
                    <button onClick={() => handleApprove('reject')} disabled={approving}
                      style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      Xác nhận từ chối
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Form body */}
            <form onSubmit={handleSave} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Error / Success */}
              {saveError && (
                <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 13, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <XCircle size={15}/> {saveError}
                </div>
              )}
              {saveSuccess && (
                <div style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', fontSize: 13, color: '#10b981', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={15}/> Đã lưu thành công!
                </div>
              )}

              {/* Task ID */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Task ID *</label>
                <input className="input" placeholder="KN_TT_02_01" value={form.taskId} onChange={e => s('taskId', e.target.value)} required style={{ fontFamily: 'monospace' }} />
              </div>

              {/* Tên công việc */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Tên công việc *</label>
                <input className="input" placeholder="Nhập tên công việc..." value={form.taskName} onChange={e => s('taskName', e.target.value)} required />
              </div>

              {/* Ngày */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <DatePicker label="Ngày bắt đầu" value={form.startDate} onChange={v => s('startDate', v)} maxDate={form.dueDate || undefined}/>
                <DatePicker label="Ngày kết thúc *" value={form.dueDate} onChange={v => s('dueDate', v)} minDate={form.startDate || undefined}/>
                <DatePicker label="Gia hạn" value={form.extendedDueDate} onChange={v => s('extendedDueDate', v)} minDate={form.dueDate || undefined}/>
              </div>

              {/* Người thực hiện + Bộ phận */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Người thực hiện</label>
                  <select className="select" value={form.assigneeId} onChange={e => s('assigneeId', e.target.value)}>
                    <option value="">-- Chọn --</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} {u.department ? `(${u.department})` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Bộ phận</label>
                  <select className="select" value={form.department} onChange={e => s('department', e.target.value)}>
                    <option value="">-- Chọn bộ phận --</option>
                    {apiDepts.length > 0
                      ? apiDepts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)
                      : <>
                          <option value="KN&DMST">KN&DMST</option>
                          <option value="Hành chính tổng hợp">Hành chính tổng hợp</option>
                          <option value="Thông tin thống kê">Thông tin thống kê</option>
                          <option value="Dịch vụ">Dịch vụ</option>
                          <option value="Ban Giám đốc">Ban Giám đốc</option>
                        </>
                    }
                  </select>
                </div>
              </div>

              {/* Loại R/A — tự động set taskGroup */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Loại (R/A)</label>
                  <select className="select" value={form.taskType} onChange={e => {
                    const t = e.target.value;
                    setForm(f => ({ ...f, taskType: t, taskGroup: t === 'A' ? 'PHAT_SINH' : 'THUONG_XUYEN' }));
                  }}>
                    <option value="R">R – Thuờng xuyên</option>
                    <option value="A">A – Phát sinh</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Hoàn thành</label>
                  <select className="select" value={form.completion} onChange={e => s('completion', e.target.value)}>
                    <option value="">— Chưa xác định</option>
                    <option value="OT">OT – Đúng hạn</option>
                    <option value="OD">OD – Trễ hạn</option>
                    <option value="IC">IC – Không HT</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Tiến độ: {form.progress}%</label>
                  <input type="range" min="0" max="100" step="5" value={form.progress}
                    onChange={e => s('progress', parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#0ea5e9', marginTop: 8 }} />
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Ghi chú</label>
                <textarea className="input" rows={2} style={{ resize: 'none' }} value={form.notes} onChange={e => s('notes', e.target.value)} />
              </div>

              {/* File đính kèm — chỉ hiện khi đang edit (có task.id) */}
              {editTask && (
                <MonthlyFileSection taskId={editTask.id} attachments={editTask.attachments || []}/>
              )}

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4, borderTop: '1px solid var(--border)', marginTop: 4 }}>
                {/* Nút xóa chỉ trong modal */}
                {editTask ? (
                  <button type="button"
                    onClick={() => handleDelete(editTask.id)}
                    style={{ padding: '7px 16px', borderRadius: 8, border: 'none', backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Trash2 size={14}/> Xóa
                  </button>
                ) : <div/>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary" disabled={saveSuccess}
                    style={{ background: saveSuccess ? 'linear-gradient(135deg,#10b981,#059669)' : undefined }}>
                    {saveSuccess ? <><CheckCircle size={15}/> Đã lưu!</> : <><Save size={15}/> Lưu</>}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

