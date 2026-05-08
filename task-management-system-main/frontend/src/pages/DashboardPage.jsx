import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard, CheckCircle, Clock, AlertCircle, TrendingUp,
  ArrowRight, Calendar, BarChart2, Activity, Target, ShieldCheck, ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { statsService, monthlyTaskService, taskService } from '../services/taskService';
import { useAuthStore } from '../store/authStore';
import { MONTHS, STATUS_CONFIG, WORK_CATEGORY, YEARS } from '../utils/constants';
import api from '../services/api';

// ── Vòng tròn tiến độ SVG ──
function RingProgress({ value, size = 80, stroke = 9, color = '#0ea5e9' }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - (Math.min(value, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 1s ease' }}/>
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fontSize={size < 70 ? 13 : 16} fontWeight="900" fill={color}>
        {value}%
      </text>
    </svg>
  );
}

// ── KPI Card ──
function KpiCard({ icon: Icon, label, value, sub, color, onClick, trend }) {
  return (
    <div onClick={onClick} style={{
      backgroundColor: 'var(--bg-surface)', border: `1.5px solid ${color}25`,
      borderRadius: 16, padding: '20px 22px', cursor: onClick ? 'pointer' : 'default',
      position: 'relative', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s'
    }}
      onMouseEnter={e => { if(onClick){ e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 10px 30px ${color}20`; }}}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
    >
      <div style={{ position:'absolute', top:0, right:0, width:80, height:80, borderRadius:'0 16px 0 80px', backgroundColor:`${color}08` }}/>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ width:42, height:42, borderRadius:12, backgroundColor:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={20} color={color}/>
        </div>
        {trend !== undefined && (
          <span style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6,
            backgroundColor: trend >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            color: trend >= 0 ? '#10b981' : '#ef4444' }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontSize:32, fontWeight:900, color:'var(--text-primary)', lineHeight:1, marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)' }}>{label}</div>
      {sub && <div style={{ fontSize:11, fontWeight:700, color, marginTop:3 }}>{sub}</div>}
    </div>
  );
}

// ── Mini progress bar ──
function MiniBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round(value / total * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
        <span style={{ fontSize:13, fontWeight:600, color:'var(--text-secondary)' }}>{label}</span>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:13, fontWeight:800, color }}>{value}</span>
          <span style={{ fontSize:11, color:'var(--text-muted)' }}>{pct}%</span>
        </div>
      </div>
      <div style={{ width:'100%', height:7, borderRadius:4, backgroundColor:'var(--bg-hover)', overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:4, backgroundColor:color, width:`${pct}%`, transition:'width 0.8s ease' }}/>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user }  = useAuthStore();
  const [eventStats,   setEventStats]   = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year,  setYear]  = useState(new Date().getFullYear());

  useEffect(() => {
    setEventStats(null); setMonthlyStats(null);
    Promise.all([
      statsService.getDashboard({ month, year }),
      monthlyTaskService.getStats({ month, year })
    ]).then(([e, m]) => {
      setEventStats(e.data.data);
      setMonthlyStats(m.data.data);
    }).catch(console.error);
  }, [month, year]);

  // Fetch công việc chờ duyệt (tất cả tháng)
  useEffect(() => {
    api.get('/tasks?approvalStatus=pending').then(r => {
      const all = r.data.data || [];
      setPendingTasks(all.filter(t => (t.approvalStatus || 'pending') === 'pending' && t.status !== 'not_started'));
    }).catch(() => {});
  }, []);

  const handleQuickApprove = async (id, action) => {
    try {
      await api.patch(`/tasks/${id}/approve`, { action });
      setPendingTasks(prev => prev.filter(t => t.id !== id));
    } catch(e) { console.error(e); }
  };

  const loading = !eventStats || !monthlyStats;

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Chào buổi sáng' : now.getHours() < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:4 }}>
            {greeting}, <strong style={{ color:'var(--text-primary)' }}>{user?.name}</strong> 👋
          </div>
          <h1 style={{ fontSize:24, fontWeight:900, color:'var(--text-primary)', margin:0 }}>Tổng quan</h1>
          <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>
            Báo cáo tiến độ tháng {month}/{year}
          </p>
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

      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height:110, borderRadius:16, backgroundColor:'var(--bg-hover)', animation:'pulse 1.5s infinite' }}/>)}
        </div>
      ) : (
        <>
          {/* ── Section 1: Sự kiện KPIs ── */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ width:3, height:18, borderRadius:2, background:'linear-gradient(180deg,#6366f1,#0ea5e9)' }}/>
              <span style={{ fontSize:14, fontWeight:800, color:'var(--text-primary)' }}>📋 Sự kiện — Tiến độ tháng {month}/{year}</span>
              <div style={{ flex:1, height:1, backgroundColor:'var(--border)', marginLeft:4 }}/>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:14 }}>
              <KpiCard icon={Target}      label="Tổng công việc"  value={eventStats.tasks.total}      color="#0ea5e9" onClick={() => navigate('/list')} />
              <KpiCard icon={CheckCircle} label="Hoàn thành"      value={eventStats.tasks.done}       color="#10b981" sub={`${eventStats.completionRate}% tỷ lệ`} onClick={() => navigate('/kanban')} />
              <KpiCard icon={Activity}    label="Đang thực hiện"  value={eventStats.tasks.inProgress} color="#f59e0b" onClick={() => navigate('/kanban')} />
              <KpiCard icon={AlertCircle} label="Trễ hạn"         value={eventStats.tasks.delayed}    color="#ef4444" onClick={() => navigate('/kanban')} />
            </div>

            {/* Progress + breakdown */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {/* Tiến độ tổng */}
              <div style={{ backgroundColor:'var(--bg-surface)', border:'1.5px solid var(--border)', borderRadius:16, padding:'20px 22px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:800, color:'var(--text-primary)' }}>Tiến độ hoàn thành</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{eventStats.tasks.done}/{eventStats.tasks.total} công việc</div>
                  </div>
                  <RingProgress value={eventStats.completionRate} color="#10b981"/>
                </div>
                <div style={{ width:'100%', height:8, borderRadius:4, backgroundColor:'var(--bg-hover)', overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:4, background:'linear-gradient(90deg,#0ea5e9,#10b981)', width:`${eventStats.completionRate}%`, transition:'width 1s ease' }}/>
                </div>
                <div style={{ display:'flex', gap:14, marginTop:12, flexWrap:'wrap' }}>
                  {[
                    { label:'Chưa bắt đầu', value:eventStats.tasks.notStarted, color:'#64748b' },
                    { label:'Đang làm',      value:eventStats.tasks.inProgress, color:'#f59e0b' },
                    { label:'Hoàn thành',    value:eventStats.tasks.done,       color:'#10b981' },
                    { label:'Trễ hạn',       value:eventStats.tasks.delayed,    color:'#ef4444' },
                  ].map(s => (
                    <div key={s.label} style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <div style={{ width:7, height:7, borderRadius:'50%', backgroundColor:s.color }}/>
                      <span style={{ fontSize:11, color:'var(--text-muted)' }}>{s.label}: <strong style={{ color:s.color }}>{s.value}</strong></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chất lượng OT/OD/IC */}
              <div style={{ backgroundColor:'var(--bg-surface)', border:'1.5px solid var(--border)', borderRadius:16, padding:'20px 22px' }}>
                <div style={{ fontSize:14, fontWeight:800, color:'var(--text-primary)', marginBottom:14 }}>Chất lượng hoàn thành</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
                  {[
                    { key:'OT', label:'Đúng hạn',    value:eventStats.completion.ot, color:'#10b981', emoji:'✅' },
                    { key:'OD', label:'Trễ hạn',     value:eventStats.completion.od, color:'#f59e0b', emoji:'⚠️' },
                    { key:'IC', label:'Không HT',    value:eventStats.completion.ic, color:'#ef4444', emoji:'❌' },
                  ].map(c => (
                    <div key={c.key} style={{ textAlign:'center', padding:'12px 8px', borderRadius:12, backgroundColor:`${c.color}10`, border:`1px solid ${c.color}25` }}>
                      <div style={{ fontSize:20, marginBottom:4 }}>{c.emoji}</div>
                      <div style={{ fontSize:26, fontWeight:900, color:c.color, lineHeight:1 }}>{c.value}</div>
                      <div style={{ fontSize:11, fontWeight:700, color:c.color, marginTop:3 }}>{c.key}</div>
                      <div style={{ fontSize:10, color:'var(--text-muted)' }}>{c.label}</div>
                    </div>
                  ))}
                </div>
                {[
                  { label:'OT – Đúng hạn', value:eventStats.completion.ot, color:'#10b981' },
                  { label:'OD – Trễ hạn',  value:eventStats.completion.od, color:'#f59e0b' },
                  { label:'IC – Không HT', value:eventStats.completion.ic, color:'#ef4444' },
                ].map(c => {
                  const t = eventStats.completion.ot + eventStats.completion.od + eventStats.completion.ic;
                  return <MiniBar key={c.label} label={c.label} value={c.value} total={t} color={c.color}/>;
                })}
              </div>
            </div>
          </div>

          {/* ── Section 2: Công việc tháng ── */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ width:3, height:18, borderRadius:2, background:'linear-gradient(180deg,#10b981,#34d399)' }}/>
              <span style={{ fontSize:14, fontWeight:800, color:'var(--text-primary)' }}>📅 Công việc hằng tháng</span>
              <div style={{ flex:1, height:1, backgroundColor:'var(--border)', marginLeft:4 }}/>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:14 }}>
              <KpiCard icon={Calendar}    label="Tổng công việc" value={monthlyStats.total} color="#0ea5e9" onClick={() => navigate('/list')} />
              <KpiCard icon={CheckCircle} label="Đúng hạn (OT)"  value={monthlyStats.ot}    color="#10b981" sub={monthlyStats.total > 0 ? `${Math.round(monthlyStats.ot/monthlyStats.total*100)}% tỷ lệ` : ''} onClick={() => navigate('/list')} />
              <KpiCard icon={Clock}       label="Trễ hạn (OD)"   value={monthlyStats.od}    color="#f59e0b" onClick={() => navigate('/list')} />
              <KpiCard icon={AlertCircle} label="Không HT (IC)"  value={monthlyStats.ic}    color="#ef4444" onClick={() => navigate('/list')} />
            </div>

            {/* Tiến độ trung bình */}
            <div style={{ backgroundColor:'var(--bg-surface)', border:'1.5px solid var(--border)', borderRadius:16, padding:'20px 22px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:800, color:'var(--text-primary)' }}>Tiến độ trung bình</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>Tổng hợp {monthlyStats.total} công việc tháng</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                  <RingProgress value={monthlyStats.avgProgress} size={70} stroke={8} color="#0ea5e9"/>
                </div>
              </div>
              <div style={{ width:'100%', height:10, borderRadius:5, backgroundColor:'var(--bg-hover)', overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:5, background:'linear-gradient(90deg,#6366f1,#0ea5e9,#10b981)', width:`${monthlyStats.avgProgress}%`, transition:'width 1s ease' }}/>
              </div>
              <div style={{ display:'flex', gap:20, marginTop:10 }}>
                {[
                  { label:'OT Đúng hạn', value:monthlyStats.ot, color:'#10b981' },
                  { label:'OD Trễ hạn',  value:monthlyStats.od, color:'#f59e0b' },
                  { label:'IC Không HT', value:monthlyStats.ic, color:'#ef4444' },
                  { label:'Chưa xác định', value:monthlyStats.total - monthlyStats.ot - monthlyStats.od - monthlyStats.ic, color:'#64748b' },
                ].map(s => (
                  <div key={s.label} style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', backgroundColor:s.color }}/>
                    <span style={{ fontSize:11, color:'var(--text-muted)' }}>{s.label}: <strong style={{ color:s.color }}>{s.value}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Công việc chờ duyệt ── */}
          {pendingTasks.length > 0 && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <div style={{ width:3, height:18, borderRadius:2, background:'linear-gradient(180deg,#f59e0b,#ef4444)' }}/>
                <span style={{ fontSize:14, fontWeight:800, color:'var(--text-primary)' }}>
                  🔔 Công việc chờ duyệt
                </span>
                <span style={{ fontSize:11, padding:'2px 8px', borderRadius:8, backgroundColor:'rgba(245,158,11,0.15)', color:'#f59e0b', fontWeight:800 }}>
                  {pendingTasks.length}
                </span>
                <div style={{ flex:1, height:1, backgroundColor:'var(--border)', marginLeft:4 }}/>
              </div>
              <div style={{ backgroundColor:'var(--bg-surface)', border:'1.5px solid rgba(245,158,11,0.25)', borderRadius:16, overflow:'hidden' }}>
                {pendingTasks.slice(0, 8).map((task, i) => {
                  const cat = WORK_CATEGORY[task.workCategory];
                  const st  = STATUS_CONFIG[task.status];
                  return (
                    <div key={task.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 18px', borderBottom: i < pendingTasks.length - 1 ? '1px solid var(--border)' : 'none', transition:'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor='var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}>
                      <span style={{ fontFamily:'monospace', fontSize:12, fontWeight:800, color:cat?.color||'#0ea5e9', backgroundColor:`${cat?.color||'#0ea5e9'}15`, padding:'2px 8px', borderRadius:4, flexShrink:0 }}>
                        {task.taskCode}
                      </span>
                      <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {task.taskName}
                      </span>
                      {task.assignee && (
                        <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                          <div style={{ width:22, height:22, borderRadius:'50%', backgroundColor:task.assignee.color||'#6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, color:'#fff' }}>
                            {task.assignee.name?.charAt(0)}
                          </div>
                          <span style={{ fontSize:11, color:'var(--text-muted)' }}>{task.assignee.name}</span>
                        </div>
                      )}
                      <span style={{ fontSize:11, padding:'2px 8px', borderRadius:5, fontWeight:700, backgroundColor:st?.bgHex, color:st?.textHex, flexShrink:0 }}>
                        {st?.label}
                      </span>
                      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                        <button onClick={() => handleQuickApprove(task.id, 'approve')}
                          style={{ padding:'4px 12px', borderRadius:6, border:'none', backgroundColor:'rgba(16,185,129,0.15)', color:'#10b981', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                          <CheckCircle size={12}/> Duyệt
                        </button>
                        <button onClick={() => handleQuickApprove(task.id, 'reject')}
                          style={{ padding:'4px 10px', borderRadius:6, border:'none', backgroundColor:'rgba(239,68,68,0.1)', color:'#ef4444', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                          Từ chối
                        </button>
                      </div>
                    </div>
                  );
                })}
                {pendingTasks.length > 8 && (
                  <div style={{ padding:'10px 18px', textAlign:'center', fontSize:12, color:'var(--text-muted)' }}>
                    + {pendingTasks.length - 8} công việc khác · <button onClick={() => navigate('/list')} style={{ background:'none', border:'none', color:'#0ea5e9', cursor:'pointer', fontWeight:700, fontSize:12 }}>Xem tất cả</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Quick Actions ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {[
              { label:'Xem Kanban', desc:'Quản lý theo cột trạng thái', to:'/kanban', color:'#6366f1', icon:LayoutDashboard },
              { label:'Danh sách CV', desc:'Xem toàn bộ công việc', to:'/list', color:'#0ea5e9', icon:BarChart2 },
              { label:'Báo cáo thống kê', desc:'Phân tích chi tiết', to:'/stats', color:'#10b981', icon:TrendingUp },
            ].map(btn => (
              <button key={btn.to} onClick={() => navigate(btn.to)}
                style={{ padding:'16px 20px', borderRadius:14, border:`1.5px solid ${btn.color}20`,
                  backgroundColor:`${btn.color}08`, cursor:'pointer', textAlign:'left',
                  transition:'all 0.2s', display:'flex', alignItems:'center', gap:14 }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor=`${btn.color}15`; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.borderColor=`${btn.color}40`; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor=`${btn.color}08`; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor=`${btn.color}20`; }}>
                <div style={{ width:40, height:40, borderRadius:11, backgroundColor:`${btn.color}20`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <btn.icon size={18} color={btn.color}/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>{btn.label}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{btn.desc}</div>
                </div>
                <ArrowRight size={16} style={{ color:'var(--text-muted)', opacity:0.5 }}/>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
