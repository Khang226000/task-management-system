import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Plus, ChevronDown, Check } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { userService, taskService } from '../../services/taskService';
import { STATUS_CONFIG, WORK_CATEGORY, LEAD_DEPT, DEPUTY_DIRECTORS, MONTHS, YEARS } from '../../utils/constants';
import api from '../../services/api';

/**
 * Modal thêm công việc nhanh:
 * - Tab 1: Chọn từ danh sách task đã tạo (tìm kiếm, chọn, gán người)
 * - Tab 2: Tạo mới hoàn toàn
 */
export default function QuickAddTaskModal({ onClose }) {
  const { fetchTree, fetchKanban } = useTaskStore();
  const [tab, setTab] = useState('pick'); // 'pick' | 'new'

  // ── Tab Pick: chọn task có sẵn ──
  const [allTasks,  setAllTasks]  = useState([]);
  const [search,    setSearch]    = useState('');
  const [selected,  setSelected]  = useState(null);
  const [users,     setUsers]     = useState([]);
  const [assignee,  setAssignee]  = useState('');
  const [month,     setMonth]     = useState(new Date().getMonth() + 1);
  const [year,      setYear]      = useState(new Date().getFullYear());
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState('');

  useEffect(() => {
    // Load templates để chọn
    api.get('/task-templates').then(r => setAllTasks(r.data.data || [])).catch(() => {});
    userService.getUsers().then(r => setUsers(r.data.data || [])).catch(() => {});
  }, []);

  const filtered = allTasks.filter(t =>
    !search ||
    t.taskCode?.toLowerCase().includes(search.toLowerCase()) ||
    t.taskName?.toLowerCase().includes(search.toLowerCase())
  );

  const handlePickSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      // Cập nhật task: gán người thực hiện + tháng/năm nếu cần
      const updates = {};
      if (assignee) updates.assigneeId = assignee;
      if (Object.keys(updates).length > 0) {
        await api.put(`/tasks/${selected.id}`, updates);
      }
      await fetchTree();
      await fetchKanban();
      setMsg('Đã thêm công việc vào danh sách!');
      setTimeout(onClose, 1000);
    } catch(e) {
      setMsg('Có lỗi xảy ra');
    } finally { setSaving(false); }
  };

  // ── Tab New: tạo task mới ──
  const [form, setForm] = useState({
  taskCode: '',
  parentCode: '',
  workCategory: 'ADM',
  taskName: '',

  // bộ phận cho TASK
  leadDepartment: 'LD-ADM',

  // bộ phận cho MONTHLY TASK
  department: 'Hành chính tổng hợp',

   assigneeId: '', deputyDirector: 'GĐ-Hải',
    deadline: '', taskType: 'R', status: 'not_started', progress: 0,
    deliverable: '', notes: '',
    month: new Date().getMonth() + 1, year: new Date().getFullYear()
  });
  const [newSaving, setNewSaving] = useState(false);
  const [newMsg,    setNewMsg]    = useState('');

  const handleNewSave = async (e) => {
    e.preventDefault();
    if (!form.taskCode || !form.taskName || !form.deadline) {
      setNewMsg('Vui lòng điền đầy đủ: Mã CV, Tên CV, Deadline');
      return;
    }
    setNewSaving(true);
    try {
      await api.post('/tasks', form);
      await fetchTree();
      await fetchKanban();
      setNewMsg('Tạo công việc thành công!');
      setTimeout(onClose, 1000);
    } catch(e) {
      setNewMsg(e.response?.data?.message || 'Có lỗi xảy ra');
    } finally { setNewSaving(false); }
  };

  const cat = selected ? WORK_CATEGORY[selected.workCategory] : null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth:580, maxHeight:'90vh', overflowY:'auto' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
          <h3 style={{ fontSize:17, fontWeight:900, color:'var(--text-primary)', margin:0 }}>Thêm công việc</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}><X size={20}/></button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)' }}>
          {[
            { key:'pick', label:'📋 Chọn từ danh sách' },
            { key:'new',  label:'✏️ Tạo mới' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex:1, padding:'11px', border:'none', fontSize:13, fontWeight:700, cursor:'pointer',
                backgroundColor: tab===t.key ? 'var(--bg-hover)' : 'transparent',
                color: tab===t.key ? '#0ea5e9' : 'var(--text-muted)',
                borderBottom: tab===t.key ? '2px solid #0ea5e9' : '2px solid transparent' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Chọn từ danh sách ── */}
        {tab === 'pick' && (
          <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:14 }}>
            {/* Search */}
            <div style={{ position:'relative' }}>
              <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Tìm theo mã CV hoặc tên..."
                style={{ width:'100%', boxSizing:'border-box', backgroundColor:'var(--bg-input)', border:'1.5px solid var(--border)', borderRadius:9, padding:'9px 12px 9px 32px', fontSize:13, color:'var(--text-primary)', outline:'none' }}/>
            </div>

            {/* Danh sách task */}
            <div style={{ maxHeight:280, overflowY:'auto', display:'flex', flexDirection:'column', gap:5 }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign:'center', padding:30, color:'var(--text-muted)', fontSize:13 }}>Không tìm thấy công việc</div>
              ) : filtered.map(task => {
                const c = WORK_CATEGORY[task.workCategory];
                const isSelected = selected?.id === task.id;
                return (
                  <div key={task.id} onClick={() => setSelected(isSelected ? null : task)}
                    style={{
                      display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                      borderRadius:9, cursor:'pointer',
                      border:`1.5px solid ${isSelected ? '#0ea5e9' : 'var(--border)'}`,
                      backgroundColor: isSelected ? 'rgba(14,165,233,0.08)' : 'var(--bg-hover)',
                      transition:'all 0.15s'
                    }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${isSelected ? '#0ea5e9' : 'var(--border)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {isSelected && <Check size={12} style={{ color:'#0ea5e9' }}/>}
                    </div>
                    <span style={{ fontSize:11, fontFamily:'monospace', fontWeight:800, color:c?.color||'#0ea5e9', backgroundColor:`${c?.color||'#0ea5e9'}15`, padding:'2px 7px', borderRadius:4, flexShrink:0 }}>
                      {task.taskCode}
                    </span>
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {task.taskName}
                    </span>
                    {task.deadline && (
                      <span style={{ fontSize:11, color:'var(--text-muted)', flexShrink:0 }}>
                        {new Date(task.deadline).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Gán người thực hiện nếu chọn task */}
            {selected && (
              <div style={{ padding:'12px 14px', borderRadius:10, backgroundColor:'rgba(14,165,233,0.06)', border:'1px solid rgba(14,165,233,0.2)' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#0ea5e9', marginBottom:8 }}>
                  ✓ Đã chọn: {selected.taskCode} – {selected.taskName}
                </div>
                <label style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>
                  Gán người thực hiện (tùy chọn)
                </label>
                <select className="select" value={assignee} onChange={e => setAssignee(e.target.value)} style={{ fontSize:13 }}>
                  <option value="">— Giữ nguyên ({users.find(u => u.id === selected.assigneeId)?.name || 'Chưa gán'})</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            )}

            {msg && <div style={{ padding:'8px 12px', borderRadius:8, backgroundColor:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', fontSize:13, color:'#10b981' }}>{msg}</div>}

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={onClose} className="btn btn-secondary">Hủy</button>
              <button onClick={handlePickSave} disabled={!selected || saving} className="btn btn-primary"
                style={{ opacity: !selected ? 0.5 : 1 }}>
                {saving ? 'Đang lưu...' : '+ Thêm vào danh sách'}
              </button>
            </div>
          </div>
        )}

        {/* ── Tab: Tạo mới ── */}
        {tab === 'new' && (
          <form onSubmit={handleNewSave} style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:14 }}>
            {newMsg && (
              <div style={{ padding:'8px 12px', borderRadius:8,
                backgroundColor: newMsg.includes('thành công') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${newMsg.includes('thành công') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                fontSize:13, color: newMsg.includes('thành công') ? '#10b981' : '#ef4444' }}>
                {newMsg}
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:5 }}>Mã CV *</label>
                <input className="input" placeholder="ADM-001.01" value={form.taskCode}
                  onChange={e => setForm(f => ({...f, taskCode: e.target.value.toUpperCase()}))} style={{ fontFamily:'monospace', fontSize:13 }}/>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:5 }}>Mã CV cha</label>
                <input className="input" placeholder="ADM-001 (nếu là task con)" value={form.parentCode}
                  onChange={e => setForm(f => ({...f, parentCode: e.target.value.toUpperCase()}))} style={{ fontFamily:'monospace', fontSize:13 }}/>
              </div>
            </div>

            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:5 }}>Tên công việc *</label>
              <input className="input" placeholder="Nhập tên công việc..." value={form.taskName}
                onChange={e => setForm(f => ({...f, taskName: e.target.value}))}/>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:5 }}>Loại CV</label>
                <select className="select" value={form.workCategory} onChange={e => setForm(f => ({...f, workCategory: e.target.value}))}>
                  {Object.entries(WORK_CATEGORY).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:5 }}>Bộ phận</label>
                <select
  className="select"
  value={form.leadDepartment}
  onChange={e => {
  const value = e.target.value;

  setForm(f => ({
    ...f,
    leadDepartment: value,

    // map sang bảng tiến độ tháng
    department:
      value === 'LD-BOD'  ? 'Ban Giám đốc' :
      value === 'LD-SER'  ? 'Dịch vụ' :
      value === 'LD-ADM'  ? 'Hành chính tổng hợp' :
      value === 'LD-INNO' ? 'KN&ĐMST' :
      value === 'LD-INF'  ? 'Thông tin thống kê' :
      '',
  }));
}}
>
                  {Object.entries(LEAD_DEPT).map(([k,v]) => <option key={k} value={k}>{k} – {v.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:5 }}>Người thực hiện</label>
                <select className="select" value={form.assigneeId} onChange={e => setForm(f => ({...f, assigneeId: e.target.value}))}>
                  <option value="">-- Chọn --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:5 }}>Lãnh đạo</label>
                <select className="select" value={form.deputyDirector} onChange={e => setForm(f => ({...f, deputyDirector: e.target.value}))}>
                  {DEPUTY_DIRECTORS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:5 }}>Deadline *</label>
                <input type="date" className="input" value={form.deadline} onChange={e => setForm(f => ({...f, deadline: e.target.value}))}/>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:5 }}>Tháng/Năm</label>
                <div style={{ display:'flex', gap:6 }}>
                  <select className="select" value={form.month} onChange={e => setForm(f => ({...f, month: parseInt(e.target.value)}))}>
                    {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                  <select className="select" style={{ width:80 }} value={form.year} onChange={e => setForm(f => ({...f, year: parseInt(e.target.value)}))}>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:5 }}>Kết quả đầu ra</label>
              <textarea className="input" rows={2} style={{ resize:'none' }} value={form.deliverable}
                onChange={e => setForm(f => ({...f, deliverable: e.target.value}))} placeholder="Mô tả kết quả cần đạt..."/>
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">Hủy</button>
              <button type="submit" disabled={newSaving} className="btn btn-primary">
                {newSaving ? 'Đang tạo...' : <><Plus size={14}/> Tạo công việc</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
