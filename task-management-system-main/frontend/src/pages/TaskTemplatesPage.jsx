import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Save, BookOpen, Search } from 'lucide-react';
import api from '../services/api';
import QuickAddTaskModal from '../components/Tasks/QuickAddTaskModal';
import { showConfirm } from '../utils/confirm';

// ── Modal thêm/sửa template — chỉ cần Mã CV + Tên CV ──
function TemplateModal({ template, onClose, onSaved }) {
  const [taskCode, setTaskCode] = useState(template?.taskCode || '');
  const [taskName, setTaskName] = useState(template?.taskName || '');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!taskCode.trim() || !taskName.trim()) return setError('Vui lòng điền đầy đủ Mã CV và Tên CV');
    setSaving(true);
    try {
      if (template) {
        await api.put(`/task-templates/${template.id}`, { taskCode, taskName });
      } else {
        await api.post('/task-templates', { taskCode, taskName });
      }
      onSaved();
      onClose();
    } catch(err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth:420 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
          <h3 style={{ fontSize:16, fontWeight:800, color:'var(--text-primary)', margin:0 }}>
            {template ? 'Chỉnh sửa' : 'Thêm công việc mẫu'}
          </h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><X size={18}/></button>
        </div>
        <form onSubmit={handleSave} style={{ padding:'18px 20px', display:'flex', flexDirection:'column', gap:14 }}>
          {error && <div style={{ padding:'8px 12px', borderRadius:8, backgroundColor:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', fontSize:13, color:'#ef4444' }}>{error}</div>}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:5 }}>Mã công việc *</label>
            <input className="input" placeholder="VD: ADM-001, CON-001.01..." value={taskCode}
              onChange={e => setTaskCode(e.target.value.toUpperCase())} style={{ fontFamily:'monospace', fontSize:14 }} autoFocus/>
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', display:'block', marginBottom:5 }}>Tên công việc *</label>
            <input className="input" placeholder="Nhập tên công việc..." value={taskName}
              onChange={e => setTaskName(e.target.value)} style={{ fontSize:14 }}/>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:4 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Hủy</button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              <Save size={14}/> {saving ? 'Đang lưu...' : template ? 'Cập nhật' : 'Thêm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════
export default function TaskTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [search,    setSearch]    = useState('');
  const [showModal,    setShowModal]    = useState(false);
  const [editItem,     setEditItem]     = useState(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/task-templates');
      setTemplates(res.data.data || []);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleDelete = async (id, name) => {
    const ok = await showConfirm({ title: 'Xóa công việc mẫu', message: `Xóa mẫu "${name}"?`, confirmLabel: 'Xóa' });
    if (!ok) return;
    await api.delete(`/task-templates/${id}`);
    fetchTemplates();
  };

  const filtered = templates.filter(t =>
    !search ||
    t.taskCode?.toLowerCase().includes(search.toLowerCase()) ||
    t.taskName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <BookOpen size={22} style={{ color:'#0ea5e9' }}/>
          <div>
            <h2 style={{ fontSize:20, fontWeight:900, color:'var(--text-primary)', margin:0 }}>Danh sách công việc</h2>
            <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>
              Quản lý các công việc mẫu — dùng để tạo task nhanh
            </p>
          </div>
          <span style={{ fontSize:12, padding:'2px 10px', borderRadius:10, backgroundColor:'#0ea5e920', color:'#0ea5e9', fontWeight:700 }}>
            {templates.length}
          </span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setShowQuickAdd(true)} className="btn btn-secondary">
            <Plus size={15}/> Tạo công việc từ mẫu
          </button>
          <button onClick={() => { setEditItem(null); setShowModal(true); }} className="btn btn-primary">
            <Plus size={15}/> Thêm công việc mẫu
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position:'relative', maxWidth:400 }}>
        <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo mã CV hoặc tên..."
          style={{ width:'100%', boxSizing:'border-box', backgroundColor:'var(--bg-input)', border:'1.5px solid var(--border)', borderRadius:10, padding:'9px 12px 9px 34px', fontSize:13, color:'var(--text-primary)', outline:'none' }}/>
      </div>

      {/* Table — chỉ Mã CV + Tên CV */}
      <div style={{ backgroundColor:'var(--bg-surface)', border:'1.5px solid var(--border)', borderRadius:14, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ backgroundColor:'var(--bg-hover)' }}>
                {['STT','Mã công việc','Tên công việc','Thao tác'].map((h,i) => (
                  <th key={i} style={{ padding:'11px 16px', fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)', borderBottom:'2px solid var(--border)', textAlign:'left', whiteSpace:'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length:5}).map((_,i) => (
                  <tr key={i}>
                    {[1,2,3,4].map(j => (
                      <td key={j} style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
                        <div style={{ height:14, borderRadius:4, backgroundColor:'var(--bg-hover)', animation:'pulse 1.5s infinite' }}/>
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding:'48px 16px', textAlign:'center', color:'var(--text-muted)', fontSize:14 }}>
                    <BookOpen size={36} style={{ margin:'0 auto 10px', opacity:0.3 }}/>
                    <p>{search ? 'Không tìm thấy kết quả' : 'Chưa có công việc mẫu nào'}</p>
                    {!search && <p style={{ fontSize:12, marginTop:4 }}>Bấm "+ Thêm công việc mẫu" để bắt đầu</p>}
                  </td>
                </tr>
              ) : filtered.map((t, i) => (
                <tr key={t.id}
                  style={{ borderBottom:'1px solid var(--border)', transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor='var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}>

                  <td style={{ padding:'12px 16px', color:'var(--text-muted)', fontSize:13, fontWeight:600 }}>
                    {i + 1}
                  </td>

                  <td style={{ padding:'12px 16px', whiteSpace:'nowrap' }}>
                    <span style={{ fontSize:13, fontFamily:'monospace', fontWeight:800, color:'#0ea5e9', backgroundColor:'#0ea5e915', padding:'3px 10px', borderRadius:5 }}>
                      {t.taskCode}
                    </span>
                  </td>

                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{t.taskName}</span>
                  </td>

                  <td style={{ padding:'12px 16px', whiteSpace:'nowrap' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => { setEditItem(t); setShowModal(true); }}
                        style={{ padding:'5px 10px', borderRadius:6, border:'none', backgroundColor:'rgba(99,102,241,0.12)', color:'#818cf8', cursor:'pointer', display:'flex', alignItems:'center' }}>
                        <Edit2 size={13}/>
                      </button>
                      <button onClick={() => handleDelete(t.id, t.taskName)}
                        style={{ padding:'5px 10px', borderRadius:6, border:'none', backgroundColor:'rgba(239,68,68,0.1)', color:'#f87171', cursor:'pointer', display:'flex', alignItems:'center' }}>
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <TemplateModal
          template={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSaved={fetchTemplates}
        />
      )}
      {showQuickAdd && <QuickAddTaskModal onClose={() => setShowQuickAdd(false)}/>}
    </div>
  );
}
