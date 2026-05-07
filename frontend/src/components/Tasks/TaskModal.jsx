import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { userService, departmentService } from '../../services/taskService';
import UserPicker from './UserPicker';
import DatePicker from '../DatePicker';
import {
  WORK_CATEGORY, LEAD_DEPT, STATUS_CONFIG,
  COMPLETION_CONFIG, TASK_TYPE, DEPUTY_DIRECTORS, MONTHS, YEARS
} from '../../utils/constants';

const now = new Date();

// Đảm bảo date đúng format YYYY-MM-DD cho SQL Server
const toSQLDate = (v) => {
  if (!v || v === '') return null;
  // Nếu đã là YYYY-MM-DD thì giữ nguyên
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  return null;
};

const defaultForm = {
  taskCode: '', parentCode: '',
  workCategory: 'ADM', taskName: '',
  leadDepartment: 'LD-ADM', assigneeId: '',
  collaborators: [], deputyDirector: 'GĐ-Hải',
  startDate: '', deadline: '', extendedDeadline: '', extensionReason: '',
  deliverable: '', progress: 0,
  taskType: 'R', status: 'not_started', completion: '',
  notes: '',
  month: now.getMonth() + 1, year: now.getFullYear()
};

export default function TaskModal({ task, onClose }) {
  const { createTask, updateTask } = useTaskStore();
  const [form, setForm] = useState(task ? {
    taskCode:         task.taskCode,
    parentCode:       task.parentCode || '',
    workCategory:     task.workCategory,
    taskName:         task.taskName,
    leadDepartment:   task.leadDepartment,
    assigneeId:       task.assigneeId || '',
    collaborators:    Array.isArray(task.collaborators) ? task.collaborators : [],
    deputyDirector:   task.deputyDirector || 'GĐ-Hải',
    startDate:        task.startDate || '',
    deadline:         task.deadline || '',
    extendedDeadline: task.extendedDeadline || '',
    extensionReason:  task.extensionReason || '',
    deliverable:      task.deliverable || '',
    progress:         task.progress || 0,
    taskType:         task.taskType || 'R',
    status:           task.status,
    completion:       task.completion || '',
    notes:            task.notes || '',
    month:            task.month,
    year:             task.year
  } : defaultForm);

  const [users,       setUsers]       = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    userService.getUsers().then(r => setUsers(r.data.data || [])).catch(() => {});
    departmentService.getAll().then(r => setDepartments(r.data.data || [])).catch(() => {});

    // Lắng nghe khi có bộ phận mới
    const handleUpdate = () => {
      departmentService.getAll().then(r => setDepartments(r.data.data || [])).catch(() => {});
    };
    window.addEventListener('departments-updated', handleUpdate);
    return () => window.removeEventListener('departments-updated', handleUpdate);
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.taskCode.trim()) return setError('Mã công việc không được để trống');
    if (!form.taskName.trim()) return setError('Tên công việc không được để trống');
    if (!form.deadline)        return setError('Deadline không được để trống');

    setLoading(true); setError('');
    try {
      // Chuẩn hóa collaborators: luôn là array of IDs
      const normalizeCollaborators = (collab) => {
        if (!Array.isArray(collab)) return [];
        return collab.map(c => (typeof c === 'object' && c !== null) ? c.id : c).filter(Boolean);
      };

      const payload = {
        ...form,
        startDate:        toSQLDate(form.startDate),
        deadline:         toSQLDate(form.deadline),
        extendedDeadline: toSQLDate(form.extendedDeadline) || null,
        collaborators:    normalizeCollaborators(form.collaborators),
        assigneeId:       form.assigneeId || null,
        completion:       form.completion || null,
      };

      // Tự động set tháng/năm theo deadline
      if (payload.deadline) {
        const dl = new Date(payload.deadline);
        if (!isNaN(dl.getTime())) {
          payload.month = dl.getMonth() + 1;
          payload.year  = dl.getFullYear();
        }
      }

      if (task) await updateTask(task.id, payload);
      else      await createTask(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra');
    } finally { setLoading(false); }
  };

  const Label = ({ children, required }) => (
    <label style={{ display:'block', fontSize:12, fontWeight:700, color:'var(--text-secondary)', marginBottom:5 }}>
      {children}{required && <span style={{ color:'#ef4444', marginLeft:2 }}>*</span>}
    </label>
  );

  const inputStyle = { width:'100%', boxSizing:'border-box' };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth:680, maxHeight:'92vh', overflowY:'auto' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid var(--border)', position:'sticky', top:0, backgroundColor:'var(--bg-surface)', zIndex:10 }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:800, color:'var(--text-primary)', margin:0 }}>
              {task ? 'Chỉnh sửa công việc' : 'Tạo công việc mới'}
            </h2>
            <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>Điền đầy đủ thông tin công việc</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}>
            <X size={18}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:'18px 20px', display:'flex', flexDirection:'column', gap:14 }}>
          {error && (
            <div style={{ padding:'10px 14px', borderRadius:8, backgroundColor:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', fontSize:13, color:'#ef4444' }}>
              {error}
            </div>
          )}

          {/* Mã CV + Mã cha */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <Label required>Mã công việc</Label>
              <input className="input" style={inputStyle} placeholder="ADM-01.01"
                value={form.taskCode} onChange={e => set('taskCode', e.target.value.toUpperCase())}/>
              <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>VD: ADM-01, ADM-01.01</p>
            </div>
            <div>
              <Label>Mã công việc cha</Label>
              <input className="input" style={inputStyle} placeholder="ADM-01 (để trống nếu là task gốc)"
                value={form.parentCode} onChange={e => set('parentCode', e.target.value.toUpperCase())}/>
            </div>
          </div>

          {/* Loại CV + Tính chất */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <Label required>Mã loại công việc</Label>
              <select className="select" style={inputStyle} value={form.workCategory} onChange={e => set('workCategory', e.target.value)}>
                {Object.entries(WORK_CATEGORY).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Tính chất công việc</Label>
              <select className="select" style={inputStyle} value={form.taskType} onChange={e => set('taskType', e.target.value)}>
                {Object.entries(TASK_TYPE).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {/* Tên CV */}
          <div>
            <Label required>Tên công việc</Label>
            <input className="input" style={inputStyle} placeholder="Nhập tên công việc..."
              value={form.taskName} onChange={e => set('taskName', e.target.value)}/>
          </div>

          {/* Bộ phận + Lãnh đạo */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <Label required>Bộ phận phụ trách</Label>
              <select className="select" style={inputStyle} value={form.leadDepartment} onChange={e => set('leadDepartment', e.target.value)}>
                {/* Merge LEAD_DEPT cố định + departments từ API */}
                {(() => {
                  // Build merged map: key -> label
                  const merged = { ...LEAD_DEPT };
                  departments.forEach(d => {
                    const key = `LD-${d.code}`;
                    if (!merged[key]) {
                      merged[key] = { label: d.name, short: key, color: d.color || '#6366f1' };
                    }
                  });
                  return Object.entries(merged).map(([k, v]) => (
                    <option key={k} value={k}>{k} – {v.label}</option>
                  ));
                })()}
              </select>
            </div>
            <div>
              <Label>Lãnh đạo phụ trách</Label>
              <select className="select" style={inputStyle} value={form.deputyDirector} onChange={e => set('deputyDirector', e.target.value)}>
                {DEPUTY_DIRECTORS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>

          {/* Người thực hiện + Người phối hợp */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <Label>Người thực hiện chính</Label>
              <UserPicker
                users={users}
                value={form.assigneeId}
                onChange={v => set('assigneeId', v)}
                placeholder="-- Chọn người thực hiện --"
              />
            </div>
            <div>
              <Label>Người phối hợp</Label>
              <UserPicker
                users={users}
                value={form.collaborators}
                onChange={v => set('collaborators', v)}
                multi
                placeholder="-- Chọn người phối hợp --"
              />
            </div>
          </div>

          {/* Ngày tháng — 3 cột rõ ràng */}
          <div>
            <Label>Thời gian thực hiện</Label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
              <DatePicker
                label="📅 Ngày bắt đầu"
                value={form.startDate}
                onChange={v => set('startDate', v)}
                maxDate={form.deadline || undefined}
              />
              <DatePicker
                label="⏰ Deadline *"
                value={form.deadline}
                onChange={v => set('deadline', v)}
                minDate={form.startDate || undefined}
              />
              <DatePicker
                label="🔄 Gia hạn deadline"
                value={form.extendedDeadline}
                onChange={v => set('extendedDeadline', v)}
                minDate={form.deadline || undefined}
              />
            </div>
            {form.extendedDeadline && (
              <div style={{ marginTop:8 }}>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', display:'block', marginBottom:4 }}>Lý do gia hạn</label>
                <input className="input" style={inputStyle} placeholder="Lý do khách quan..."
                  value={form.extensionReason} onChange={e => set('extensionReason', e.target.value)}/>
              </div>
            )}
          </div>

          {/* Trạng thái + Hoàn thành + Tiến độ */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div>
              <Label>Trạng thái</Label>
              <select className="select" style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
                {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Mức độ hoàn thành</Label>
              <select className="select" style={inputStyle} value={form.completion} onChange={e => set('completion', e.target.value)}>
                <option value="">-- Chưa xác định --</option>
                {Object.entries(COMPLETION_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <Label>Tiến độ: {form.progress}%</Label>
              <input type="range" min="0" max="100" step="5"
                value={form.progress} onChange={e => set('progress', parseInt(e.target.value))}
                className="no-transition" style={{ width:'100%', marginTop:8, accentColor:'#0ea5e9' }}/>
              <div style={{ width:'100%', height:6, borderRadius:3, backgroundColor:'var(--bg-hover)', overflow:'hidden', marginTop:4 }}>
                <div style={{ height:'100%', borderRadius:3, backgroundColor:'#0ea5e9', width:`${form.progress}%` }}/>
              </div>
            </div>
          </div>

          {/* Deliverable */}
          <div>
            <Label>Kết quả đầu ra (Deliverable)</Label>
            <textarea className="input resize-none" rows={2} style={inputStyle}
              placeholder="Mô tả kết quả cần đạt được..."
              value={form.deliverable} onChange={e => set('deliverable', e.target.value)}/>
          </div>

          {/* Ghi chú */}
          <div>
            <Label>Ghi chú</Label>
            <textarea className="input resize-none" rows={2} style={inputStyle}
              placeholder="Ghi chú thêm..."
              value={form.notes} onChange={e => set('notes', e.target.value)}/>
          </div>

          {/* Tháng/Năm */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <Label>Tháng</Label>
              <select className="select" style={inputStyle} value={form.month} onChange={e => set('month', parseInt(e.target.value))}>
                {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <Label>Năm</Label>
              <select className="select" style={inputStyle} value={form.year} onChange={e => set('year', parseInt(e.target.value))}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10, paddingTop:8, borderTop:'1px solid var(--border)' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Hủy</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Đang lưu...' : task ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
