import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Target, Activity, Filter, X } from 'lucide-react';
import { statsService, userService, monthlyTaskService } from '../services/taskService';
import MonthlyTaskModal from '../components/Tasks/MonthlyTaskModal';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend, LabelList
} from 'recharts';
import { MONTHS, YEARS } from '../utils/constants';
import { useFilterStore } from '../store/filterStore';

const SimpleTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', boxShadow:'0 8px 24px rgba(0,0,0,0.4)' }}>
      {label && <p style={{ color:'var(--text-secondary)', fontSize:11, fontWeight:700, marginBottom:5 }}>{label}</p>}
      {payload.map((p,i) => (
        <p key={i} style={{ color:p.color||p.fill||'#10b981', fontSize:13, fontWeight:800, margin:'2px 0' }}>
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

export default function StatsMonthlyPage() {
  const [stats,     setStats]     = useState(null);
  const [users,     setUsers]     = useState([]);
  // ── Panel chi tiết ──
  const [detailPanel,  setDetailPanel]  = useState(null);
  const [selectedMt,   setSelectedMt]   = useState(null);
  // Danh sách bộ phận từ dữ liệu
  const [deptList, setDeptList] = useState([]);

  // ── Filter từ store (persist qua tab) ──
  const { statsMonthly, setFilter } = useFilterStore();
  const month     = statsMonthly.month;
  const year      = statsMonthly.year;
  const fDept     = statsMonthly.department;
  const fAssignee = statsMonthly.assigneeId;
  const fType     = statsMonthly.taskType;

  const setMonth     = (v) => setFilter('statsMonthly', { month: v });
  const setYear      = (v) => setFilter('statsMonthly', { year: v });
  const setFDept     = (v) => setFilter('statsMonthly', { department: v });
  const setFAssignee = (v) => setFilter('statsMonthly', { assigneeId: v });
  const setFType     = (v) => setFilter('statsMonthly', { taskType: v });

  const hasFilter = fDept || fAssignee || fType;
  const clearFilter = () => setFilter('statsMonthly', { department:'', assigneeId:'', taskType:'' });

  useEffect(() => {
    userService.getUsers().then(r => setUsers(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setStats(null);
    const params = { month, year };
    if (fDept)     params.department = fDept;
    if (fAssignee) params.assigneeId = fAssignee;
    statsService.getDashboard(params)
      .then(r => {
        setStats(r.data.data);
        const depts = (r.data.data.byMtDept || []).map(d => d.department).filter(Boolean);
        setDeptList(depts);
      })
      .catch(console.error);
  }, [month, year, fDept, fAssignee, fType]);

  if (!stats) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:16 }}>
      <div style={{ width:48, height:48, border:'3px solid rgba(16,185,129,0.2)', borderTopColor:'#10b981', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <p style={{ color:'var(--text-muted)', fontSize:13 }}>Đang tải dữ liệu...</p>
    </div>
  );

  const { monthlyTasks = {}, weeklyTrend = [], byMtDept = [], byMtType = [], mtByDept = {}, mtByAssignee = {} } = stats;
  const { total = 0, ot = 0, od = 0, ic = 0, avgProgress = 0 } = monthlyTasks;
  const completionRate = total > 0 ? Math.round((ot / total) * 100) : 0;
  const compTotal = ot + od + ic;

  // ── Màu completion ──
  const COMP_COLORS = { OT:'#10b981', OD:'#f59e0b', IC:'#ef4444' };
  const COMP_LABELS = { OT:'Đúng hạn (OT)', OD:'Trễ hạn (OD)', IC:'Không HT (IC)' };
  const MT_COLORS   = ['#10b981','#0ea5e9','#f59e0b','#8b5cf6','#ef4444','#f97316','#06b6d4','#ec4899'];

  // ── Helper: tạo grouped bar data cho MonthlyTask (dùng completion thay status) ──
  const makeMtGroupedData = (grouped, i0 = 0) =>
    Object.entries(grouped).map(([key, val], i) => {
      const items = Array.isArray(val) ? val : (val.tasks || []);
      const color = (Array.isArray(val) ? null : val.color) || MT_COLORS[(i + i0) % MT_COLORS.length];
      return {
        name: key,
        color,
        total: items.length,
        tasks: items,
        'Đúng hạn (OT)':  items.filter(t => t.completion === 'OT').length,
        'Trễ hạn (OD)':   items.filter(t => t.completion === 'OD').length,
        'Không HT (IC)':  items.filter(t => t.completion === 'IC').length,
        'Chưa xác định':  items.filter(t => !t.completion).length,
      };
    }).filter(d => d.total > 0).sort((a,b) => b.total - a.total);

  const mtDeptGrouped     = makeMtGroupedData(mtByDept);
  const mtAssigneeGrouped = makeMtGroupedData(mtByAssignee);

  // ── Tooltip ──
  const MtGroupedTip = ({ active, payload, label, sourceData }) => {
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

  // ── Grouped bar chart cho MonthlyTask ──
  const MtGroupedBarChart = ({ data }) => {
    if (!data.length) return (
      <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center',
        color:'var(--text-muted)', fontSize:13 }}>Chưa có dữ liệu</div>
    );
    const chartH = Math.max(320, data.length * 60);
    return (
      <ResponsiveContainer width="100%" height={chartH}>
        <BarChart data={data} barCategoryGap="25%" barGap={3}
          margin={{ top:28, right:20, left:0, bottom:40 }}
          onClick={(d) => { if (d?.activeLabel) { const e = data.find(x => x.name === d.activeLabel); if (e) setDetailPanel({ title: e.name, color: e.color, tasks: e.tasks }); } }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
          <XAxis dataKey="name"
            tick={{ fill:'var(--text-secondary)', fontSize:12, fontWeight:700 }}
            axisLine={false} tickLine={false} interval={0}/>
          <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false}/>
          <Tooltip content={<MtGroupedTip sourceData={data}/>} cursor={{ fill:'rgba(255,255,255,0.04)' }}/>
          <Legend wrapperStyle={{ fontSize:11, paddingTop:8 }}
            formatter={v => <span style={{ color:'var(--text-secondary)' }}>{v}</span>}/>
          <Bar dataKey="Đúng hạn (OT)"  fill="#10b981" radius={[5,5,0,0]}
            onClick={(d) => setDetailPanel({ title:`${d.name} — Đúng hạn`, color:'#10b981', tasks: data.find(x=>x.name===d.name)?.tasks.filter(t=>t.completion==='OT')||[] })}>
            <LabelList dataKey="Đúng hạn (OT)"  position="top" style={{ fill:'#10b981', fontSize:11, fontWeight:800 }} formatter={v => v > 0 ? v : ''}/>
          </Bar>
          <Bar dataKey="Trễ hạn (OD)"   fill="#f59e0b" radius={[5,5,0,0]}
            onClick={(d) => setDetailPanel({ title:`${d.name} — Trễ hạn`, color:'#f59e0b', tasks: data.find(x=>x.name===d.name)?.tasks.filter(t=>t.completion==='OD')||[] })}>
            <LabelList dataKey="Trễ hạn (OD)"   position="top" style={{ fill:'#f59e0b', fontSize:11, fontWeight:800 }} formatter={v => v > 0 ? v : ''}/>
          </Bar>
          <Bar dataKey="Không HT (IC)"  fill="#ef4444" radius={[5,5,0,0]}
            onClick={(d) => setDetailPanel({ title:`${d.name} — Không HT`, color:'#ef4444', tasks: data.find(x=>x.name===d.name)?.tasks.filter(t=>t.completion==='IC')||[] })}>
            <LabelList dataKey="Không HT (IC)"  position="top" style={{ fill:'#ef4444', fontSize:11, fontWeight:800 }} formatter={v => v > 0 ? v : ''}/>
          </Bar>
          <Bar dataKey="Chưa xác định"  fill="#64748b" radius={[5,5,0,0]}
            onClick={(d) => setDetailPanel({ title:`${d.name} — Chưa xác định`, color:'#64748b', tasks: data.find(x=>x.name===d.name)?.tasks.filter(t=>!t.completion)||[] })}>
            <LabelList dataKey="Chưa xác định"  position="top" style={{ fill:'#64748b', fontSize:11, fontWeight:800 }} formatter={v => v > 0 ? v : ''}/>
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // ── Modal danh sách CV tháng ──
  const MtDetailPanel = () => {
    if (!detailPanel) return null;
    const { title, color, tasks: taskList } = detailPanel;
    return (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetailPanel(null)}>
        <div className="modal-content" style={{ maxWidth:540, maxHeight:'80vh', display:'flex', flexDirection:'column', width:'100%' }}>
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
          <div style={{ flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:8 }}>
            {taskList.length === 0 ? (
              <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)', fontSize:13 }}>Không có công việc</div>
            ) : taskList.map((t, i) => {
              const cc = COMP_COLORS[t.completion] || '#64748b';
              const cl = COMP_LABELS[t.completion] || 'Chưa xác định';
              return (
                <div key={i}
                  onClick={() => {
                    // Fetch full monthly task rồi mở modal chi tiết
                    monthlyTaskService.getById(t.id)
                      .then(r => setSelectedMt(r.data.data))
                      .catch(() => setSelectedMt(t));
                  }}
                  style={{ padding:'12px 14px', borderRadius:10, cursor:'pointer',
                    backgroundColor:'var(--bg-hover)', border:`1px solid ${cc}20`, borderLeft:`3px solid ${cc}`,
                    transition:'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor='var(--bg-card)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor='var(--bg-hover)'}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:800,
                      color:cc, backgroundColor:`${cc}15`, padding:'2px 7px', borderRadius:4 }}>
                      {t.taskId}
                    </span>
                    <div style={{ display:'flex', gap:5 }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:5,
                        backgroundColor:`${cc}18`, color:cc }}>
                        {cl}
                      </span>
                      <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:5,
                        backgroundColor:'rgba(99,102,241,0.12)', color:'#818cf8' }}>
                        {t.taskType === 'R' ? 'Thường xuyên' : 'Phát sinh'}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', lineHeight:1.4, marginBottom:6 }}>
                    {t.taskName}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ flex:1, height:5, borderRadius:3, backgroundColor:'var(--bg-surface)', overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:3,
                        backgroundColor: t.progress === 100 ? '#10b981' : cc,
                        width:`${t.progress}%` }}/>
                    </div>
                    <span style={{ fontSize:11, fontWeight:800, color:'var(--text-muted)', minWidth:32 }}>
                      {t.progress}%
                    </span>
                    {t.dueDate && (
                      <span style={{ fontSize:10, color:'var(--text-muted)' }}>
                        📅 {new Date(t.dueDate).toLocaleDateString('vi-VN')}
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

  const qualityPie = [
    { name:'OT Đúng hạn', value:ot, color:'#10b981' },
    { name:'OD Trễ hạn',  value:od, color:'#f59e0b' },
    { name:'IC Không HT', value:ic, color:'#ef4444' },
  ].filter(d => d.value > 0);

  const monthlyTrend = weeklyTrend.map(w => ({
    name: w.name,
    'CV tháng':   w['CV tháng'],
    'Hoàn thành': w['CVT Hoàn thành'],
  }));

  // Biểu đồ theo bộ phận
  const deptChartData = byMtDept
    .filter(d => d.department)
    .map(d => ({
      name: d.department,
      'Số CV': parseInt(d.count),
      fill: '#10b981'
    }));

  // Biểu đồ theo loại R/A
  const typeChartData = byMtType.map(t => ({
    name: t.taskType === 'R' ? 'Thường xuyên (R)' : 'Phát sinh (A)',
    value: parseInt(t.count),
    color: t.taskType === 'R' ? '#6366f1' : '#f97316'
  }));

  return (
    <>
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize:22, fontWeight:900, color:'var(--text-primary)', margin:0 }}>
          📅 Thống kê CV hằng tháng
        </h1>
        <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>
          Phân tích chi tiết công việc hằng tháng — tháng {month}/{year}
          {hasFilter && <span style={{ marginLeft:8, fontSize:11, padding:'2px 8px', borderRadius:6, backgroundColor:'rgba(16,185,129,0.15)', color:'#10b981', fontWeight:700 }}>Đang lọc</span>}
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
          {deptList.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Người thực hiện */}
        <select style={{ ...selStyle, width:160 }} value={fAssignee} onChange={e => setFAssignee(e.target.value)}>
          <option value="">Tất cả người thực hiện</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>

        {/* Loại R/A */}
        <select style={{ ...selStyle, width:145 }} value={fType} onChange={e => setFType(e.target.value)}>
          <option value="">Tất cả loại</option>
          <option value="R">R – Thường xuyên</option>
          <option value="A">A – Phát sinh</option>
        </select>

        {hasFilter && (
          <button onClick={clearFilter}
            style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'1px solid var(--border)', backgroundColor:'var(--bg-hover)', color:'var(--text-muted)', cursor:'pointer' }}>
            ✕ Xóa lọc
          </button>
        )}

        <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text-muted)', fontWeight:700 }}>
          Tổng: {total} CV tháng
        </span>
      </div>

      {/* KPI Row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        <KpiCard icon={Target}      label="Tổng CV tháng"  value={total} color="#10b981" sub={`Tháng ${month}/${year}`}/>
        <KpiCard icon={CheckCircle} label="Đúng hạn (OT)"  value={ot}    color="#10b981" badge={`${completionRate}%`} sub={`${completionRate}% tỷ lệ`}/>
        <KpiCard icon={Activity}    label="Trễ hạn (OD)"   value={od}    color="#f59e0b" sub="Cần theo dõi"/>
        <KpiCard icon={AlertCircle} label="Không HT (IC)"  value={ic}    color="#ef4444" sub="Chưa hoàn thành"/>
      </div>

      {/* Row 2: Xu hướng + Radial */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:14 }}>
        <Section title={`Xu hướng CV hằng tháng — tháng ${month}/${year}`} sub="Số lượng CV tháng theo từng tuần">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyTrend} margin={{ top:5, right:10, left:-10, bottom:0 }}>
              <defs>
                <linearGradient id="gMT" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gMD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
              <XAxis dataKey="name" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false}/>
              <Tooltip content={<SimpleTip/>}/>
              <Legend wrapperStyle={{ fontSize:11, paddingTop:8 }}
                formatter={v => <span style={{ color:'var(--text-secondary)' }}>{v}</span>}/>
              <Area type="monotone" dataKey="CV tháng"   stroke="#10b981" strokeWidth={2} fill="url(#gMT)" dot={{ r:4, fill:'#10b981' }}/>
              <Area type="monotone" dataKey="Hoàn thành" stroke="#34d399" strokeWidth={2} fill="url(#gMD)" dot={{ r:4, fill:'#34d399' }}/>
            </AreaChart>
          </ResponsiveContainer>
        </Section>

        <Section title="Tỷ lệ đúng hạn (OT)" sub={`${ot}/${total} CV tháng`}>
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
                <span style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600 }}>Đúng hạn</span>
              </div>
            </div>
            <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:5 }}>
              {[
                { label:'Đúng hạn (OT)', value:ot, color:'#10b981' },
                { label:'Trễ hạn (OD)',  value:od, color:'#f59e0b' },
                { label:'Không HT (IC)', value:ic, color:'#ef4444' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontSize:11, color:'var(--text-muted)' }}>{s.label}</span>
                    <span style={{ fontSize:11, fontWeight:800, color:s.color }}>{s.value}</span>
                  </div>
                  <div style={{ width:'100%', height:4, borderRadius:2, backgroundColor:'var(--bg-hover)', overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:2, backgroundColor:s.color, width:`${total ? s.value/total*100 : 0}%`, transition:'width 0.8s ease' }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>

      {/* Row 3: Pie chất lượng + Loại R/A + Tổng kết */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>

        {/* ── Phân bổ chất lượng — Donut đẹp ── */}
        <Section title="Phân bổ chất lượng" sub="OT · OD · IC">
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
            <div style={{ position:'relative', width:160, height:160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={qualityPie.length > 0 ? qualityPie : [{ name:'Chưa có', value:1, color:'#1e293b' }]}
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={72}
                    paddingAngle={qualityPie.length > 1 ? 3 : 0}
                    dataKey="value" strokeWidth={0}
                  >
                    {(qualityPie.length > 0 ? qualityPie : [{ color:'#1e293b' }]).map((e,i) => (
                      <Cell key={i} fill={e.color} stroke="none"/>
                    ))}
                  </Pie>
                  <Tooltip content={<SimpleTip/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                <span style={{ fontSize:28, fontWeight:900, color:'#10b981', lineHeight:1 }}>{ot}</span>
                <span style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', marginTop:2 }}>OT</span>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, width:'100%' }}>
              {[
                { key:'OT', label:'Đúng hạn', value:ot, color:'#10b981' },
                { key:'OD', label:'Trễ hạn',  value:od, color:'#f59e0b' },
                { key:'IC', label:'Không HT', value:ic, color:'#ef4444' },
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

        {/* ── Loại R/A — Donut đẹp ── */}
        <Section title="Phân bổ loại nhiệm vụ" sub="Thường xuyên (R) · Phát sinh (A)">
          {typeChartData.length > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
              <div style={{ position:'relative', width:160, height:160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeChartData}
                      cx="50%" cy="50%"
                      innerRadius={52} outerRadius={72}
                      paddingAngle={typeChartData.length > 1 ? 4 : 0}
                      dataKey="value" strokeWidth={0}
                    >
                      {typeChartData.map((e,i) => <Cell key={i} fill={e.color} stroke="none"/>)}
                    </Pie>
                    <Tooltip content={<SimpleTip/>}/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                  <span style={{ fontSize:28, fontWeight:900, color:'#6366f1', lineHeight:1 }}>{total}</span>
                  <span style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', marginTop:2 }}>CV</span>
                </div>
              </div>
              <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:8 }}>
                {typeChartData.map(t => (
                  <div key={t.name} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:10, height:10, borderRadius:3, backgroundColor:t.color, flexShrink:0 }}/>
                    <span style={{ fontSize:12, color:'var(--text-secondary)', flex:1 }}>{t.name}</span>
                    <span style={{ fontSize:13, fontWeight:800, color:t.color }}>{t.value}</span>
                    <div style={{ width:50, height:5, borderRadius:3, backgroundColor:'var(--bg-hover)', overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:3, backgroundColor:t.color, width:`${total ? t.value/total*100 : 0}%` }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:13 }}>Chưa có dữ liệu</div>}
        </Section>

        {/* Tổng kết */}
        <Section title="Tổng kết" sub={`Tháng ${month}/${year}`}>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { label:'Tổng CV tháng',   value:total,       color:'#0ea5e9', emoji:'📋' },
              { label:'Đúng hạn (OT)',   value:ot,          color:'#10b981', emoji:'✅' },
              { label:'Trễ hạn (OD)',    value:od,          color:'#f59e0b', emoji:'⚠️' },
              { label:'Không HT (IC)',   value:ic,          color:'#ef4444', emoji:'❌' },
              { label:'Tiến độ TB',      value:`${avgProgress}%`, color:'#8b5cf6', emoji:'📈' },
              { label:'Tỷ lệ OT',        value: compTotal > 0 ? `${Math.round(ot/compTotal*100)}%` : '—', color:'#10b981', emoji:'🎯' },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', borderRadius:8, backgroundColor:'var(--bg-hover)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:14 }}>{s.emoji}</span>
                  <span style={{ fontSize:12, color:'var(--text-secondary)', fontWeight:600 }}>{s.label}</span>
                </div>
                <span style={{ fontSize:14, fontWeight:900, color:s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Row 4: CV tháng theo bộ phận — grouped bar */}
      <Section title={`CV hằng tháng theo bộ phận — ${total} CV`} sub="Mỗi nhóm có 4 cột theo mức hoàn thành · Click cột để xem chi tiết">
        <MtGroupedBarChart data={mtDeptGrouped}/>
      </Section>

      {/* Row 5: CV tháng theo người thực hiện */}
      <Section title={`CV hằng tháng theo người thực hiện — ${total} CV`} sub="Phân công theo nhân viên · Click cột để xem chi tiết">
        <MtGroupedBarChart data={mtAssigneeGrouped}/>
      </Section>

      {/* ── Tiến độ trung bình — thiết kế lại đẹp ── */}
      <div style={{ padding:'20px 24px', borderRadius:16, backgroundColor:'var(--bg-surface)', border:'1px solid var(--border)' }}>
        <div style={{ fontSize:14, fontWeight:800, color:'var(--text-primary)', marginBottom:16 }}>
          📈 Tiến độ trung bình — tháng {month}/{year}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:24, alignItems:'center' }}>
          {/* Donut lớn */}
          <div style={{ position:'relative', width:140, height:140, flexShrink:0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { value: avgProgress, color: avgProgress >= 80 ? '#10b981' : avgProgress >= 50 ? '#0ea5e9' : '#f59e0b' },
                    { value: 100 - avgProgress, color: 'rgba(255,255,255,0.05)' }
                  ]}
                  cx="50%" cy="50%"
                  innerRadius={48} outerRadius={65}
                  startAngle={90} endAngle={-270}
                  dataKey="value" strokeWidth={0}
                >
                  {[
                    { color: avgProgress >= 80 ? '#10b981' : avgProgress >= 50 ? '#0ea5e9' : '#f59e0b' },
                    { color: 'rgba(255,255,255,0.05)' }
                  ].map((e,i) => <Cell key={i} fill={e.color} stroke="none"/>)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
              <span style={{ fontSize:30, fontWeight:900, lineHeight:1,
                color: avgProgress >= 80 ? '#10b981' : avgProgress >= 50 ? '#0ea5e9' : '#f59e0b' }}>
                {avgProgress}%
              </span>
              <span style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', marginTop:3 }}>TB</span>
            </div>
          </div>

          {/* Chi tiết */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontSize:13, color:'var(--text-muted)' }}>
              Trung bình tiến độ của <strong style={{ color:'var(--text-primary)' }}>{total}</strong> công việc hằng tháng
            </div>
            {/* Progress bar lớn */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:12, color:'var(--text-muted)' }}>Tiến độ tổng thể</span>
                <span style={{ fontSize:13, fontWeight:800, color: avgProgress >= 80 ? '#10b981' : avgProgress >= 50 ? '#0ea5e9' : '#f59e0b' }}>
                  {avgProgress}%
                </span>
              </div>
              <div style={{ width:'100%', height:12, borderRadius:6, backgroundColor:'var(--bg-hover)', overflow:'hidden' }}>
                <div style={{
                  height:'100%', borderRadius:6,
                  width:`${avgProgress}%`,
                  background: avgProgress >= 80
                    ? 'linear-gradient(90deg,#10b981,#34d399)'
                    : avgProgress >= 50
                      ? 'linear-gradient(90deg,#0ea5e9,#38bdf8)'
                      : 'linear-gradient(90deg,#f59e0b,#fbbf24)',
                  transition:'width 0.8s ease',
                  boxShadow: `0 0 10px ${avgProgress >= 80 ? '#10b98160' : avgProgress >= 50 ? '#0ea5e960' : '#f59e0b60'}`
                }}/>
              </div>
            </div>
            {/* Mốc */}
            <div style={{ display:'flex', gap:12 }}>
              {[
                { label:'Thấp', range:'0–49%', color:'#f59e0b', active: avgProgress < 50 },
                { label:'Trung bình', range:'50–79%', color:'#0ea5e9', active: avgProgress >= 50 && avgProgress < 80 },
                { label:'Tốt', range:'80–100%', color:'#10b981', active: avgProgress >= 80 },
              ].map(m => (
                <div key={m.label} style={{ flex:1, padding:'8px 10px', borderRadius:8,
                  backgroundColor: m.active ? `${m.color}15` : 'var(--bg-hover)',
                  border: `1.5px solid ${m.active ? m.color+'50' : 'transparent'}`,
                  textAlign:'center' }}>
                  <div style={{ fontSize:12, fontWeight:800, color: m.active ? m.color : 'var(--text-muted)' }}>{m.label}</div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>{m.range}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>

    {/* Modal danh sách CV tháng */}
    {detailPanel && <MtDetailPanel/>}

    {/* Modal chi tiết CV tháng khi click vào item */}
    {selectedMt && (
      <MonthlyTaskModal
        task={selectedMt}
        onClose={() => setSelectedMt(null)}
        onSaved={() => { setSelectedMt(null); }}
      />
    )}
    </>
  );
}
