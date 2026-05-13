import React, { useEffect, useState, useCallback } from 'react';
import { History, Search, Filter, RefreshCw, X, ExternalLink, Calendar } from 'lucide-react';
import api from '../services/api';
import { userService } from '../services/taskService';
import { format, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import TaskDetailModal from '../components/Tasks/TaskDetailModal';
import DatePicker from '../components/DatePicker';
import { useAuthStore } from '../store/authStore';

const ACTION_CONFIG = {
  create:        { label: 'Tạo mới',        color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  update:        { label: 'Chỉnh sửa',      color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)'  },
  delete:        { label: 'Xóa',            color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
  approve:       { label: 'Duyệt',          color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
  reject:        { label: 'Từ chối',        color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
  status_change: { label: 'Đổi trạng thái', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  upload:        { label: 'Đính kèm',       color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)'  },
};

// Modal chi tiết log
function LogDetailModal({ log, onClose }) {
  const act = ACTION_CONFIG[log.action] || { label: log.action, color:'#6b7280', bg:'rgba(107,114,128,0.12)' };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 560, width:'100%' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 22px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <History size={18} style={{ color:'#0ea5e9' }}/>
            <h3 style={{ fontSize:18, fontWeight:800, color:'var(--text-primary)', margin:0 }}>Chi tiết hoạt động</h3>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}>
            <X size={20}/>
          </button>
        </div>
        <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:14 }}>
          {/* Thao tác */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--text-muted)', width:120 }}>THAO TÁC</span>
            <span style={{ fontSize:13, padding:'4px 12px', borderRadius:7, fontWeight:700, backgroundColor:act.bg, color:act.color }}>
              {act.label}
            </span>
          </div>
          {/* Thời gian */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--text-muted)', width:120 }}>THỜI GIAN</span>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>
              {format(new Date(log.createdAt), 'HH:mm:ss - dd/MM/yyyy', { locale: vi })}
            </span>
          </div>
          {/* Người thực hiện */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--text-muted)', width:120 }}>NGƯỜI THỰC HIỆN</span>
            {log.user ? (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', backgroundColor:log.user.color||'#6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, color:'#fff' }}>
                  {log.user.name?.charAt(0)}
                </div>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{log.user.name}</span>
                <span style={{ fontSize:11, padding:'2px 8px', borderRadius:5, backgroundColor:'var(--bg-hover)', color:'var(--text-muted)', fontWeight:600 }}>{log.user.role}</span>
              </div>
            ) : <span style={{ color:'var(--text-muted)' }}>—</span>}
          </div>
          {/* Nội dung */}
          <div style={{ display:'flex', gap:10 }}>
            <span style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', width:120, flexShrink:0, paddingTop:2 }}>NỘI DUNG</span>
            <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6, backgroundColor:'var(--bg-hover)', padding:'10px 14px', borderRadius:8, flex:1, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
              {log.description}
            </div>
          </div>
          {/* Entity */}
          {log.entityId && (
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', width:120 }}>ĐỐI TƯỢNG</span>
              <span style={{ fontSize:14, fontFamily:'monospace', color:'#0ea5e9', backgroundColor:'#0ea5e920', padding:'5px 12px', borderRadius:5 }}>
                {log.entityType} · {log.entityId}
              </span>
            </div>
          )}
        </div>
        <div style={{ padding:'12px 22px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary">Đóng</button>
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { user: currentUser } = useAuthStore();
  const isMember = currentUser?.role === 'member';

  const [logs,    setLogs]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [users,   setUsers]   = useState([]);
  const [selectedLog,  setSelectedLog]  = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loadingTask,  setLoadingTask]  = useState(false);

  // Filters — chỉ chọn 1 ngày duy nhất
  const [quickFilter, setQuickFilter] = useState('');
  const [filterDate,   setFilterDate]   = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterUser,   setFilterUser]   = useState('');
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(0);
  const LIMIT = 50;

  const today     = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  const applyQuick = (key) => {
    setQuickFilter(key);
    setPage(0);
    if (key === 'today')     setFilterDate(today);
    else if (key === 'yesterday') setFilterDate(yesterday);
    else if (key === 'pick') { /* giữ filterDate hiện tại hoặc để trống */ }
    else setFilterDate('');
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDate)   params.append('date',   filterDate);
      if (filterAction) params.append('action', filterAction);
      // Member chỉ thấy lịch sử của mình
      if (isMember) params.append('userId', currentUser.id);
      else if (filterUser) params.append('userId', filterUser);
      if (search)       params.append('search', search);
      params.append('limit',  LIMIT);
      params.append('offset', page * LIMIT);

      const res = await api.get(`/activity-logs?${params}`);
      setLogs(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filterDate, filterAction, filterUser, search, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => {
    userService.getUsers().then(r => setUsers(r.data.data || [])).catch(() => {});
  }, []);

  const selStyle = { fontSize:15, padding:'10px 14px', borderRadius:9, border:'1.5px solid var(--border)', backgroundColor:'var(--bg-input)', color:'var(--text-secondary)', outline:'none', cursor:'pointer' };

  const hasFilter = filterDate || filterAction || filterUser || search;

  // Click vào log → mở modal chi tiết
  const handleLogClick = async (log) => {
    // Nếu là task event (entityType = Task), thử fetch task để mở TaskDetailModal
    if (log.entityType === 'Task' && log.entityId && log.action !== 'delete') {
      setLoadingTask(true);
      try {
        const res = await api.get(`/tasks/${log.entityId}`);
        if (res.data?.data) {
          setSelectedTask(res.data.data);
          return;
        }
      } catch (e) { /* task bị xóa hoặc không tìm thấy */ }
      finally { setLoadingTask(false); }
    }
    // Fallback: mở modal chi tiết log
    setSelectedLog(log);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <History size={22} style={{ color:'#0ea5e9' }}/>
          <h2 style={{ fontSize:24, fontWeight:900, color:'var(--text-primary)', margin:0 }}>
            {isMember ? 'Lịch Sử Của Tôi' : 'Lịch Sử Hoạt Động'}
          </h2>
          <span style={{ fontSize:14, padding:'2px 10px', borderRadius:10, backgroundColor:'#0ea5e920', color:'#0ea5e9', fontWeight:700 }}>
            {total} bản ghi
          </span>
        </div>
        <button onClick={fetchLogs} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9, border:'1.5px solid var(--border)', backgroundColor:'var(--bg-hover)', color:'var(--text-secondary)', cursor:'pointer', fontSize:15, fontWeight:600 }}>
          <RefreshCw size={14}/> Làm mới
        </button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', flexDirection:'column', gap:10, padding:'14px 16px', backgroundColor:'var(--bg-surface)', borderRadius:12, border:'1.5px solid var(--border)' }}>

        {/* Row 1: Quick filters + DatePicker */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, color:'var(--text-muted)', fontSize:14, marginRight:4 }}>
            <Filter size={13}/> <span style={{ fontWeight:700 }}>Lọc nhanh:</span>
          </div>

          {/* Nút Tất cả */}
          <button onClick={() => applyQuick('')}
            style={{ padding:'8px 16px', borderRadius:8, border:'none', fontSize:12, fontWeight:700, cursor:'pointer',
              backgroundColor: quickFilter==='' ? '#0ea5e9' : 'var(--bg-hover)',
              color: quickFilter==='' ? '#fff' : 'var(--text-secondary)', transition:'all 0.15s' }}>
            Tất cả
          </button>

          {/* Nút Hôm nay */}
          <button onClick={() => applyQuick('today')}
            style={{ padding:'8px 16px', borderRadius:8, border:'none', fontSize:12, fontWeight:700, cursor:'pointer',
              backgroundColor: quickFilter==='today' ? '#0ea5e9' : 'var(--bg-hover)',
              color: quickFilter==='today' ? '#fff' : 'var(--text-secondary)', transition:'all 0.15s' }}>
            Hôm nay
          </button>

          {/* Nút Hôm qua */}
          <button onClick={() => applyQuick('yesterday')}
            style={{ padding:'6px 14px', borderRadius:8, border:'none', fontSize:12, fontWeight:700, cursor:'pointer',
              backgroundColor: quickFilter==='yesterday' ? '#0ea5e9' : 'var(--bg-hover)',
              color: quickFilter==='yesterday' ? '#fff' : 'var(--text-secondary)', transition:'all 0.15s' }}>
            Hôm qua
          </button>

          {/* DatePicker chọn ngày cụ thể */}
          <DatePicker
            value={quickFilter === 'today' || quickFilter === 'yesterday' ? filterDate : filterDate}
            onChange={v => {
              setFilterDate(v);
              setPage(0);
              // Khi chọn ngày thủ công → set quickFilter về 'pick'
              if (v) setQuickFilter('pick');
              else setQuickFilter('');
            }}
            placeholder="Chọn ngày..."
            style={{ minWidth: 160 }}
          />

          {/* Hiển thị ngày đang lọc */}
          {filterDate && (
            <span style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4 }}>
              📅 {format(new Date(filterDate), 'dd/MM/yyyy')}
            </span>
          )}
        </div>

        {/* Row 2: Other filters */}
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          {/* Thao tác */}
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            <label style={{ fontSize:13, color:'var(--text-muted)', fontWeight:600 }}>Thao tác</label>
            <select value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(0); }} style={{ ...selStyle, width:150 }}>
              <option value="">Tất cả</option>
              {Object.entries(ACTION_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {/* Người thực hiện — chỉ hiện với admin/director/manager */}
          {!isMember && (
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            <label style={{ fontSize:13, color:'var(--text-muted)', fontWeight:600 }}>Người thực hiện</label>
            <select value={filterUser} onChange={e => { setFilterUser(e.target.value); setPage(0); }} style={{ ...selStyle, width:160 }}>
              <option value="">Tất cả</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          )}

          {/* Tìm kiếm */}
          <div style={{ display:'flex', flexDirection:'column', gap:3, flex:1, minWidth:180 }}>
            <label style={{ fontSize:13, color:'var(--text-muted)', fontWeight:600 }}>Tìm kiếm nội dung</label>
            <div style={{ position:'relative' }}>
              <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                placeholder="Nhập từ khóa..."
                style={{ ...selStyle, width:'100%', paddingLeft:30, boxSizing:'border-box' }}/>
            </div>
          </div>

          {hasFilter && (
            <button onClick={() => {
              setQuickFilter(''); setFilterDate('');
              setFilterAction(''); setFilterUser(''); setSearch(''); setPage(0);
            }}
              style={{ fontSize:13, padding:'4px 10px', borderRadius:6, border:'1px solid var(--border)', backgroundColor:'var(--bg-hover)', color:'var(--text-muted)', cursor:'pointer', marginTop:18 }}>
              ✕ Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor:'var(--bg-surface)', border:'1.5px solid var(--border)', borderRadius:14, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ backgroundColor:'var(--bg-hover)' }}>
                {['Ngày giờ','Thao tác','Người thực hiện','Nội dung thực hiện'].map((h,i) => (
                  <th key={i} style={{ padding:'11px 16px', fontSize:13, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)', borderBottom:'2px solid var(--border)', textAlign:'left', whiteSpace:'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length:8}).map((_,i) => (
                  <tr key={i}>
                    {[1,2,3,4].map(j => (
                      <td key={j} style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
                        <div style={{ height:14, borderRadius:4, backgroundColor:'var(--bg-hover)', animation:'pulse 1.5s infinite' }}/>
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding:'60px 16px', textAlign:'center', color:'var(--text-muted)', fontSize:14 }}>
                    <History size={36} style={{ margin:'0 auto 10px', opacity:0.3 }}/>
                    <p>Chưa có lịch sử hoạt động</p>
                  </td>
                </tr>
              ) : logs.map((log, i) => {
                const act = ACTION_CONFIG[log.action] || { label: log.action, color:'#6b7280', bg:'rgba(107,114,128,0.12)' };
                return (
                  <tr key={log.id}
                    onClick={() => handleLogClick(log)}
                    style={{ borderBottom:'1px solid var(--border)', transition:'background 0.15s', cursor:'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor='var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}>

                    {/* Ngày giờ */}
                    <td style={{ padding:'12px 16px', whiteSpace:'nowrap' }}>
                      <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>
                        {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm', { locale: vi })}
                      </div>
                    </td>

                    {/* Thao tác */}
                    <td style={{ padding:'12px 16px', whiteSpace:'nowrap' }}>
                      <span style={{ fontSize:12, padding:'3px 10px', borderRadius:6, fontWeight:700, backgroundColor:act.bg, color:act.color }}>
                        {act.label}
                      </span>
                    </td>

                    {/* Người thực hiện */}
                    <td style={{ padding:'12px 16px', whiteSpace:'nowrap' }}>
                      {log.user ? (
                        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                          <div style={{ width:26, height:26, borderRadius:'50%', backgroundColor:log.user.color||'#6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color:'#fff', flexShrink:0 }}>
                            {log.user.name?.charAt(0)}
                          </div>
                          <span style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)' }}>{log.user.name}</span>
                        </div>
                      ) : <span style={{ color:'var(--text-muted)' }}>—</span>}
                    </td>

                    {/* Nội dung */}
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:15, color:'var(--text-secondary)' }}>{log.description}</span>
                        <ExternalLink size={12} style={{ color:'var(--text-muted)', flexShrink:0, opacity:0.5 }}/>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > LIMIT && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:'1px solid var(--border)' }}>
            <span style={{ fontSize:14, color:'var(--text-muted)' }}>
              Hiển thị {page*LIMIT+1}–{Math.min((page+1)*LIMIT, total)} / {total}
            </span>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page===0}
                style={{ padding:'8px 14px', borderRadius:7, border:'1px solid var(--border)', backgroundColor:'var(--bg-hover)', color:'var(--text-secondary)', cursor:page===0?'not-allowed':'pointer', opacity:page===0?0.5:1, fontSize:14 }}>
                ← Trước
              </button>
              <button onClick={() => setPage(p => p+1)} disabled={(page+1)*LIMIT >= total}
                style={{ padding:'8px 14px', borderRadius:7, border:'1px solid var(--border)', backgroundColor:'var(--bg-hover)', color:'var(--text-secondary)', cursor:(page+1)*LIMIT>=total?'not-allowed':'pointer', opacity:(page+1)*LIMIT>=total?0.5:1, fontSize:14 }}>
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading overlay khi đang fetch task */}
      {loadingTask && (
        <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ padding:'20px 32px', borderRadius:12, backgroundColor:'var(--bg-surface)', fontSize:14, fontWeight:700, color:'var(--text-primary)', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:18, height:18, border:'2.5px solid var(--border)', borderTopColor:'#0ea5e9', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
            Đang tải chi tiết...
          </div>
        </div>
      )}

      {/* Modal chi tiết log */}
      {selectedLog && <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}

      {/* Modal chi tiết task (sự kiện) */}
      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
