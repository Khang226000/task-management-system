import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Filter, ChevronDown, AlertTriangle, Flag, Clock, CheckCircle, X, Save, Paperclip, Upload } from 'lucide-react';
import { monthlyTaskService, userService } from '../services/taskService';
import { MONTHS, YEARS } from '../utils/constants';
import { format } from 'date-fns';
import { useFilterStore } from '../store/filterStore';
import FileAttachmentList from '../components/Tasks/FilePreview';
import api from '../services/api';
import { showConfirm } from '../utils/confirm';

// ������ Column definitions ��������������������������������������������������������������������������������������������������������������
const COLUMNS = [
  { key: 'not_started', label: 'Chưa bắt đầu',   headerBg: '#475569', borderColor: '#475569' },
  { key: 'in_progress', label: 'Đang thực hiện',  headerBg: '#d97706', borderColor: '#d97706' },
  { key: 'done',        label: 'Hoàn thành',       headerBg: '#059669', borderColor: '#059669' },
  { key: 'delayed',     label: 'Trễ hạn / Không HT',   headerBg: '#dc2626', borderColor: '#dc2626' },
];

const DEPT_OPTIONS = [
  'KN&DMST',
  'Hành chính',
  'Truyền thông',
  'Thông tin thống kê',
  'Dịch vụ',
  'Ban Giám đốc',
];

// ������ Helpers ������������������������������������������������������������������������������������������������������������������������������������
const fmtDate = (d) => {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : format(dt, 'dd/MM/yyyy');
};

/** Classify a task into a kanban column key */
function getColumnKey(task) {
  const { completion, progress } = task;
  if (completion === 'OD' || completion === 'IC') return 'delayed';
  if (completion === 'OT' || progress === 100) return 'done';
  if (progress > 0 && progress < 100) return 'in_progress';
  return 'not_started';
}

/** Deadline badge color/label logic */
function deadlineBadge(task) {
  const col = getColumnKey(task);
  if (col === 'done') {
    return {
      bg: '#05966920',
      color: '#059669',
      border: '#05966940',
      label: fmtDate(task.extendedDueDate || task.dueDate) || '�',
    };
  }
  const effectiveDue = task.extendedDueDate || task.dueDate;
  if (!effectiveDue) {
    return { bg: 'transparent', color: 'var(--text-muted)', border: 'transparent', label: '�' };
  }
  const due = new Date(effectiveDue);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due - today) / 86400000);

  if (diffDays < 0)   return { bg: '#dc262620', color: '#dc2626', border: '#dc262640', label: fmtDate(effectiveDue) };
  if (diffDays === 0) return { bg: '#ef444420', color: '#ef4444', border: '#ef444440', label: 'Hôm nay' };
  if (diffDays <= 3)  return { bg: '#f9731620', color: '#f97316', border: '#f9731640', label: fmtDate(effectiveDue) };
  return { bg: '#05966920', color: '#059669', border: '#05966940', label: fmtDate(effectiveDue) };
}

// ������ KanbanCard ������������������������������������������������������������������������������������������������������������������������������
function KanbanCard({ task, col, onClick }) {
  const badge = deadlineBadge(task);
  const progress = task.progress ?? 0;
  const progressColor =
    col.key === 'done'        ? '#059669' :
    col.key === 'delayed'     ? '#dc2626' :
    col.key === 'in_progress' ? '#d97706' : '#64748b';

  const DeadlineIcon =
    badge.color === '#dc2626' ? AlertTriangle :
    badge.color === '#059669' ? CheckCircle : Flag;

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 10,
        border: `1.5px solid ${col.borderColor}35`,
        backgroundColor: 'var(--bg-card)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 6px 20px ${col.borderColor}25`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Colored header strip */}
      <div style={{
        backgroundColor: col.headerBg,
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6,
      }}>
        <span style={{
          fontFamily: 'monospace',
          fontSize: 13,
          fontWeight: 900,
          color: '#fff',
          opacity: 1,
          }}>
  {task.taskId || '—'}
</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {task.taskType && (
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#fff',
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '1px 6px',
              borderRadius: 4,
            }}>
              {task.taskType}
            </span>
          )}
          {task.completion && (
            <span style={{
              fontSize: 12,
              fontWeight: 800,
              color: '#fff',
              backgroundColor: 'rgba(0,0,0,0.25)',
              padding: '1px 6px',
              borderRadius: 4,
            }}>
              {task.completion}
            </span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Task name � 2 lines max */}
        <div style={{
          fontSize: 16,
          fontWeight: 800,
          color: 'var(--text-primary)',
          lineHeight: 1.45,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {task.taskName}
        </div>

        {/* Assignee � avatar + name on one row */}
        {task.assignee && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              flexShrink: 0,
              backgroundColor: task.assignee.color || '#0ea5e9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 800,
              color: '#fff',
            }}>
              {task.assignee.name?.charAt(0)}
            </div>
            <span style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {task.assignee.name}
            </span>
          </div>
        )}

        {/* Progress bar + percentage � one row, no label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            flex: 1,
            height: 5,
            borderRadius: 3,
            backgroundColor: 'var(--bg-hover)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              borderRadius: 3,
              backgroundColor: progressColor,
              width: `${progress}%`,
              transition: 'width 0.3s',
            }} />
          </div>
          <span style={{
            fontSize: 14,
            fontWeight: 800,
            color: progressColor,
            minWidth: 32,
            textAlign: 'right',
          }}>
            {progress}%
          </span>
        </div>

        {/* Deadline badge � one row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 14,
          fontWeight: 700,
          padding: '3px 8px',
          borderRadius: 5,
          width: 'fit-content',
          backgroundColor: badge.bg,
          color: badge.color,
          border: `1px solid ${badge.border}`,
        }}>
          <DeadlineIcon size={11} />
          <span>{badge.label}</span>
        </div>
      </div>
    </div>
  );
}

// ������ EditModal ��������������������������������������������������������������������������������������������������������������������������������
function EditModal({ task, users, month, year, onClose, onSaved }) {
  const [form, setForm] = useState({
    taskId:          task.taskId          || '',
    taskName:        task.taskName        || '',
    startDate:       task.startDate       ? task.startDate.slice(0, 10) : '',
    dueDate:         task.dueDate         ? task.dueDate.slice(0, 10)   : '',
    extendedDueDate: task.extendedDueDate ? task.extendedDueDate.slice(0, 10) : '',
    assigneeId:      task.assigneeId      || task.assignee?.id || '',
    taskType:        task.taskType        || 'R',
    completion:      task.completion      || '',
    progress:        task.progress        ?? 0,
    notes:           task.notes           || '',
    taskGroup:       task.taskGroup       || 'THUONG_XUYEN',
    department:      task.department      || '',
  });
  const [attachments, setAttachments] = useState(task.attachments || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const s = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        month, year,
        startDate:       form.startDate       || null,
        dueDate:         form.dueDate         || null,
        extendedDueDate: form.extendedDueDate || null,
        assigneeId:      form.assigneeId      || null,
        completion:      form.completion      || null,
      };
      await monthlyTaskService.update(task.id, payload);
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await api.post(`/upload/monthly/${task.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setAttachments(prev => [...prev, res.data.data]);
      }
    } catch (err) { console.error(err); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleDeleteFile = async (filename) => {
    const ok = await showConfirm({ title: 'Xóa file', message: 'Xóa file này?', confirmLabel: 'Xóa' });
    if (!ok) return;
    try {
      await api.delete(`/upload/monthly/${task.id}/${filename}`);
      setAttachments(prev => prev.filter(f => f.filename !== filename));
    } catch (err) { console.error(err); }
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--text-secondary)',
    display: 'block',
    marginBottom: 5,
  };

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-content"
        style={{ maxWidth: 620, maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Modal header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Chỉnh sửa công việc
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Row: taskId + taskGroup */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Task ID</label>
              <input
                className="input"
                value={form.taskId}
                onChange={e => s('taskId', e.target.value)}
                placeholder="KN_TT_02_01"
                style={{ fontFamily: 'monospace' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Nhóm nhiệm vụ</label>
              <select className="select" value={form.taskGroup} onChange={e => s('taskGroup', e.target.value)}>
                <option value="THUONG_XUYEN">Thường xuyên</option>
                <option value="PHAT_SINH">Phát sinh</option>
              </select>
            </div>
          </div>

          {/* Task name */}
          <div>
            <label style={labelStyle}>Tên công việc *</label>
            <input
              className="input"
              required
              value={form.taskName}
              onChange={e => s('taskName', e.target.value)}
              placeholder="Nhập tên công việc..."
            />
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Ngày bắt đầu</label>
              <input
                type="date"
                className="input"
                value={form.startDate}
                onChange={e => s('startDate', e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Ngày kết thúc *</label>
              <input
                type="date"
                className="input"
                required
                value={form.dueDate}
                onChange={e => s('dueDate', e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Gia hạn</label>
              <input
                type="date"
                className="input"
                value={form.extendedDueDate}
                onChange={e => s('extendedDueDate', e.target.value)}
              />
            </div>
          </div>

          {/* Assignee + Department */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Người thực hiệnn</label>
              <select
                className="select"
                value={form.assigneeId}
                onChange={e => s('assigneeId', e.target.value)}
              >
                <option value="">-- Chọn --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name}{u.department ? ` (${u.department})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Bộ phận</label>
              <select
                className="select"
                value={form.department}
                onChange={e => s('department', e.target.value)}
              >
                <option value="">-- Chọn bộ phận --</option>
                {DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Type + Completion + Progress */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Loại (R/A)</label>
              <select className="select" value={form.taskType} onChange={e => s('taskType', e.target.value)}>
                <option value="R">R - Thường xuyên</option>
                <option value="A">A - Phát sinh</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Hoàn thành</label>
              <select className="select" value={form.completion} onChange={e => s('completion', e.target.value)}>
                <option value="">Chưa xác định</option>
                <option value="OT">OT - đúng hạn</option>
                <option value="OD">OD - Trễ hạn</option>
                <option value="IC">IC - Không HT</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tiến độ": {form.progress}%</label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={form.progress}
                onChange={e => s('progress', parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#0ea5e9', marginTop: 8 }}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Ghi chú</label>
            <textarea
              className="input"
              rows={2}
              style={{ resize: 'none' }}
              value={form.notes}
              onChange={e => s('notes', e.target.value)}
            />
          </div>

          {/* File ��nh k�m */}
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
                  ? <><span style={{ width: 12, height: 12, border: '2px solid rgba(14,165,233,0.3)', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/> ang tải...</>
                  : <><Upload size={12}/> đính kèm file</>
                }
                <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  onChange={handleUpload} disabled={uploading} style={{ display: 'none' }}/>
              </label>
            </div>
            <FileAttachmentList attachments={attachments} onDelete={handleDeleteFile}/>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Save size={15} />
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ������ Main Page ��������������������������������������������������������������������������������������������������������������������������������
export default function MonthlyKanbanPage() {
  const [tasks,   setTasks]   = useState([]);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);

  // Month/year
  const { monthly, setFilter } = useFilterStore();
  const month = monthly.month;
  const year  = monthly.year;
  const setMonth = (v) => setFilter('monthly', { month: v });
  const setYear  = (v) => setFilter('monthly', { year: v });

  // Filters
  const filterDepartment = monthly.department;
  const filterAssignee   = monthly.assigneeId;
  const filterGroup      = monthly.taskGroup;
  const filterType       = monthly.taskType;
  const filterCompletion = monthly.completion;

  const setFilterDepartment = (v) => setFilter('monthly', { department: v });
  const setFilterAssignee   = (v) => setFilter('monthly', { assigneeId: v });
  const setFilterGroup      = (v) => setFilter('monthly', { taskGroup: v });
  const setFilterType       = (v) => setFilter('monthly', { taskType: v });
  const setFilterCompletion = (v) => setFilter('monthly', { completion: v });

  // Edit modal
  const [editTask, setEditTask] = useState(null);

  // ���� Fetch tasks ����
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = { month, year };
      if (filterDepartment) params.department = filterDepartment;
      if (filterAssignee)   params.assigneeId = filterAssignee;
      if (filterGroup)      params.taskGroup  = filterGroup;
      if (filterType)       params.taskType   = filterType;
      if (filterCompletion) params.completion = filterCompletion;
      const res = await monthlyTaskService.getTasks(params);
      setTasks(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [month, year, filterDepartment, filterAssignee, filterGroup, filterType, filterCompletion]);

  useEffect(() => {
    userService.getUsers()
      .then(r => setUsers(r.data.data || []))
      .catch(() => {});
  }, []);

  // ���� Group tasks into columns ����
  const board = useMemo(() => {
    const cols = { not_started: [], in_progress: [], done: [], delayed: [] };
    tasks.forEach(t => {
      const key = getColumnKey(t);
      cols[key].push(t);
    });
    return cols;
  }, [tasks]);

  const hasFilter = filterDepartment || filterAssignee || filterGroup || filterType || filterCompletion;

  const clearFilters = () => {
    setFilter('monthly', { department: '', assigneeId: '', taskGroup: '', taskType: '', completion: '' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%', minHeight: 0 }}>

      {/* ���� Filter bar ���� */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        padding: '10px 14px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 12,
        border: '1.5px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 15, color: 'var(--text-muted)', marginRight: 4 }}>
          <Filter size={13} />
          <span style={{ fontWeight: 700 }}>Lọc:</span>
        </div>

        {/* Month */}
        <select
          className="select"
          style={{ width: 120, fontSize: 14, padding: '8px 12px', height: 40, }}
          value={month}
          onChange={e => setMonth(parseInt(e.target.value))}
        >
          {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>

        {/* Year */}
        <select
          className="select"
          style={{ width: 80, fontSize: 14, padding: '8px 12px', height: 40 }}
          value={year}
          onChange={e => setYear(parseInt(e.target.value))}
        >
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <div style={{ width: 1, height: 20, backgroundColor: 'var(--border)', margin: '0 2px' }} />

        {/* Department */}
        <select
          className="select"
          style={{ width: 150, fontSize: 14, padding: '8px 12px', height: 40 }}
          value={filterDepartment}
          onChange={e => setFilterDepartment(e.target.value)}
        >
          <option value="">Tất cả bộ phận</option>
          {DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Assignee */}
        <select
          className="select"
          style={{ width: 160, fontSize: 14, padding: '8px 12px', height: 40 }}
          value={filterAssignee}
          onChange={e => setFilterAssignee(e.target.value)}
        >
          <option value="">Tất cả người thực hiện</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>

        {/* Group */}
        <select
          className="select"
          style={{ width: 145, fontSize: 14, padding: '8px 12px', height: 40 }}
          value={filterGroup}
          onChange={e => setFilterGroup(e.target.value)}
        >
          <option value="">Tất cả nhóm</option>
          <option value="THUONG_XUYEN">Thường xuyên</option>
          <option value="PHAT_SINH">Phát sinh</option>
        </select>

        {/* Type */}
        <select
          className="select"
          style={{ width: 130, fontSize: 14, padding: '8px 12px', height: 40 }}
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="">Tất cả loại</option>
          <option value="R">R - Thường xuyên</option>
          <option value="A">A - Phát sinh</option>
        </select>

        {/* Completion */}
        <select
          className="select"
          style={{ width: 145, fontSize: 14, padding: '8px 12px', height: 40 }}
          value={filterCompletion}
          onChange={e => setFilterCompletion(e.target.value)}
        >
          <option value="">Tất cả hoàn nh</option>
          <option value="OT">OT - đúng hạn</option>
          <option value="OD">OD - Trễ hạn</option>
          <option value="IC">IC - Không HT</option>
        </select>

        {hasFilter && (
          <button
            onClick={clearFilters}
            style={{
              fontSize: 11,
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-hover)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
             Xóa lọc
          </button>
        )}

        <span style={{ marginLeft: 'auto', fontSize: 14,  fontWeight: 600, color: 'var(--text-muted)' }}>
          {tasks.length} công việc
        </span>
      </div>

      {/* ���� Kanban board ���� */}
      <div style={{
        display: 'flex',
        gap: 14,
        flex: 1,
        minHeight: 0,
        overflowX: 'auto',
        paddingBottom: 8,
      }}>
        {COLUMNS.map(col => {
          const colTasks = board[col.key] || [];
          return (
            <div
              key={col.key}
              style={{
                flex: '1 1 0',
                minWidth: 320,
                maxWidth: 450,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 12,
                border: `1.5px solid ${col.borderColor}40`,
                overflow: 'hidden',
                minHeight: 0,
              }}
            >
              {/* Column header � fixed, does not scroll */}
              <div style={{
                backgroundColor: col.headerBg,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
                  {col.label}
                </span>
                <span style={{
                  fontSize: 14,
                  fontWeight: 800,
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  color: '#fff',
                  padding: '1px 9px',
                  borderRadius: 20,
                }}>
                  {colTasks.length}
                </span>
              </div>

              {/* Cards area � scrollable */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}>
                {loading && colTasks.length === 0 ? (
                  [1, 2, 3].map(i => (
                    <div key={i} style={{
                      height: 110,
                      borderRadius: 10,
                      backgroundColor: 'var(--bg-hover)',
                      animation: 'pulse 1.5s infinite',
                      flexShrink: 0,
                    }} />
                  ))
                ) : colTasks.length === 0 ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '32px 0',
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    opacity: 0.6,
                  }}>
                    <Plus size={18} style={{ marginBottom: 4, opacity: 0.4 }} />
                    Chưa có công việc
                  </div>
                ) : (
                  colTasks.map(task => (
                    <KanbanCard
                      key={task.id}
                      task={task}
                      col={col}
                      onClick={() => setEditTask(task)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ���� Edit Modal ���� */}
      {editTask && (
        <EditModal
          task={editTask}
          users={users}
          month={month}
          year={year}
          onClose={() => setEditTask(null)}
          onSaved={() => { setEditTask(null); fetchTasks(); }}
        />
      )}
    </div>
  );
}

