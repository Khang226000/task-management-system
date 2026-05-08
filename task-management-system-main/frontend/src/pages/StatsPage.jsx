import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, AlertCircle, TrendingUp, Target, Activity, Users } from 'lucide-react';
import { statsService, monthlyTaskService } from '../services/taskService';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar,
  LineChart, Line, Legend, ComposedChart
} from 'recharts';
import { MONTHS, WORK_CATEGORY, LEAD_DEPT, YEARS } from '../utils/constants';

const DEPT_LABELS = {
  'LD-COM':'Truyền thông','LD-INF':'Thông tin','LD-ADM':'Hành chính',
  'LD-SER':'Dịch vụ','LD-INNO':'KN&ĐMST','LD-BOD':'Ban GĐ'
};

// ── Custom Tooltip — hiện Sự kiện và CV tháng riêng ──
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const eventItems = payload.filter(p => ['Sự kiện','SK Hoàn thành','SK Trễ hạn'].includes(p.name));
  const monthlyItems = payload.filter(p => ['CV tháng','CVT Hoàn thành'].includes(p.name));

  return (
    <div style={{
      backgroundColor:'var(--bg-card)', border:'1px solid var(--border)',
      borderRadius:12, padding:'12px 16px', boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
      minWidth:200, pointerEvents:'none'
    }}>
      <p style={{ color:'var(--text-secondary)', fontSize:11, fontWeight:700, marginBottom:8 }}>{label}</p>

      {eventItems.length > 0 && (
        <div style={{ marginBottom:8 }}>
          <p style={{ fontSize:10, fontWeight:800, color:'#0ea5e9', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>📋 Sự kiện</p>
          {eventItems.map((p,i) => (
            <p key={i} style={{ color:p.color, fontSize:12, fontWeight:700, margin:'2px 0' }}>
              {p.name.replace('SK ','')}:&nbsp;<span style={{ color:'var(--text-primary)' }}>{p.value}</span>
            </p>
          ))}
        </div>
      )}

      {monthlyItems.length > 0 && (
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:8 }}>
          <p style={{ fontSize:10, fontWeight:800, color:'#10b981', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>📅 CV tháng</p>
          {monthlyItems.map((p,i) => (
            <p key={i} style={{ color:p.color, fontSize:12, fontWeight:700, margin:'2px 0' }}>
              {p.name.replace('CVT ','')}:&nbsp;<span style={{ color:'var(--text-primary)' }}>{p.value}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
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

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year,  setYear]  = useState(new Date().getFullYear());

  useEffect(() => {
    setStats(null);
    statsService.getDashboard({ month, year })
      .then(r => setStats(r.data.data))
      .catch(console.error);
  }, [month, year]);

  if (!stats) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:16 }}>
      <div style={{ width:48, height:48, border:'3px solid rgba(14,165,233,0.2)', borderTopColor:'#0ea5e9', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <p style={{ color:'var(--text-muted)', fontSize:13 }}>Đang tải dữ liệu...</p>
    </div>
  );

  const { tasks, completion, byDept, byCategory, byDirector, completionRate, weeklyTrend = [], totalUsers, monthlyTasks = {} } = stats;

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

  const compTotal = completion.ot + completion.od + completion.ic;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color:'var(--text-primary)', margin:0 }}>Báo cáo & Thống kê</h1>
          <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>Phân tích chi tiết tiến độ tháng {month}/{year}</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <select className="select" style={{ width:130 }} value={month} onChange={e => setMonth(parseInt(e.target.value))}>
            {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="select" style={{ width:90 }} value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Row — 4 cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        <KpiCard icon={Target}      label="Tổng công việc"  value={tasks.total}      color="#0ea5e9" sub={`Tháng ${month}/${year}`}/>
        <KpiCard icon={CheckCircle} label="Hoàn thành"      value={tasks.done}       color="#10b981" sub={`${completionRate}% tỷ lệ`} badge={`${completionRate}%`}/>
        <KpiCard icon={Activity}    label="Đang thực hiện"  value={tasks.inProgress} color="#f59e0b" sub="Đang xử lý"/>
        <KpiCard icon={AlertCircle} label="Trễ hạn"         value={tasks.delayed}    color="#ef4444" sub="Cần xử lý ngay"/>
      </div>

      {/* Row 2: Biểu đồ xu hướng theo tuần + Radial */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:14 }}>

        {/* ComposedChart — Sự kiện + CV tháng theo tuần, hover hiện riêng */}
        <Section
          title={`Xu hướng trong tháng ${month}/${year}`}
          sub="Hover để xem chi tiết Sự kiện và CV tháng theo từng tuần">
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={weeklyTrend} margin={{ top:5, right:10, left:-10, bottom:0 }}>
              <defs>
                <linearGradient id="gSK" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gMT" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
              <XAxis dataKey="name" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{ fontSize:11, paddingTop:8 }}
                formatter={(value) => <span style={{ color:'var(--text-secondary)' }}>{value}</span>}/>
              {/* Sự kiện */}
              <Area type="monotone" dataKey="Sự kiện"       stroke="#0ea5e9" strokeWidth={2} fill="url(#gSK)" dot={{ r:4, fill:'#0ea5e9' }}/>
              <Area type="monotone" dataKey="SK Hoàn thành" stroke="#38bdf8" strokeWidth={1.5} fill="none" strokeDasharray="4 2" dot={{ r:3, fill:'#38bdf8' }}/>
              {/* CV tháng */}
              <Area type="monotone" dataKey="CV tháng"       stroke="#10b981" strokeWidth={2} fill="url(#gMT)" dot={{ r:4, fill:'#10b981' }}/>
              <Area type="monotone" dataKey="CVT Hoàn thành" stroke="#34d399" strokeWidth={1.5} fill="none" strokeDasharray="4 2" dot={{ r:3, fill:'#34d399' }}/>
              {/* Trễ hạn bar */}
              <Bar dataKey="SK Trễ hạn" fill="#ef4444" opacity={0.7} radius={[4,4,0,0]} barSize={12}/>
            </ComposedChart>
          </ResponsiveContainer>
        </Section>

        {/* Radial completion */}
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

      {/* Row 3: CV tháng summary + Chất lượng + Loại CV */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>

        {/* CV tháng */}
        <Section title="📅 Công việc hằng tháng" sub={`Tháng ${month}/${year}`}>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {[
                { key:'OT', label:'Đúng hạn', value:monthlyTasks.ot||0, color:'#10b981', emoji:'✅' },
                { key:'OD', label:'Trễ hạn',  value:monthlyTasks.od||0, color:'#f59e0b', emoji:'⚠️' },
                { key:'IC', label:'Không HT', value:monthlyTasks.ic||0, color:'#ef4444', emoji:'❌' },
              ].map(c => (
                <div key={c.key} style={{ textAlign:'center', padding:'10px 6px', borderRadius:10, backgroundColor:`${c.color}10`, border:`1px solid ${c.color}25` }}>
                  <div style={{ fontSize:16, marginBottom:2 }}>{c.emoji}</div>
                  <div style={{ fontSize:22, fontWeight:900, color:c.color, lineHeight:1 }}>{c.value}</div>
                  <div style={{ fontSize:10, fontWeight:700, color:c.color, marginTop:2 }}>{c.key}</div>
                  <div style={{ fontSize:9, color:'var(--text-muted)' }}>{c.label}</div>
                </div>
              ))}
            </div>
            <div style={{ padding:'10px 12px', borderRadius:10, backgroundColor:'var(--bg-hover)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:12, color:'var(--text-secondary)', fontWeight:600 }}>Tổng CV tháng</span>
                <span style={{ fontSize:14, fontWeight:900, color:'#0ea5e9' }}>{monthlyTasks.total||0}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:12, color:'var(--text-secondary)', fontWeight:600 }}>Tiến độ TB</span>
                <span style={{ fontSize:14, fontWeight:900, color:'#10b981' }}>{monthlyTasks.avgProgress||0}%</span>
              </div>
            </div>
          </div>
        </Section>

        {/* Chất lượng OT/OD/IC */}
        <Section title="Chất lượng hoàn thành" sub="OT · OD · IC — Sự kiện">
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={qualityPie.length > 0 ? qualityPie : [{ name:'Chưa có', value:1, color:'#374151' }]}
                  cx="50%" cy="50%" outerRadius={65} paddingAngle={2} dataKey="value">
                  {(qualityPie.length > 0 ? qualityPie : [{ color:'#374151' }]).map((e,i) => <Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip content={<SimpleTip/>}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, width:'100%' }}>
              {[
                { key:'OT', label:'Đúng hạn', value:completion.ot, color:'#10b981' },
                { key:'OD', label:'Trễ hạn',  value:completion.od, color:'#f59e0b' },
                { key:'IC', label:'Không HT', value:completion.ic, color:'#ef4444' },
              ].map(c => (
                <div key={c.key} style={{ textAlign:'center', padding:'8px 4px', borderRadius:8, backgroundColor:`${c.color}10`, border:`1px solid ${c.color}25` }}>
                  <div style={{ fontSize:20, fontWeight:900, color:c.color }}>{c.value}</div>
                  <div style={{ fontSize:10, fontWeight:800, color:c.color }}>{c.key}</div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Pie trạng thái */}
        <Section title="Phân bổ trạng thái" sub={`Tổng ${tasks.total} công việc`}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={statusPie} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                  paddingAngle={3} dataKey="value">
                  {statusPie.map((e,i) => <Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip content={<SimpleTip/>}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:5 }}>
              {statusPie.map(s => (
                <div key={s.name} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', backgroundColor:s.color, flexShrink:0 }}/>
                  <span style={{ fontSize:11, color:'var(--text-muted)', flex:1 }}>{s.name}</span>
                  <span style={{ fontSize:12, fontWeight:800, color:s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>

      {/* Row 4: Bar bộ phận + Bar loại CV */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

        {/* Horizontal bar bộ phận */}
        <Section title="Công việc theo bộ phận" sub="Số lượng CV mỗi bộ phận phụ trách">
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(deptData.length * 46, 160)}>
              <BarChart data={deptData} layout="vertical" barSize={20} margin={{ top:0, right:30, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false}/>
                <XAxis type="number" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="name" tick={{ fill:'var(--text-secondary)', fontSize:12, fontWeight:600 }} axisLine={false} tickLine={false} width={90}/>
                <Tooltip content={<SimpleTip/>} cursor={{ fill:'rgba(255,255,255,0.03)' }}/>
                <Bar dataKey="Số CV" radius={[0,8,8,0]}>
                  {deptData.map((e,i) => <Cell key={i} fill={e.fill}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:13 }}>Chưa có dữ liệu</div>}
        </Section>

        {/* Bar loại CV */}
        <Section title="Phân bổ loại CV" sub="Số lượng theo category">
          {catData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={catData} margin={{ top:5, right:5, left:-20, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                <XAxis dataKey="name" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false}/>
                <Tooltip content={<SimpleTip/>}/>
                <Bar dataKey="value" radius={[6,6,0,0]} name="Số CV">
                  {catData.map((e,i) => <Cell key={i} fill={e.color}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:13 }}>Chưa có dữ liệu</div>}
        </Section>
      </div>

      {/* Summary footer */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { label:'Tỷ lệ tháng này', value:`${completionRate}%`, color:'#0ea5e9', icon:'📊' },
          { label:'Tổng users',       value:totalUsers,           color:'#8b5cf6', icon:'👥' },
          { label:'OT/Tổng HT',       value: compTotal > 0 ? `${Math.round(completion.ot/compTotal*100)}%` : '—', color:'#10b981', icon:'✅' },
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
  );
}
