import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Target, Activity, Filter, X } from 'lucide-react';
import { statsService, userService, taskService } from '../services/taskService';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend, LabelList
} from 'recharts';
import { MONTHS, WORK_CATEGORY, LEAD_DEPT, DEPUTY_DIRECTORS, YEARS } from '../utils/constants';
import TaskDetailModal from '../components/Tasks/TaskDetailModal';
import { useFilterStore } from '../store/filterStore';

const DEPT_LABELS = {
  'LD-COM':'Hành chính tổng hợp','LD-INF':'Thông tin thống kê','LD-ADM':'Hành chính tổng hợp',
  'LD-SER':'Dịch vụ','LD-INNO':'KN&ĐMST','LD-BOD':'Ban GĐ'
};

const SimpleTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', boxShadow:'0 8px 24px rgba(0,0,0,0.4)' }}>
      {label && <p style={{ color:'var(--text-secondary)', fontSize:11, fontWeight:700, marginBottom:5 }}>{label}</p>}
      {payload.map((p,i) => (
        <p key={i} style={{ color:p.color||p.fill||'#0ea5e9', fontSize:13, fontWeight:800, margin:'2px 0' }}>
          {p.name}: <span style={{ color:'var(--text-primary)' }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
};

function Section({ title, sub, children }) {
  return (
    <div style={{ backgroundColor:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:16, padding:'18px 20px' }}>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:14, fontWeight:800, color:'var(--text-primary)' }}>{title}</div>
        {sub && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color, badge }) {
  return (
    <div style={{ backgroundColor:'var(--bg-surface)', border:`1px solid ${color}20`, borderRadius:16, padding:'18px 20px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, right:0, width:70, height:70, borderRadius:'0 16px 0 70px', backgroundColor:`${color}08` }}/>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ width:40, height:40, borderRadius:11, backgroundColor:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={19} color={color}/>
        </div>
        {badge && <span style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6, backgroundColor:`${color}15`, color }}>{badge}</span>}
      </div>
      <div style={{ fontSize:34, fontWeight:900, color:'var(--text-primary)', lineHeight:1, marginBottom:3 }}>{value}</div>
      <div style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)' }}>{label}</div>
      {sub && <div style={{ fontSize:11, fontWeight:700, color, marginTop:3 }}>{sub}</div>}
    </div>
  );
}

const selStyle = {
  fontSize:12, borderRadius:8, padding:'5px 10px',
  border:'1.5px solid var(--border)', cursor:'pointer',
  backgroundColor:'var(--bg-input)', color:'var(--text-secondary)', outline:'none'
};

export default function StatsEventPage() {
  const [stats,      setStats]      = useState(null);
  const [users,      setUsers]      = useState([]);
  // ── Panel chi tiết khi click cột ──
  const [detailPanel, setDetailPanel] = useState(null);
  const [paymentPanel, setPaymentPanel] = useState(null); // { dept, items, statusFilter }
  const [selectedPayment, setSelectedPayment] = useState(null);
  // ── Task detail modal khi click vào task trong list ──
  const [selectedTask, setSelectedTask] = useState(null);

  // ── Filter từ store (persist qua tab) ──
  const { statsEvent, setFilter } = useFilterStore();
  const month     = statsEvent.month;
  const year      = statsEvent.year;
  const fDept     = statsEvent.leadDepartment;
  const fAssignee = statsEvent.assigneeId;
  const fDirector = statsEvent.deputyDirector;

  const setMonth     = (v) => setFilter('statsEvent', { month: v });
  const setYear      = (v) => setFilter('statsEvent', { year: v });
  const setFDept     = (v) => setFilter('statsEvent', { leadDepartment: v });
  const setFAssignee = (v) => setFilter('statsEvent', { assigneeId: v });
  const setFDirector = (v) => setFilter('statsEvent', { deputyDirector: v });

  const hasFilter = fDept || fAssignee || fDirector;
  const clearFilter = () => setFilter('statsEvent', { leadDepartment:'', assigneeId:'', deputyDirector:'' });

  useEffect(() => {
    userService.getUsers().then(r => setUsers(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setStats(null);
    const params = { month, year };
    if (fDept)     params.leadDepartment = fDept;
    if (fAssignee) params.assigneeId     = fAssignee;
    statsService.getDashboard(params)
      .then(r => setStats(r.data.data))
      .catch(console.error);
  }, [month, year, fDept, fAssignee, fDirector]);

  if (!stats) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:16 }}>
      <div style={{ width:48, height:48, border:'3px solid rgba(14,165,233,0.2)', borderTopColor:'#0ea5e9', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <p style={{ color:'var(--text-muted)', fontSize:13 }}>Đang tải dữ liệu...</p>
    </div>
  );

  const { tasks, completion, byDept, byCategory, completionRate, weeklyTrend = [], totalUsers, tasksByDept = {}, tasksByDirector = {}, tasksByAssignee = {}, paymentsByDept = {} } = stats;

  const statusPie = [
    { name:'Chưa bắt đầu', value:tasks.notStarted, color:'#64748b' },
    { name:'Đang thực hiện', value:tasks.inProgress, color:'#f59e0b' },
    { name:'Hoàn thành',    value:tasks.done,        color:'#10b981' },
    { name:'Trễ hạn',       value:tasks.delayed,     color:'#ef4444' },
  ].filter(d => d.value > 0);

  const qualityPie = [
    { name:'OT Đúng hạn', value:completion.ot, color:'#10b981' },
    { name:'OD Trễ hạn',  value:completion.od, color:'#f59e0b' },
    { name:'IC Không HT', value:completion.ic, color:'#ef4444' },
  ].filter(d => d.value > 0);

  const deptData = byDept.map(d => ({
    name: DEPT_LABELS[d.leadDepartment] || d.leadDepartment,
    'Số CV': parseInt(d.count),
    fill: LEAD_DEPT[d.leadDepartment]?.color || '#0ea5e9'
  }));

  const catData = byCategory.map(c => ({
    name: c.workCategory,
    value: parseInt(c.count),
    color: WORK_CATEGORY[c.workCategory]?.color || '#0ea5e9'
  }));

  const eventTrend = weeklyTrend.map(w => ({
    name: w.name,
    'Sự kiện': w['Sự kiện'],
    'Hoàn thành': w['SK Hoàn thành'],
    'Trễ hạn': w['SK Trễ hạn'],
  }));

  const compTotal = completion.ot + completion.od + completion.ic;

  // ── Màu trạng thái ──
  const STATUS_COLORS = { done:'#10b981', in_progress:'#f59e0b', not_started:'#64748b', delayed:'#ef4444' };
  const STATUS_LABELS = { done:'Hoàn thành', in_progress:'Đang thực hiện', not_started:'Chưa bắt đầu', delayed:'Trễ hạn' };
  const DEPT_COLORS   = ['#0ea5e9','#10b981','#f59e0b','#8b5cf6','#ef4444','#f97316','#06b6d4','#ec4899','#14b8a6','#a855f7'];

  // ── Helper: tạo data cho grouped bar ──
  const makeGroupedData = (grouped, labelMap = {}) =>
    Object.entries(grouped).map(([key, items], i) => ({
      name:       labelMap[key] || key,
      key,
      color:      LEAD_DEPT[key]?.color || DEPT_COLORS[i % DEPT_COLORS.length],
      total:      items.length,
      tasks:      items,
      'Hoàn thành':     items.filter(t => t.status === 'done').length,
      'Đang thực hiện': items.filter(t => t.status === 'in_progress').length,
      'Chưa bắt đầu':  items.filter(t => t.status === 'not_started').length,
      'Trễ hạn':        items.filter(t => t.status === 'delayed').length,
    })).sort((a,b) => b.total - a.total);

  const deptGrouped     = makeGroupedData(tasksByDept, DEPT_LABELS);
  const directorGrouped = makeGroupedData(tasksByDirector);
  const paymentGrouped  = makeGroupedData(tasksByDept, DEPT_LABELS); // thanh toán = bộ phận

  // ── Tooltip grouped bar ──
  const GroupedTip = ({ active, payload, label, sourceData }) => {
    if (!active || !payload?.length) return null;
    const entry = (sourceData || []).find(d => d.name === label);
    return (
      <div style={{ backgroundColor:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12,
        padding:'12px 16px', boxShadow:'0 16px 48px rgba(0,0,0,0.6)', maxWidth:260, zIndex:999 }}>
        <div style={{ fontSize:13, fontWeight:900, color:'var(--text-primary)', marginBottom:8,
          borderBottom:'1px solid var(--border)', paddingBottom:7 }}>
          {label}
          <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, marginLeft:6 }}>
            ({entry?.total || 0} CV)
          </span>
        </div>
        {payload.map((p,i) => p.value > 0 && (
          <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:8, height:8, borderRadius:2, backgroundColor:p.fill }}/>
              <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{p.name}</span>
            </div>
            <span style={{ fontSize:13, fontWeight:900, color:p.fill }}>{p.value}</span>
          </div>
        ))}
        <div style={{ marginTop:8, fontSize:11, color:'var(--text-muted)', textAlign:'center',
          padding:'5px 0', borderTop:'1px solid var(--border)' }}>
          Click cột để xem chi tiết
        </div>
      </div>
    );
  };

  // ── Component grouped bar chart — mỗi nhóm có 4 cột nhỏ + click ──
  const GroupedBarChart = ({ data, title }) => {
    if (!data.length) return (
      <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center',
        color:'var(--text-muted)', fontSize:13 }}>Chưa có dữ liệu</div>
    );
    const chartH = Math.max(340, data.length * 60);
    const handleClick = (barData, statusKey) => {
      if (!barData) return;
      const entry = data.find(d => d.name === barData.activeLabel || d.name === barData.name);
      if (!entry) return;
      const filterStatus = { 'Hoàn thành':'done', 'Đang thực hiện':'in_progress', 'Chưa bắt đầu':'not_started', 'Trễ hạn':'delayed' };
      const st = filterStatus[statusKey];
      const filtered = st ? entry.tasks.filter(t => t.status === st) : entry.tasks;
      setDetailPanel({ title: `${entry.name}${statusKey ? ` — ${statusKey}` : ''}`, color: entry.color, tasks: filtered, statusKey });
    };

    return (
      <ResponsiveContainer width="100%" height={chartH}>
        <BarChart data={data} barCategoryGap="25%" barGap={3}
          margin={{ top:28, right:20, left:0, bottom:40 }}
          onClick={(d) => { if (d?.activeLabel) { const entry = data.find(x => x.name === d.activeLabel); if (entry) setDetailPanel({ title: entry.name, color: entry.color, tasks: entry.tasks, statusKey: null }); } }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
          <XAxis dataKey="name"
            tick={{ fill:'var(--text-secondary)', fontSize:12, fontWeight:700 }}
            axisLine={false} tickLine={false} interval={0}
          />
          <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false}/>
          <Tooltip content={<GroupedTip sourceData={data}/>} cursor={{ fill:'rgba(255,255,255,0.04)' }}/>
          <Legend wrapperStyle={{ fontSize:11, paddingTop:8 }}
            formatter={v => <span style={{ color:'var(--text-secondary)', cursor:'pointer' }}>{v}</span>}/>
          <Bar dataKey="Hoàn thành"     fill="#10b981" radius={[5,5,0,0]}
            onClick={(d) => setDetailPanel({ title:`${d.name} — Hoàn thành`, color:'#10b981', tasks: data.find(x=>x.name===d.name)?.tasks.filter(t=>t.status==='done')||[], statusKey:'done' })}>
            <LabelList dataKey="Hoàn thành"     position="top" style={{ fill:'#10b981', fontSize:11, fontWeight:800 }} formatter={v => v > 0 ? v : ''}/>
          </Bar>
          <Bar dataKey="Đang thực hiện" fill="#f59e0b" radius={[5,5,0,0]}
            onClick={(d) => setDetailPanel({ title:`${d.name} — Đang thực hiện`, color:'#f59e0b', tasks: data.find(x=>x.name===d.name)?.tasks.filter(t=>t.status==='in_progress')||[], statusKey:'in_progress' })}>
            <LabelList dataKey="Đang thực hiện" position="top" style={{ fill:'#f59e0b', fontSize:11, fontWeight:800 }} formatter={v => v > 0 ? v : ''}/>
          </Bar>
          <Bar dataKey="Chưa bắt đầu"  fill="#64748b" radius={[5,5,0,0]}
            onClick={(d) => setDetailPanel({ title:`${d.name} — Chưa bắt đầu`, color:'#64748b', tasks: data.find(x=>x.name===d.name)?.tasks.filter(t=>t.status==='not_started')||[], statusKey:'not_started' })}>
            <LabelList dataKey="Chưa bắt đầu"  position="top" style={{ fill:'#64748b', fontSize:11, fontWeight:800 }} formatter={v => v > 0 ? v : ''}/>
          </Bar>
          <Bar dataKey="Trễ hạn"        fill="#ef4444" radius={[5,5,0,0]}
            onClick={(d) => setDetailPanel({ title:`${d.name} — Trễ hạn`, color:'#ef4444', tasks: data.find(x=>x.name===d.name)?.tasks.filter(t=>t.status==='delayed')||[], statusKey:'delayed' })}>
            <LabelList dataKey="Trễ hạn"        position="top" style={{ fill:'#ef4444', fontSize:11, fontWeight:800 }} formatter={v => v > 0 ? v : ''}/>
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // ── Modal danh sách CV — hiện giữa màn hình ──
  const DetailPanel = () => {
    if (!detailPanel) return null;
    const { title, color, tasks: taskList } = detailPanel;
    const sc = STATUS_COLORS;
    return (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetailPanel(null)}>
        <div className="modal-content" style={{ maxWidth:560, maxHeight:'80vh', display:'flex', flexDirection:'column', width:'100%' }}>
          {/* Header */}
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            position:'sticky', top:0, backgroundColor:'var(--bg-surface)', zIndex:10, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:12, height:12, borderRadius:3, backgroundColor:color }}/>
              <div>
                <div style={{ fontSize:15, fontWeight:900, color:'var(--text-primary)' }}>{title}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
                  {taskList.length} công việc · Click vào để xem chi tiết
                </div>
              </div>
            </div>
            <button onClick={() => setDetailPanel(null)}
              style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}>
              <X size={20}/>
            </button>
          </div>
          {/* Task list */}
          <div style={{ flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:8 }}>
            {taskList.length === 0 ? (
              <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)', fontSize:13 }}>
                Không có công việc
              </div>
            ) : taskList.map((t, i) => {
              const statusColor = sc[t.status] || '#64748b';
              const statusLabel = STATUS_LABELS[t.status] || t.status;
              const compColor = { OT:'#10b981', OD:'#f59e0b', IC:'#ef4444' };
              return (
                <div key={i}
                  onClick={() => {
                    // Fetch full task rồi mở TaskDetailModal
                    taskService.getById(t.id).then(r => setSelectedTask(r.data.data)).catch(() => setSelectedTask(t));
                  }}
                  style={{ padding:'12px 14px', borderRadius:10, cursor:'pointer',
                    backgroundColor:'var(--bg-hover)', border:`1px solid ${statusColor}20`,
                    borderLeft:`3px solid ${statusColor}`, transition:'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}>
                  {/* Top row */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:800,
                      color:statusColor, backgroundColor:`${statusColor}15`,
                      padding:'2px 7px', borderRadius:4 }}>
                      {t.taskCode}
                    </span>
                    <div style={{ display:'flex', gap:5 }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:5,
                        backgroundColor:`${statusColor}18`, color:statusColor }}>
                        {statusLabel}
                      </span>
                      {t.completion && (
                        <span style={{ fontSize:11, fontWeight:800, padding:'2px 8px', borderRadius:5,
                          backgroundColor:`${compColor[t.completion]}18`, color:compColor[t.completion] }}>
                          {t.completion}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Task name */}
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', lineHeight:1.4, marginBottom:6 }}>
                    {t.taskName}
                  </div>
                  {/* Progress + deadline */}
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ flex:1, height:5, borderRadius:3, backgroundColor:'var(--bg-surface)', overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:3,
                        backgroundColor: t.progress === 100 ? '#10b981' : statusColor,
                        width:`${t.progress}%` }}/>
                    </div>
                    <span style={{ fontSize:11, fontWeight:800, color:'var(--text-muted)', minWidth:32 }}>
                      {t.progress}%
                    </span>
                    {t.deadline && (
                      <span style={{ fontSize:10, color:'var(--text-muted)' }}>
                        📅 {new Date(t.deadline).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize:22, fontWeight:900, color:'var(--text-primary)', margin:0 }}>
          📋 Thống kê Sự kiện
        </h1>
        <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>
          Phân tích chi tiết công việc trong sự kiện tháng {month}/{year}
          {hasFilter && <span style={{ marginLeft:8, fontSize:11, padding:'2px 8px', borderRadius:6, backgroundColor:'rgba(14,165,233,0.15)', color:'#0ea5e9', fontWeight:700 }}>Đang lọc</span>}
        </p>
      </div>

      {/* ── Bộ lọc — tháng/năm nằm trong đây ── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', padding:'10px 14px', backgroundColor:'var(--bg-surface)', borderRadius:12, border:'1.5px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text-muted)', marginRight:4 }}>
          <Filter size={13}/> <span style={{ fontWeight:700 }}>Lọc:</span>
        </div>

        {/* Tháng / Năm */}
        <select style={{ ...selStyle, width:120 }} value={month} onChange={e => setMonth(parseInt(e.target.value))}>
          {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select style={{ ...selStyle, width:80 }} value={year} onChange={e => setYear(parseInt(e.target.value))}>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <div style={{ width:1, height:18, backgroundColor:'var(--border)', margin:'0 2px' }}/>

        {/* Bộ phận */}
        <select style={{ ...selStyle, width:160 }} value={fDept} onChange={e => setFDept(e.target.value)}>
          <option value="">Tất cả bộ phận</option>
          {Object.entries(LEAD_DEPT).map(([k,v]) => <option key={k} value={k}>{k} – {v.label}</option>)}
        </select>

        {/* Người thực hiện */}
        <select style={{ ...selStyle, width:160 }} value={fAssignee} onChange={e => setFAssignee(e.target.value)}>
          <option value="">Tất cả người thực hiện</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>

        {/* Lãnh đạo */}
        <select style={{ ...selStyle, width:160 }} value={fDirector} onChange={e => setFDirector(e.target.value)}>
          <option value="">Tất cả lãnh đạo</option>
          {DEPUTY_DIRECTORS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>

        {hasFilter && (
          <button onClick={clearFilter}
            style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'1px solid var(--border)', backgroundColor:'var(--bg-hover)', color:'var(--text-muted)', cursor:'pointer' }}>
            ✕ Xóa lọc
          </button>
        )}

        <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text-muted)', fontWeight:700 }}>
          Tổng: {tasks.total} công việc
        </span>
      </div>

      {/* KPI Row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        <KpiCard icon={Target}      label="Tổng công việc"   value={tasks.total}      color="#0ea5e9" sub={`Tháng ${month}/${year}`}/>
        <KpiCard icon={CheckCircle} label="Hoàn thành"       value={tasks.done}       color="#10b981" badge={`${completionRate}%`} sub={`${completionRate}% tỷ lệ`}/>
        <KpiCard icon={Activity}    label="Đang thực hiện"   value={tasks.inProgress} color="#f59e0b" sub="Đang xử lý"/>
        <KpiCard icon={AlertCircle} label="Trễ hạn"          value={tasks.delayed}    color="#ef4444" sub="Cần xử lý ngay"/>
      </div>

      {/* Row 2: Xu hướng + Radial */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:14 }}>
        <Section title={`Xu hướng sự kiện — tháng ${month}/${year}`} sub="Số lượng sự kiện theo từng tuần">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={eventTrend} margin={{ top:5, right:10, left:-10, bottom:0 }}>
              <defs>
                <linearGradient id="gEv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gDone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
              <XAxis dataKey="name" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false}/>
              <Tooltip content={<SimpleTip/>}/>
              <Legend wrapperStyle={{ fontSize:11, paddingTop:8 }}
                formatter={v => <span style={{ color:'var(--text-secondary)' }}>{v}</span>}/>
              <Area type="monotone" dataKey="Sự kiện"    stroke="#0ea5e9" strokeWidth={2} fill="url(#gEv)"   dot={{ r:4, fill:'#0ea5e9' }}/>
              <Area type="monotone" dataKey="Hoàn thành" stroke="#10b981" strokeWidth={2} fill="url(#gDone)" dot={{ r:4, fill:'#10b981' }}/>
              <Area type="monotone" dataKey="Trễ hạn"    stroke="#ef4444" strokeWidth={1.5} fill="none" strokeDasharray="4 2" dot={{ r:3, fill:'#ef4444' }}/>
            </AreaChart>
          </ResponsiveContainer>
        </Section>

        <Section title="Tỷ lệ hoàn thành" sub={`${tasks.done}/${tasks.total} công việc`}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
            <div style={{ position:'relative', width:150, height:150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%"
                  data={[{ value: completionRate, fill:'#10b981' }]} startAngle={90} endAngle={-270}>
                  <RadialBar dataKey="value" cornerRadius={8} background={{ fill:'rgba(255,255,255,0.05)' }}/>
                </RadialBarChart>
              </ResponsiveContainer>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:26, fontWeight:900, color:'#10b981' }}>{completionRate}%</span>
                <span style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600 }}>Hoàn thành</span>
              </div>
            </div>
            <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:5 }}>
              {[
                { label:'Chưa bắt đầu', value:tasks.notStarted, color:'#64748b' },
                { label:'Đang làm',      value:tasks.inProgress, color:'#f59e0b' },
                { label:'Hoàn thành',    value:tasks.done,       color:'#10b981' },
                { label:'Trễ hạn',       value:tasks.delayed,    color:'#ef4444' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontSize:11, color:'var(--text-muted)' }}>{s.label}</span>
                    <span style={{ fontSize:11, fontWeight:800, color:s.color }}>{s.value}</span>
                  </div>
                  <div style={{ width:'100%', height:4, borderRadius:2, backgroundColor:'var(--bg-hover)', overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:2, backgroundColor:s.color, width:`${tasks.total ? s.value/tasks.total*100 : 0}%`, transition:'width 0.8s ease' }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>

      {/* Row 3: Chất lượng + Trạng thái + Loại CV */}
      {/* Row 3: Chất lượng + Trạng thái + Loại CV */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>

        {/* ── Chất lượng hoàn thành — Donut đẹp ── */}
        <Section title={`Chất lượng hoàn thành — ${completion.ot + completion.od + completion.ic} CV`} sub="OT · OD · IC">
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
            {/* Donut với center text */}
            <div style={{ position:'relative', width:160, height:160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={qualityPie.length > 0 ? qualityPie : [{ name:'Chưa có', value:1, color:'#1e293b' }]}
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={72}
                    paddingAngle={qualityPie.length > 1 ? 3 : 0}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {(qualityPie.length > 0 ? qualityPie : [{ color:'#1e293b' }]).map((e,i) => (
                      <Cell key={i} fill={e.color} stroke="none"/>
                    ))}
                  </Pie>
                  <Tooltip content={<SimpleTip/>}/>
                </PieChart>
              </ResponsiveContainer>
              {/* Center text */}
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                <span style={{ fontSize:28, fontWeight:900, color:'#10b981', lineHeight:1 }}>{completion.ot}</span>
                <span style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', marginTop:2 }}>OT</span>
              </div>
            </div>
            {/* Legend cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, width:'100%' }}>
              {[
                { key:'OT', label:'Đúng hạn', value:completion.ot, color:'#10b981' },
                { key:'OD', label:'Trễ hạn',  value:completion.od, color:'#f59e0b' },
                { key:'IC', label:'Không HT', value:completion.ic, color:'#ef4444' },
              ].map(c => (
                <div key={c.key} style={{ textAlign:'center', padding:'10px 6px', borderRadius:10, backgroundColor:`${c.color}12`, border:`1.5px solid ${c.color}30` }}>
                  <div style={{ fontSize:22, fontWeight:900, color:c.color, lineHeight:1 }}>{c.value}</div>
                  <div style={{ fontSize:11, fontWeight:800, color:c.color, marginTop:3 }}>{c.key}</div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:1 }}>{c.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Phân bổ trạng thái — Donut đẹp ── */}
        <Section title="Phân bổ trạng thái" sub={`Tổng ${tasks.total} công việc`}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
            <div style={{ position:'relative', width:160, height:160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPie.length > 0 ? statusPie : [{ name:'Chưa có', value:1, color:'#1e293b' }]}
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={72}
                    paddingAngle={statusPie.length > 1 ? 3 : 0}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {(statusPie.length > 0 ? statusPie : [{ color:'#1e293b' }]).map((e,i) => (
                      <Cell key={i} fill={e.color} stroke="none"/>
                    ))}
                  </Pie>
                  <Tooltip content={<SimpleTip/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                <span style={{ fontSize:28, fontWeight:900, color:'#0ea5e9', lineHeight:1 }}>{tasks.total}</span>
                <span style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', marginTop:2 }}>CV</span>
              </div>
            </div>
            {/* Legend list */}
            <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:7 }}>
              {[
                { name:'Chưa bắt đầu', value:tasks.notStarted, color:'#64748b' },
                { name:'Đang thực hiện', value:tasks.inProgress, color:'#f59e0b' },
                { name:'Hoàn thành',    value:tasks.done,       color:'#10b981' },
                { name:'Trễ hạn',       value:tasks.delayed,    color:'#ef4444' },
              ].map(s => (
                <div key={s.name} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:10, height:10, borderRadius:3, backgroundColor:s.color, flexShrink:0 }}/>
                  <span style={{ fontSize:12, color:'var(--text-secondary)', flex:1 }}>{s.name}</span>
                  <span style={{ fontSize:13, fontWeight:800, color:s.color }}>{s.value}</span>
                  <div style={{ width:50, height:5, borderRadius:3, backgroundColor:'var(--bg-hover)', overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:3, backgroundColor:s.color, width:`${tasks.total ? s.value/tasks.total*100 : 0}%` }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Phân bổ loại CV — Bar chart fix hover ── */}
        <Section title={`Phân bổ loại CV — ${catData.reduce((s,c)=>s+c.value,0)} CV`} sub="Số lượng theo category">
          {catData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={catData} margin={{ top:16, right:5, left:-20, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                <XAxis dataKey="name" tick={{ fill:'var(--text-secondary)', fontSize:11, fontWeight:700 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip
                  content={<SimpleTip/>}
                  cursor={{ fill:'rgba(255,255,255,0.04)' }}
                />
                <Bar dataKey="value" radius={[8,8,0,0]} name="Số CV" maxBarSize={60}>
                  {catData.map((e,i) => (
                    <Cell key={i} fill={e.color} stroke="none"/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:13 }}>Chưa có dữ liệu</div>}
        </Section>
      </div>

      {/* Row 4: Thống kê CV bộ phận phụ trách — giữ lại, bỏ "Sự kiện theo bộ phận" trùng */}

      {/* ── Biểu đồ cột đứng: CV theo bộ phận phụ trách ── */}
      <Section title={`Thống kê CV bộ phận phụ trách — ${tasks.total} CV`} sub="Mỗi nhóm có 4 cột nhỏ theo trạng thái · Click cột để xem chi tiết">
        <GroupedBarChart data={deptGrouped} title="bộ phận"/>
      </Section>

      {/* ── Biểu đồ cột đứng: CV theo BGĐ phụ trách ── */}
      <Section title={`Thống kê CV BGĐ phụ trách — ${tasks.total} CV`} sub="Phân công theo lãnh đạo · Click cột để xem chi tiết">
        <GroupedBarChart data={directorGrouped} title="lãnh đạo"/>
      </Section>

      {/* ── Thống kê phụ trách thanh toán — Biểu đồ ── */}
      <Section title="💳 Thống kê phụ trách thanh toán" sub="Tổng quan theo bộ phận · vào trang Phụ trách TT để xem chi tiết">
        {Object.keys(paymentsByDept).length === 0 ? (
          <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)', fontSize:13 }}>
            Chưa có dữ liệu thanh toán
          </div>
        ) : (() => {
          const DEPT_COLORS_PAY = { 'KN&DMST':'#ef4444','Dịch vụ':'#10b981','Hành chính tổng hợp':'#f59e0b','Thông tin thống kê':'#14b8a6','Ban Giám đốc':'#0ea5e9' };
          const allPayments = Object.values(paymentsByDept).flat();
          const totalAll  = allPayments.length;
          const paidAll   = allPayments.filter(p => p.status === 'paid').length;
          const pendingAll = allPayments.filter(p => p.status === 'pending').length;
          const paidAmt   = allPayments.filter(p => p.status === 'paid').reduce((s,p) => s+(parseFloat(p.amount)||0), 0);

          // Data cho grouped bar chart
          const barData = ['KN&DMST', 'Hành chính tổng hợp', 'Thông tin thống kê', 'Dịch vụ']
            .filter(d => paymentsByDept[d]?.length > 0)
            .map(dept => {
              const items = paymentsByDept[dept] || [];
              return {
                name: dept,
                'Đã TT':   items.filter(p => p.status === 'paid').length,
                'Chờ TT':  items.filter(p => p.status === 'pending').length,
                'Đã hủy':  items.filter(p => p.status === 'cancelled').length,
                total: items.length,
                color: DEPT_COLORS_PAY[dept] || '#6366f1',
              };
            });

          // Donut data
          const donutData = [
            { name:'Đã thanh toán', value:paidAll,   color:'#10b981' },
            { name:'Chờ thanh toán', value:pendingAll, color:'#f59e0b' },
          ].filter(d => d.value > 0);

          return (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {/* KPI row */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                {[
                  { label:'Tổng khoản',     value:totalAll,  color:'#0ea5e9', icon:'💳' },
                  { label:'Đã thanh toán',  value:paidAll,   color:'#10b981', icon:'✅' },
                  { label:'Chờ thanh toán', value:pendingAll,color:'#f59e0b', icon:'⏳' },
                  { label:'Tiền đã TT',     value: paidAmt > 0 ? (paidAmt/1000000).toFixed(1)+'M đ' : '—', color:'#8b5cf6', icon:'💰' },
                ].map(k => (
                  <div key={k.label} style={{ padding:'12px 14px', borderRadius:10, backgroundColor:`${k.color}10`, border:`1px solid ${k.color}25`, display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:20 }}>{k.icon}</span>
                    <div>
                      <div style={{ fontSize:20, fontWeight:900, color:k.color, lineHeight:1 }}>{k.value}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{k.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Biểu đồ: Donut bên trái + Grouped bar bên phải */}
              <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:16, alignItems:'center' }}>
                {/* Donut tổng quan */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                  <div style={{ position:'relative', width:160, height:160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={donutData} cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
                          {donutData.map((e,i) => <Cell key={i} fill={e.color} stroke="none"/>)}
                        </Pie>
                        <Tooltip content={<SimpleTip/>}/>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                      <span style={{ fontSize:26, fontWeight:900, color:'#10b981', lineHeight:1 }}>{totalAll > 0 ? Math.round(paidAll/totalAll*100) : 0}%</span>
                      <span style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', marginTop:2 }}>Đã TT</span>
                    </div>
                  </div>
                  <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:6 }}>
                    {donutData.map(d => (
                      <div key={d.name} style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:10, height:10, borderRadius:3, backgroundColor:d.color, flexShrink:0 }}/>
                        <span style={{ fontSize:12, color:'var(--text-secondary)', flex:1 }}>{d.name}</span>
                        <span style={{ fontSize:13, fontWeight:800, color:d.color }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grouped bar chart theo bộ phận */}
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} barCategoryGap="30%" barGap={3} margin={{ top:20, right:10, left:0, bottom:5 }}
                    onClick={d => {
                      if (d?.activeLabel) {
                        const dept = d.activeLabel;
                        const items = paymentsByDept[dept] || [];
                        setPaymentPanel({ dept, items, statusFilter: null });
                      }
                    }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                    <XAxis dataKey="name" tick={{ fill:'var(--text-secondary)', fontSize:11, fontWeight:700 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false}/>
                    <Tooltip content={<SimpleTip/>} cursor={{ fill:'rgba(255,255,255,0.04)' }}/>
                    <Legend wrapperStyle={{ fontSize:11 }} formatter={v => <span style={{ color:'var(--text-secondary)' }}>{v}</span>}/>
                    <Bar dataKey="Đã TT"  fill="#10b981" radius={[5,5,0,0]} maxBarSize={40}
                      onClick={d => { const items = paymentsByDept[d.name]||[]; setPaymentPanel({ dept:d.name, items:items.filter(p=>p.status==='paid'), statusFilter:'paid' }); }}>
                      <LabelList dataKey="Đã TT"  position="top" style={{ fill:'#10b981', fontSize:11, fontWeight:800 }} formatter={v => v > 0 ? v : ''}/>
                    </Bar>
                    <Bar dataKey="Chờ TT" fill="#f59e0b" radius={[5,5,0,0]} maxBarSize={40}
                      onClick={d => { const items = paymentsByDept[d.name]||[]; setPaymentPanel({ dept:d.name, items:items.filter(p=>p.status==='pending'), statusFilter:'pending' }); }}>
                      <LabelList dataKey="Chờ TT" position="top" style={{ fill:'#f59e0b', fontSize:11, fontWeight:800 }} formatter={v => v > 0 ? v : ''}/>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })()}
      </Section>

      {/* Footer summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { label:'Tỷ lệ hoàn thành', value:`${completionRate}%`, color:'#0ea5e9', icon:'📊' },
          { label:'Tổng users',        value:totalUsers,           color:'#8b5cf6', icon:'👥' },
          { label:'OT/Tổng HT',        value: compTotal > 0 ? `${Math.round(completion.ot/compTotal*100)}%` : '—', color:'#10b981', icon:'✅' },
        ].map(s => (
          <div key={s.label} style={{ padding:'14px 18px', borderRadius:12, backgroundColor:'var(--bg-surface)', border:`1px solid ${s.color}20`, display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:24 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize:22, fontWeight:900, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

    </div>

    {/* ── Modal danh sách CV ── */}
    {detailPanel && <DetailPanel/>}

    {/* ── Modal chi tiết thanh toán ── */}
    {paymentPanel && (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setPaymentPanel(null)}>
        <div className="modal-content" style={{ maxWidth:580, maxHeight:'80vh', display:'flex', flexDirection:'column', width:'100%' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, backgroundColor:'var(--bg-surface)', zIndex:10, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:12, height:12, borderRadius:3, backgroundColor:{'KN&DMST':'#ef4444','Dịch vụ':'#10b981','Hành chính tổng hợp':'#f59e0b','Thông tin thống kê':'#14b8a6','Ban Giám đốc':'#0ea5e9'}[paymentPanel.dept]||'#6366f1' }}/>
              <div>
                <div style={{ fontSize:15, fontWeight:900, color:'var(--text-primary)' }}>
                  {paymentPanel.dept} {paymentPanel.statusFilter === 'paid' ? '— Đã thanh toán' : paymentPanel.statusFilter === 'pending' ? '— Chờ thanh toán' : ''}
                </div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{paymentPanel.items.length} khoản</div>
              </div>
            </div>
            <button onClick={() => setPaymentPanel(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}>
              <X size={20}/>
            </button>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:8 }}>
            {paymentPanel.items.length === 0 ? (
              <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)', fontSize:13 }}>Không có khoản nào</div>
            ) : paymentPanel.items.map((item, i) => {
              const stColor = item.status === 'paid' ? '#10b981' : item.status === 'pending' ? '#f59e0b' : '#6b7280';
              const stLabel = item.status === 'paid' ? 'Đã TT' : item.status === 'pending' ? 'Chờ TT' : 'Đã hủy';
              return (
                <div key={item.id || i}
                  onClick={() => setSelectedPayment(item)}
                  style={{ padding:'12px 14px', borderRadius:10, backgroundColor:'var(--bg-hover)', border:`1px solid ${stColor}20`, borderLeft:`3px solid ${stColor}`, cursor:'pointer', transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor='var(--bg-card)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor='var(--bg-hover)'}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', flex:1, marginRight:10 }}>{item.name}</span>
                    <span style={{ fontSize:11, fontWeight:800, padding:'2px 9px', borderRadius:5, backgroundColor:`${stColor}18`, color:stColor, flexShrink:0 }}>{stLabel}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                    {item.assignee && (
                      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <div style={{ width:18, height:18, borderRadius:'50%', backgroundColor:item.assignee.color||'#6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color:'#fff' }}>
                          {item.assignee.name?.charAt(0)}
                        </div>
                        <span style={{ fontSize:11, color:'var(--text-secondary)' }}>{item.assignee.name}</span>
                      </div>
                    )}
                    {item.amount && (
                      <span style={{ fontSize:12, fontWeight:700, color:'#10b981' }}>
                        {Number(item.amount).toLocaleString('vi-VN')} đ
                      </span>
                    )}
                    {item.dueDate && (
                      <span style={{ fontSize:11, color:'var(--text-muted)' }}>
                        📅 {new Date(item.dueDate).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                    {item.paidDate && (
                      <span style={{ fontSize:11, color:'#10b981' }}>
                        ✅ {new Date(item.paidDate).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                  {item.notes && (
                    <div style={{ marginTop:6, fontSize:11, color:'var(--text-muted)', fontStyle:'italic' }}>{item.notes}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )}

    {/* ── TaskDetailModal khi click vào task ── */}
    {selectedTask && (
      <TaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    )}

    {/* ── Modal chi tiết khoản thanh toán ── */}
    {selectedPayment && (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedPayment(null)}>
        <div className="modal-content" style={{ maxWidth:480, width:'100%' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 22px', borderBottom:'1px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18 }}>💳</span>
              <h3 style={{ fontSize:15, fontWeight:800, color:'var(--text-primary)', margin:0 }}>Chi tiết khoản thanh toán</h3>
            </div>
            <button onClick={() => setSelectedPayment(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}>
              <X size={20}/>
            </button>
          </div>
          <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:12 }}>
            {/* Tên khoản */}
            <div style={{ fontSize:16, fontWeight:800, color:'var(--text-primary)', lineHeight:1.4 }}>{selectedPayment.name}</div>
            {/* Trạng thái */}
            <div style={{ display:'flex', gap:8 }}>
              {(() => {
                const stColor = selectedPayment.status==='paid'?'#10b981':selectedPayment.status==='pending'?'#f59e0b':'#6b7280';
                const stLabel = selectedPayment.status==='paid'?'Đã thanh toán':selectedPayment.status==='pending'?'Chờ thanh toán':'Đã hủy';
                return <span style={{ fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:7, backgroundColor:`${stColor}18`, color:stColor }}>{stLabel}</span>;
              })()}
              <span style={{ fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:7, backgroundColor:'rgba(14,165,233,0.12)', color:'#0ea5e9' }}>
                {selectedPayment.department}
              </span>
            </div>
            {/* Chi tiết */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                { label:'Số tiền', value: selectedPayment.amount ? Number(selectedPayment.amount).toLocaleString('vi-VN')+' đ' : '—', color:'#10b981' },
                { label:'Người phụ trách', value: selectedPayment.assignee?.name || '—' },
                { label:'Ngày dự kiến TT', value: selectedPayment.dueDate ? new Date(selectedPayment.dueDate).toLocaleDateString('vi-VN') : '—', color:'#f59e0b' },
                { label:'Ngày đã TT', value: selectedPayment.paidDate ? new Date(selectedPayment.paidDate).toLocaleDateString('vi-VN') : '—', color: selectedPayment.paidDate?'#10b981':undefined },
              ].map(f => (
                <div key={f.label} style={{ padding:'8px 10px', borderRadius:8, backgroundColor:'var(--bg-hover)' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', marginBottom:3 }}>{f.label.toUpperCase()}</div>
                  <div style={{ fontSize:13, fontWeight:600, color: f.color || 'var(--text-primary)' }}>{f.value}</div>
                </div>
              ))}
            </div>
            {selectedPayment.notes && (
              <div style={{ padding:'10px 12px', borderRadius:8, backgroundColor:'var(--bg-hover)', fontSize:13, color:'var(--text-secondary)' }}>
                <strong>Ghi chú:</strong> {selectedPayment.notes}
              </div>
            )}
          </div>
          <div style={{ padding:'12px 22px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end' }}>
            <button onClick={() => setSelectedPayment(null)} className="btn btn-secondary">Đóng</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
