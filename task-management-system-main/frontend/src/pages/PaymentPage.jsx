import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, X, Save, Filter, CheckCircle, Search, CreditCard, DollarSign, Clock, Edit2, TrendingUp } from 'lucide-react';
import api from '../services/api';
import { userService } from '../services/taskService';
import { MONTHS, YEARS } from '../utils/constants';
import DatePicker from '../components/DatePicker';
import { useAuthStore } from '../store/authStore';

const DEPT_OPTIONS = ['KN&DMST', 'Hành chính tổng hợp', 'Thông tin thống kê', 'Dịch vụ'];

const DEPT_COLORS = {
  'KN&DMST':     '#ef4444',
  'Dịch vụ':'#10b981','Hành chính tổng hợp':'#f59e0b','Thông tin thống kê':'#14b8a6','Ban Giám đốc':'#0ea5e9',
};

const STATUS_CFG = {
  pending:   { label:'Chờ thanh toán', color:'#f59e0b', bg:'rgba(245,158,11,0.14)'  },
  paid:      { label:'Đã thanh toán',  color:'#10b981', bg:'rgba(16,185,129,0.14)'  },
  cancelled: { label:'Đã hủy',         color:'#6b7280', bg:'rgba(107,114,128,0.14)' },
};

import { showConfirm } from '../utils/confirm';

function fmtMoney(v) {
  if (!v && v !== 0) return '—';
  return Number(v).toLocaleString('vi-VN') + ' đ';
}

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('vi-VN');
}

const now = new Date();
const defaultForm = {
  name:'', department:'KN&DMST', amount:'', status:'pending',
  dueDate:'', paidDate:'', assigneeId:'', notes:'',
  month: now.getMonth()+1, year: now.getFullYear()
};

export default function PaymentPage() {
  const { user } = useAuthStore();
  const canEdit = ['admin','director','manager'].includes(user?.role);

  const [payments, setPayments] = useState([]);
  const [stats,    setStats]    = useState(null);
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem,  setEditItem]  = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saveErr, setSaveErr] = useState('');
  const [saving, setSaving] = useState(false);

  const [filters, setFilters] = useState({
    month: 0, year: new Date().getFullYear(),  // 0 = tất cả tháng
    department:'', status:'', search:''
  });

  const sf = (k,v) => setFilters(f => ({...f, [k]:v}));
  const s  = (k,v) => setForm(f => ({...f, [k]:v}));

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (filters.month && filters.month > 0) p.append('month', filters.month);
      if (filters.year)       p.append('year',        filters.year);
      if (filters.department) p.append('department',  filters.department);
      if (filters.status)     p.append('status',      filters.status);
      if (filters.search)     p.append('search',      filters.search);
      const statsP = new URLSearchParams();
      if (filters.month && filters.month > 0) statsP.append('month', filters.month);
      if (filters.year) statsP.append('year', filters.year);
      const [pRes, sRes] = await Promise.all([
        api.get(`/payments?${p}`),
        api.get(`/payments/stats?${statsP}`)
      ]);
      setPayments(pRes.data.data || []);
      setStats(sRes.data.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { userService.getUsers().then(r=>setUsers(r.data.data||[])).catch(()=>{}); }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({...defaultForm, month:filters.month, year:filters.year});
    setSaveErr('');
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name, department: item.department,
      amount: item.amount || '', status: item.status,
      dueDate: item.dueDate ? item.dueDate.slice(0,10) : '',
      paidDate: item.paidDate ? item.paidDate.slice(0,10) : '',
      assigneeId: item.assigneeId || '', notes: item.notes || '',
      month: item.month, year: item.year
    });
    setSaveErr('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setSaveErr('Vui lòng nhập tên khoản thanh toán');
    setSaving(true); setSaveErr('');
    try {
      const payload = {...form, amount: form.amount || null, assigneeId: form.assigneeId || null,
        dueDate: form.dueDate || null, paidDate: form.paidDate || null};
      if (editItem) await api.put(`/payments/${editItem.id}`, payload);
      else          await api.post('/payments', payload);
      setShowModal(false);
      fetchAll();
    } catch(err) { setSaveErr(err.response?.data?.message || 'Có lỗi xảy ra'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    const ok = await showConfirm({ title:'Xóa khoản thanh toán', message:'Bạn có chắc muốn xóa khoản thanh toán này?', confirmLabel:'Xóa' });
    if (!ok) return;
    await api.delete(`/payments/${id}`);
    fetchAll();
  };

  const handleMarkPaid = async (id) => {
    await api.patch(`/payments/${id}/mark-paid`, { paidDate: new Date().toISOString().slice(0,10) });
    fetchAll();
  };

  // Group by department
  const grouped = {};
  payments.forEach(p => {
    if (!grouped[p.department]) grouped[p.department] = [];
    grouped[p.department].push(p);
  });

  const Label = ({children}) => (
    <label style={{display:'block',fontSize:12,fontWeight:700,color:'var(--text-secondary)',marginBottom:5}}>{children}</label>
  );

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:900,color:'var(--text-primary)',margin:0,display:'flex',alignItems:'center',gap:8}}>
            <CreditCard size={22} style={{color:'#0ea5e9'}}/> Quản lý Phụ trách Thanh toán
          </h2>
          <p style={{fontSize:13,color:'var(--text-muted)',marginTop:4}}>
            Theo dõi các khoản thanh toán theo bộ phận phụ trách
          </p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={15}/> Thêm khoản
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          {[
            {icon:CreditCard, label:'Tổng khoản',      value:stats.total,                    color:'#0ea5e9'},
            {icon:CheckCircle,label:'Đã thanh toán',   value:stats.paid,                     color:'#10b981'},
            {icon:Clock,      label:'Chờ thanh toán',  value:stats.pending,                  color:'#f59e0b'},
            {icon:DollarSign, label:'Tổng tiền đã TT', value:fmtMoney(stats.paidAmount),     color:'#8b5cf6'},
          ].map((kpi,i) => (
            <div key={i} style={{backgroundColor:'var(--bg-surface)',border:`1px solid ${kpi.color}20`,borderRadius:14,padding:'16px 18px',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,right:0,width:60,height:60,borderRadius:'0 14px 0 60px',backgroundColor:`${kpi.color}08`}}/>
              <div style={{width:38,height:38,borderRadius:10,backgroundColor:`${kpi.color}18`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:10}}>
                <kpi.icon size={18} color={kpi.color}/>
              </div>
              <div style={{fontSize:26,fontWeight:900,color:'var(--text-primary)',lineHeight:1,marginBottom:3}}>{kpi.value}</div>
              <div style={{fontSize:12,color:'var(--text-muted)',fontWeight:600}}>{kpi.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',padding:'10px 14px',backgroundColor:'var(--bg-surface)',borderRadius:12,border:'1.5px solid var(--border)'}}>
        <div style={{display:'flex',alignItems:'center',gap:5,fontSize:12,color:'var(--text-muted)'}}>
          <Filter size={13}/> <span style={{fontWeight:700}}>Lọc:</span>
        </div>
        <select className="select" style={{width:130,fontSize:12,padding:'5px 10px'}} value={filters.month} onChange={e=>sf('month',parseInt(e.target.value))}>
          <option value={0}>Tất cả tháng</option>
          {MONTHS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select className="select" style={{width:80,fontSize:12,padding:'5px 10px'}} value={filters.year} onChange={e=>sf('year',parseInt(e.target.value))}>
          {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <div style={{width:1,height:18,backgroundColor:'var(--border)',margin:'0 2px'}}/>
        <select className="select" style={{width:150,fontSize:12,padding:'5px 10px'}} value={filters.department} onChange={e=>sf('department',e.target.value)}>
          <option value="">Tất cả bộ phận</option>
          {DEPT_OPTIONS.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
        <select className="select" style={{width:160,fontSize:12,padding:'5px 10px'}} value={filters.status} onChange={e=>sf('status',e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        <div style={{position:'relative',flex:1,minWidth:180}}>
          <Search size={13} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',pointerEvents:'none'}}/>
          <input type="text" placeholder="Tìm khoản thanh toán..." value={filters.search}
            onChange={e=>sf('search',e.target.value)}
            style={{width:'100%',paddingLeft:28,paddingRight:10,paddingTop:5,paddingBottom:5,fontSize:12,borderRadius:8,border:'1.5px solid var(--border)',backgroundColor:'var(--bg-input)',color:'var(--text-secondary)',outline:'none',boxSizing:'border-box'}}/>
        </div>
        <span style={{marginLeft:'auto',fontSize:12,color:'var(--text-muted)',fontWeight:700}}>{payments.length} khoản</span>
      </div>

      {/* Content — grouped by dept */}
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {loading ? (
          [1,2,3].map(i=><div key={i} style={{height:80,borderRadius:12,backgroundColor:'var(--bg-hover)',animation:'pulse 1.5s infinite'}}/>)
        ) : Object.keys(grouped).length === 0 ? (
          <div style={{textAlign:'center',padding:'60px 0',color:'var(--text-muted)'}}>
            <CreditCard size={36} style={{margin:'0 auto 10px',opacity:0.3}}/>
            <p>Chưa có khoản thanh toán nào</p>
          </div>
        ) : (
          DEPT_OPTIONS.filter(d => grouped[d]?.length > 0).map(dept => {
            const items = grouped[dept] || [];
            const deptColor = DEPT_COLORS[dept] || '#6366f1';
            const paidCount = items.filter(p=>p.status==='paid').length;
            const totalAmt  = items.reduce((s,p)=>s+(parseFloat(p.amount)||0),0);
            return (
              <div key={dept} style={{backgroundColor:'var(--bg-surface)',borderRadius:14,border:`1.5px solid ${deptColor}30`,overflow:'hidden'}}>
                {/* Dept header */}
                <div style={{backgroundColor:`${deptColor}18`,padding:'12px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:`1px solid ${deptColor}25`}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:10,height:10,borderRadius:'50%',backgroundColor:deptColor}}/>
                    <span style={{fontSize:14,fontWeight:900,color:deptColor}}>{dept}</span>
                    <span style={{fontSize:12,fontWeight:700,padding:'2px 9px',borderRadius:10,backgroundColor:`${deptColor}20`,color:deptColor}}>
                      {items.length} khoản
                    </span>
                    <span style={{fontSize:11,color:'var(--text-muted)'}}>
                      {paidCount}/{items.length} đã TT
                      {totalAmt > 0 && ` · ${fmtMoney(totalAmt)}`}
                    </span>
                  </div>
                  {canEdit && (
                    <button onClick={()=>{setForm({...defaultForm,department:dept,month:filters.month,year:filters.year});setEditItem(null);setSaveErr('');setShowModal(true);}}
                      style={{padding:'4px 10px',borderRadius:7,border:`1px solid ${deptColor}40`,backgroundColor:`${deptColor}15`,color:deptColor,fontSize:11,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                      <Plus size={12}/> Thêm
                    </button>
                  )}
                </div>

                {/* Items */}
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead>
                      <tr style={{backgroundColor:'var(--bg-hover)'}}>
                        {['#','Tên khoản thanh toán','Bộ phận','Người phụ trách','Số tiền','Ngày dự kiến','Ngày TT','Trạng thái','Ghi chú',''].map((h,i)=>(
                          <th key={i} style={{padding:'8px 14px',fontSize:10,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--text-muted)',borderBottom:'1px solid var(--border)',textAlign:'left',whiteSpace:'nowrap'}}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item,idx)=>{
                        const st = STATUS_CFG[item.status] || STATUS_CFG.pending;
                        return (
                          <tr key={item.id}
                            style={{borderBottom:'1px solid var(--border)',transition:'background 0.15s',cursor:'pointer'}}
                            onMouseEnter={e=>e.currentTarget.style.backgroundColor='var(--bg-hover)'}
                            onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}
                            onClick={()=>canEdit && openEdit(item)}>
                            <td style={{padding:'10px 14px',fontSize:12,color:'var(--text-muted)',fontWeight:700,width:36}}>{idx+1}</td>
                            <td style={{padding:'10px 14px',minWidth:260}}>
                              <span style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>{item.name}</span>
                            </td>
                            {/* Bộ phận — hiện khi không group hoặc khi lọc */}
                            <td style={{padding:'10px 14px',whiteSpace:'nowrap'}}>
                              {(() => {
                                const dc = DEPT_COLORS[item.department] || '#6366f1';
                                return (
                                  <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:5,backgroundColor:`${dc}18`,color:dc}}>
                                    {item.department || '—'}
                                  </span>
                                );
                              })()}
                            </td>
                            <td style={{padding:'10px 14px',whiteSpace:'nowrap'}}>
                              {item.assignee ? (
                                <div style={{display:'flex',alignItems:'center',gap:6}}>
                                  <div style={{width:22,height:22,borderRadius:'50%',backgroundColor:item.assignee.color||'#6366f1',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,color:'#fff'}}>
                                    {item.assignee.name?.charAt(0)}
                                  </div>
                                  <span style={{fontSize:12,color:'var(--text-secondary)'}}>{item.assignee.name}</span>
                                </div>
                              ) : <span style={{color:'var(--text-muted)'}}>—</span>}
                            </td>
                            <td style={{padding:'10px 14px',whiteSpace:'nowrap',fontWeight:700,color:item.amount?'#10b981':'var(--text-muted)',fontSize:13}}>
                              {fmtMoney(item.amount)}
                            </td>
                            <td style={{padding:'10px 14px',whiteSpace:'nowrap',fontSize:12,color:'var(--text-secondary)'}}>{fmtDate(item.dueDate)}</td>
                            <td style={{padding:'10px 14px',whiteSpace:'nowrap',fontSize:12,color:item.paidDate?'#10b981':'var(--text-muted)',fontWeight:item.paidDate?700:400}}>
                              {fmtDate(item.paidDate)}
                            </td>
                            <td style={{padding:'10px 14px',whiteSpace:'nowrap'}}>
                              <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:6,backgroundColor:st.bg,color:st.color}}>
                                {st.label}
                              </span>
                            </td>
                            <td style={{padding:'10px 14px',maxWidth:200,fontSize:12,color:'var(--text-muted)'}}>
                              {item.notes || '—'}
                            </td>
                            <td style={{padding:'10px 14px',whiteSpace:'nowrap'}} onClick={e=>e.stopPropagation()}>
                              {canEdit && (
                                <div style={{display:'flex',gap:4}}>
                                  {item.status === 'pending' && (
                                    <button onClick={()=>handleMarkPaid(item.id)}
                                      style={{padding:'4px 8px',borderRadius:6,border:'none',backgroundColor:'rgba(16,185,129,0.15)',color:'#10b981',cursor:'pointer',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',gap:3}}>
                                      <CheckCircle size={11}/> TT
                                    </button>
                                  )}
                                  <button onClick={()=>openEdit(item)}
                                    style={{padding:'4px 8px',borderRadius:6,border:'none',backgroundColor:'rgba(99,102,241,0.15)',color:'#818cf8',cursor:'pointer',fontSize:11}}>
                                    <Edit2 size={12}/>
                                  </button>
                                  <button onClick={()=>handleDelete(item.id)}
                                    style={{padding:'4px 8px',borderRadius:6,border:'none',backgroundColor:'rgba(239,68,68,0.12)',color:'#ef4444',cursor:'pointer',fontSize:11}}>
                                    <Trash2 size={12}/>
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal-content" style={{maxWidth:580,maxHeight:'92vh',overflowY:'auto',width:'100%'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 22px',borderBottom:'1px solid var(--border)',position:'sticky',top:0,backgroundColor:'var(--bg-surface)',zIndex:10}}>
              <h3 style={{fontSize:16,fontWeight:800,color:'var(--text-primary)',margin:0}}>
                {editItem ? 'Chỉnh sửa khoản thanh toán' : 'Thêm khoản thanh toán'}
              </h3>
              <button onClick={()=>setShowModal(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)'}}>
                <X size={20}/>
              </button>
            </div>
            <form onSubmit={handleSave} style={{padding:'18px 22px',display:'flex',flexDirection:'column',gap:14}}>
              {saveErr && (
                <div style={{padding:'10px 14px',borderRadius:8,backgroundColor:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',fontSize:13,color:'#ef4444'}}>
                  {saveErr}
                </div>
              )}

              <div>
                <Label>Tên khoản thanh toán *</Label>
                <textarea className="input" rows={2} style={{resize:'none'}} required
                  placeholder="VD: Thanh toán thư mời màu, in ấn bảng tên..."
                  value={form.name} onChange={e=>s('name',e.target.value)}/>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <Label>Bộ phận phụ trách *</Label>
                  <select className="select" value={form.department} onChange={e=>s('department',e.target.value)}>
                    {DEPT_OPTIONS.map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Trạng thái</Label>
                  <select className="select" value={form.status} onChange={e=>s('status',e.target.value)}>
                    {Object.entries(STATUS_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <Label>Số tiền (VNĐ)</Label>
                  <input className="input" type="number" min="0" placeholder="0"
                    value={form.amount} onChange={e=>s('amount',e.target.value)}/>
                </div>
                <div>
                  <Label>Người phụ trách</Label>
                  <select className="select" value={form.assigneeId} onChange={e=>s('assigneeId',e.target.value)}>
                    <option value="">-- Chọn --</option>
                    {users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <DatePicker label="Ngày dự kiến thanh toán" value={form.dueDate} onChange={v=>s('dueDate',v)}/>
                {form.status === 'paid' && (
                  <DatePicker label="Ngày đã thanh toán" value={form.paidDate} onChange={v=>s('paidDate',v)}/>
                )}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <Label>Tháng</Label>
                  <select className="select" value={form.month} onChange={e=>s('month',parseInt(e.target.value))}>
                    {MONTHS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Năm</Label>
                  <select className="select" value={form.year} onChange={e=>s('year',parseInt(e.target.value))}>
                    {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <Label>Ghi chú</Label>
                <textarea className="input" rows={2} style={{resize:'none'}}
                  value={form.notes} onChange={e=>s('notes',e.target.value)}/>
              </div>

              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:4,borderTop:'1px solid var(--border)'}}>
                {editItem ? (
                  <button type="button" onClick={()=>handleDelete(editItem.id).then(()=>setShowModal(false))}
                    style={{padding:'7px 14px',borderRadius:8,border:'none',backgroundColor:'rgba(239,68,68,0.12)',color:'#ef4444',fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>
                    <Trash2 size={14}/> Xóa
                  </button>
                ) : <div/>}
                <div style={{display:'flex',gap:10}}>
                  <button type="button" className="btn btn-secondary" onClick={()=>setShowModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    <Save size={14}/> {saving ? 'Đang lưu...' : 'Lưu'}
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
