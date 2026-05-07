import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Users, Calendar, AlertTriangle, Filter,
  ChevronDown, CheckCircle
} from 'lucide-react';
import { taskService, monthlyTaskService } from '../services/taskService';
import { useAuthStore } from '../store/authStore';
import { STATUS_CONFIG, WORK_CATEGORY, MONTHS, YEARS } from '../utils/constants';
import { format } from 'date-fns';
import TaskDetailModal from '../components/Tasks/TaskDetailModal';
import api from '../services/api';
import { useFilterStore } from '../store/filterStore';

// ── Safe date formatter ──
function safeFormat(d, fmt = 'd/M/yyyy') {
  if (!d) return '';
  try {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? '' : format(dt, fmt);
  } catch { return ''; }
}

// ── Progress color ──
function progressColor(p) {
  if (p === 100) return '#10b981';
  if (p >= 70)   return '#0ea5e9';
  if (p >= 40)   return '#f59e0b';
  return '#ef4444';
}

// ── Progress bar ──
function ProgressBar({ value, height = 8 }) {
  const color = progressColor(value);
  return (
    <div style={{ width: '100%', height, borderRadius: height / 2, backgroundColor: 'var(--bg-hover)', overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: height / 2,
        width: `${Math.min(100, Math.max(0, value))}%`,
        background: value === 100
          ? 'linear-gradient(90deg,#10b981,#34d399)'
          : `linear-gradient(90deg,${color},${color}cc)`,
        transition: 'width 0.4s ease',
        boxShadow: `0 0 8px ${color}60`
      }} />
    </div>
  );
}

// ── Inline select helper ──
function Sel({ value, onChange, width = 130, children }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width, appearance: 'none', fontSize: 12, borderRadius: 8,
          paddingLeft: 10, paddingRight: 22, paddingTop: 5, paddingBottom: 5,
          border: '1.5px solid var(--border)', cursor: 'pointer',
          backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)', outline: 'none'
        }}
      >
        {children}
      </select>
      <ChevronDown size={11} style={{
        position: 'absolute', right: 6, top: '50%',
        transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)'
      }} />
    </div>
  );
}

// ── Completion badge styles ──
const COMPLETION_STYLE = {
  OT: { label: 'OT – Đúng hạn',        color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  OD: { label: 'OD – Trễ hạn',         color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  IC: { label: 'IC – Không hoàn thành', color: '#ef4444', bg: 'rgba(239,68,68,0.15)'  },
};

// ── Stat card ──
function StatCard({ label, value, color, icon }) {
  return (
    <div style={{
      flex: 1, minWidth: 100,
      backgroundColor: 'var(--bg-surface)',
      border: `1.5px solid ${color}30`,
      borderRadius: 12, padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 10
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, flexShrink: 0
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  );
}

// ── Event task card (readonly for member) ──
function EventTaskCard({ task, onClick }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dl     = task.extendedDeadline || task.deadline;
  const dlDate = dl ? new Date(dl) : null;
  const isOverdue  = dlDate && dlDate < today && task.status !== 'done';
  const isDueToday = dlDate && dlDate.getTime() === today.getTime() && task.status !== 'done';

  const category  = WORK_CATEGORY[task.workCategory];
  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.not_started;
  const borderColor = isOverdue ? '#ef4444' : isDueToday ? '#f59e0b' : 'var(--border)';

  // Assignee avatar
  const assignee = task.assignee;
  const initials = assignee?.name ? assignee.name.charAt(0).toUpperCase() : '?';
  const avatarColor = assignee?.color || '#6366f1';

  return (
    <div
      onClick={() => onClick(task)}
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: `1.5px solid ${borderColor}`,
        borderRadius: 14, marginBottom: 10, overflow: 'hidden',
        boxShadow: isOverdue ? '0 0 0 3px rgba(239,68,68,0.08)' : 'none',
        cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isOverdue ? '0 0 0 3px rgba(239,68,68,0.08)' : 'none';
      }}
    >
      {/* Category color bar */}
      <div style={{ height: 3, backgroundColor: category?.color || '#0ea5e9', width: '100%' }} />

      <div style={{ padding: '14px 16px' }}>
        {/* Top row: code + status + deadline warning */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 11, fontFamily: 'monospace', fontWeight: 900,
            color: category?.color || '#0ea5e9',
            backgroundColor: `${category?.color || '#0ea5e9'}15`,
            padding: '2px 8px', borderRadius: 5
          }}>
            {task.taskCode}
          </span>
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 5, fontWeight: 700,
            backgroundColor: statusCfg.bgHex,
            color: statusCfg.textHex
          }}>
            {statusCfg.label}
          </span>
          {isOverdue && (
            <span style={{
              fontSize: 11, padding: '2px 7px', borderRadius: 5, fontWeight: 800,
              backgroundColor: '#ef444420', color: '#ef4444',
              display: 'flex', alignItems: 'center', gap: 3
            }}>
              <AlertTriangle size={10} /> Quá hạn
            </span>
          )}
          {isDueToday && (
            <span style={{
              fontSize: 11, padding: '2px 7px', borderRadius: 5, fontWeight: 800,
              backgroundColor: '#f59e0b20', color: '#f59e0b'
            }}>
              ⏰ Hôm nay
            </span>
          )}
          {dl && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Calendar size={10} /> {safeFormat(dl)}
            </span>
          )}
        </div>

        {/* Task name */}
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, lineHeight: 1.4 }}>
          {task.taskName}
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Tiến độ</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: progressColor(task.progress || 0) }}>
              {task.progress || 0}%
            </span>
          </div>
          <ProgressBar value={task.progress || 0} height={8} />
        </div>

        {/* Assignee */}
        {assignee && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              backgroundColor: avatarColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0
            }}>
              {initials}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
              {assignee.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Monthly task card (click to open detail) ──
function MonthlyTaskCard({ task, onClick }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dl     = task.extendedDueDate || task.dueDate;
  const dlDate = dl ? new Date(dl) : null;
  const isOverdue  = dlDate && dlDate < today && !task.completion;
  const isDueToday = dlDate && dlDate.getTime() === today.getTime() && !task.completion;

  const typeColor = task.taskType === 'R' ? '#6366f1' : '#f97316';
  const comp = task.completion ? COMPLETION_STYLE[task.completion] : null;

  const assignee = task.assignee;
  const initials = assignee?.name ? assignee.name.charAt(0).toUpperCase() : '?';

  return (
    <div
      onClick={() => onClick && onClick(task)}
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: `1.5px solid ${isOverdue ? '#ef4444' : isDueToday ? '#f59e0b' : 'var(--border)'}`,
        borderRadius: 14, marginBottom: 10, overflow: 'hidden',
        boxShadow: isOverdue ? '0 0 0 3px rgba(239,68,68,0.08)' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s'
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.18)'; } }}
      onMouseLeave={e => { if (onClick) { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=isOverdue?'0 0 0 3px rgba(239,68,68,0.08)':'none'; } }}
    >
      {/* Type color bar */}
      <div style={{ height: 3, backgroundColor: typeColor, width: '100%' }} />

      <div style={{ padding: '14px 16px' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 11, fontFamily: 'monospace', fontWeight: 900,
            color: typeColor, backgroundColor: `${typeColor}15`,
            padding: '2px 8px', borderRadius: 5
          }}>
            {task.taskId}
          </span>
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 5, fontWeight: 700,
            backgroundColor: task.taskType === 'R' ? 'rgba(99,102,241,0.15)' : 'rgba(249,115,22,0.15)',
            color: typeColor
          }}>
            {task.taskType === 'R' ? 'Thường xuyên' : 'Phát sinh'}
          </span>
          {comp && (
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 5, fontWeight: 800,
              backgroundColor: comp.bg, color: comp.color
            }}>
              {comp.label}
            </span>
          )}
          {isOverdue && (
            <span style={{
              fontSize: 11, padding: '2px 7px', borderRadius: 5, fontWeight: 800,
              backgroundColor: '#ef444420', color: '#ef4444',
              display: 'flex', alignItems: 'center', gap: 3
            }}>
              <AlertTriangle size={10} /> Quá hạn
            </span>
          )}
          {isDueToday && (
            <span style={{
              fontSize: 11, padding: '2px 7px', borderRadius: 5, fontWeight: 800,
              backgroundColor: '#f59e0b20', color: '#f59e0b'
            }}>
              ⏰ Hôm nay
            </span>
          )}
          {dl && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Calendar size={10} /> {safeFormat(dl)}
            </span>
          )}
        </div>

        {/* Task name */}
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, lineHeight: 1.4 }}>
          {task.taskName}
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Tiến độ</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: progressColor(task.progress || 0) }}>
              {task.progress || 0}%
            </span>
          </div>
          <ProgressBar value={task.progress || 0} height={8} />
        </div>

        {/* Assignee */}
        {assignee && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              backgroundColor: assignee.color || '#6366f1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0
            }}>
              {initials}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
              {assignee.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Simple Monthly Task Modal ──────────────────────────────
function SimpleMonthlyModal({ task, onClose }) {
  const typeColor = task.taskType === 'R' ? '#6366f1' : '#f97316';
  const comp = task.completion ? COMPLETION_STYLE[task.completion] : null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 520, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 900, color: typeColor, backgroundColor: `${typeColor}15`, padding: '3px 10px', borderRadius: 6 }}>{task.taskId}</span>
            {comp && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6, backgroundColor: comp.bg, color: comp.color }}>{comp.label}</span>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.4 }}>{task.taskName}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Bộ phận',         value: task.department || '—' },
              { label: 'Loại',            value: task.taskType === 'R' ? 'Thường xuyên' : 'Phát sinh' },
              { label: 'Ngày bắt đầu',   value: task.startDate ? new Date(task.startDate).toLocaleDateString('vi-VN') : '—' },
              { label: 'Ngày kết thúc',  value: task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : '—' },
              { label: 'Gia hạn',        value: task.extendedDueDate ? new Date(task.extendedDueDate).toLocaleDateString('vi-VN') : '—' },
              { label: 'Người thực hiện', value: task.assignee?.name || '—' },
            ].map(f => (
              <div key={f.label} style={{ padding: '8px 10px', borderRadius: 8, backgroundColor: 'var(--bg-hover)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 3 }}>{f.label.toUpperCase()}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{f.value}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Tiến độ: {task.progress}%</div>
            <div style={{ width: '100%', height: 10, borderRadius: 5, backgroundColor: 'var(--bg-hover)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 5, width: `${task.progress}%`, backgroundColor: task.progress === 100 ? '#10b981' : '#0ea5e9', transition: 'width 0.4s' }}/>
            </div>
          </div>
          {task.notes && (
            <div style={{ padding: '10px 12px', borderRadius: 8, backgroundColor: 'var(--bg-hover)', fontSize: 13, color: 'var(--text-secondary)' }}>
              <strong>Ghi chú:</strong> {task.notes}
            </div>
          )}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary">Đóng</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════════════════════════
export default function TeamTasksPage() {
  const { user } = useAuthStore();
  const { monthly, setFilter } = useFilterStore();

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'monthly'

  // ── Filter state — tách riêng cho events và monthly (không dùng chung) ──
  const now = new Date();
  const [eventMonth,  setEventMonth]  = useState(now.getMonth() + 1);
  const [eventYear,   setEventYear]   = useState(now.getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState(now.getMonth() + 1);
  const [monthlyYear,  setMonthlyYear]  = useState(now.getFullYear());

  const month = activeTab === 'monthly' ? monthlyMonth : eventMonth;
  const year  = activeTab === 'monthly' ? monthlyYear  : eventYear;
  const setMonth = (v) => { const n = parseInt(v); activeTab === 'monthly' ? setMonthlyMonth(n) : setEventMonth(n); };
  const setYear  = (v) => { const n = parseInt(v); activeTab === 'monthly' ? setMonthlyYear(n)  : setEventYear(n); };

  const filterStatus     = monthly.completion || '';
  const filterDepartment = monthly.department || '';
  const setFilterStatus     = (v) => setFilter('monthly', { completion: v });
  const setFilterDepartment = (v) => setFilter('monthly', { department: v });

  // ── Data state ──
  const [eventTasks,    setEventTasks]    = useState([]);
  const [monthlyTasks,  setMonthlyTasks]  = useState([]);
  const [allDepts,      setAllDepts]      = useState([]);
  const [loading,       setLoading]       = useState(false);

  // ── Modal state ──
  const [selectedTask,    setSelectedTask]    = useState(null);
  const [selectedMonthly, setSelectedMonthly] = useState(null);
  const [searchText,      setSearchText]      = useState('');

  // ── User's department ──
  const userDept = user?.department || '';

  // ── Fetch event tasks for team (same leadDepartment as user's department) ──
  const fetchEventTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { month, year };
      // Map user department to leadDepartment code if possible
      // The user.department is a string like "Truyền thông", "Hành chính", etc.
      // leadDepartment in tasks is like "LD-COM", "LD-ADM", etc.
      // We fetch all tasks and filter client-side by department name match,
      // OR if user has a leadDepartment-style dept, filter directly.
      // Strategy: fetch all tasks for the month/year, then filter by matching department
      if (filterStatus) params.status = filterStatus;

      const res = await taskService.getTasks(params);
      let tasks = res.data.data || [];

      // Filter by user's department — match against leadDepartment label or user dept string
      if (userDept) {
        // Build a mapping from department name to leadDepartment code
        const DEPT_MAP = {
          'Hành chính tổng hợp': 'LD-ADM',
            'Thông tin thống kê': 'LD-INF',
            'Dịch vụ': 'LD-SER',
            'KN&DMST': 'LD-INNO',
            'Ban Giám đốc': 'LD-BOD',
        };
        const ldCode = DEPT_MAP[userDept] || userDept;
        tasks = tasks.filter(t =>
          t.leadDepartment === ldCode ||
          t.leadDepartment === userDept
        );
      }

      // Apply department filter from filter bar
      if (filterDepartment) {
        tasks = tasks.filter(t => t.leadDepartment === filterDepartment);
      }

      setEventTasks(tasks);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [month, year, filterStatus, filterDepartment, userDept]);

  // ── Fetch monthly tasks for team ──
  const fetchMonthlyTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { month, year };
      if (userDept)         params.department = userDept;
      if (filterDepartment) params.department = filterDepartment;
      if (filterStatus)     params.completion = filterStatus;

      const res = await monthlyTaskService.getTasks(params);
      setMonthlyTasks(res.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [month, year, filterStatus, filterDepartment, userDept]);

  // ── Fetch activity logs — chỉ của bản thân (giữ lại để không break state) ──
  const fetchLogs = useCallback(async () => {
    // Tab history đã chuyển sang trang riêng — không cần fetch nữa
  }, []);

  // ── Fetch all departments for filter dropdown ──
  const fetchDepts = useCallback(async () => {
    try {
      const res = await monthlyTaskService.getTasks({ month, year });
      const depts = [...new Set((res.data.data || []).map(t => t.department).filter(Boolean))];
      setAllDepts(depts);
    } catch (e) {}
  }, [month, year]);

  // ── Trigger fetches on tab change / filter change ──
  useEffect(() => {
    if (activeTab === 'events')  fetchEventTasks();
  }, [activeTab, fetchEventTasks]);

  useEffect(() => {
    if (activeTab === 'monthly') fetchMonthlyTasks();
  }, [activeTab, fetchMonthlyTasks]);

  useEffect(() => { fetchDepts(); }, [fetchDepts]);

  // ── Stats computation ──
  const stats = useMemo(() => {
    if (activeTab === 'events') {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const total     = eventTasks.length;
      const done      = eventTasks.filter(t => t.status === 'done').length;
      const inProg    = eventTasks.filter(t => t.status === 'in_progress').length;
      const overdue   = eventTasks.filter(t => {
        const dl = t.extendedDeadline || t.deadline;
        return dl && new Date(dl) < today && t.status !== 'done';
      }).length;
      return { total, done, inProg, overdue };
    }
    if (activeTab === 'monthly') {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const total   = monthlyTasks.length;
      const done    = monthlyTasks.filter(t => t.completion === 'OT').length;
      const inProg  = monthlyTasks.filter(t => !t.completion && (t.progress || 0) > 0).length;
      const overdue = monthlyTasks.filter(t => {
        const dl = t.extendedDueDate || t.dueDate;
        return dl && new Date(dl) < today && !t.completion;
      }).length;
      return { total, done, inProg, overdue };
    }
    return { total: 0, done: 0, inProg: 0, overdue: 0 };
  }, [activeTab, eventTasks, monthlyTasks]);

  // ── Filter bar visibility: only for events and monthly tabs ──
  const showFilterBar = activeTab === 'events' || activeTab === 'monthly';

  // ── Search normalize ──
  const normVN = (s) => (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
  const matchKw = (task, kw) => {
    if (!kw) return true;
    const n = normVN(kw);
    return normVN(task.taskName).includes(n) || normVN(task.taskCode||task.taskId).includes(n) || normVN(task.assignee?.name).includes(n);
  };

  const filteredEvents  = eventTasks.filter(t => matchKw(t, searchText));
  const filteredMonthly = monthlyTasks.filter(t => matchKw(t, searchText));

  // ── Has active filter ──
  const hasFilter = filterStatus || filterDepartment;

  const clearFilters = () => {
    setFilter('monthly', { completion: '', department: '' });
  };

  // ── Tab config ──
  const TABS = [
    { id: 'events',  label: 'Sự kiện',       icon: <Calendar size={14} /> },
    { id: 'monthly', label: 'CV hằng tháng', icon: <CheckCircle size={14} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={20} style={{ color: '#0ea5e9' }} />
            Công việc nhóm
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {userDept ? `Bộ phận: ${userDept}` : 'Theo dõi công việc của nhóm'}
          </p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', gap: 4,
        backgroundColor: 'var(--bg-surface)',
        border: '1.5px solid var(--border)',
        borderRadius: 12, padding: 4
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
              backgroundColor: activeTab === tab.id ? '#0ea5e9' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
              boxShadow: activeTab === tab.id ? '0 2px 10px rgba(14,165,233,0.35)' : 'none'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Filter bar ── */}
      {showFilterBar && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          padding: '10px 14px',
          backgroundColor: 'var(--bg-surface)',
          border: '1.5px solid var(--border)',
          borderRadius: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
            <Filter size={13} />
            <span style={{ fontWeight: 700 }}>Lọc:</span>
          </div>

          {/* Month */}
          <Sel value={month} onChange={setMonth} width={120}>
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </Sel>

          {/* Year */}
          <Sel value={year} onChange={setYear} width={80}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </Sel>

          <div style={{ width: 1, height: 18, backgroundColor: 'var(--border)', margin: '0 2px' }} />

          {/* Status filter */}
          {activeTab === 'events' ? (
            <Sel value={filterStatus} onChange={setFilterStatus} width={150}>
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </Sel>
          ) : (
            <Sel value={filterStatus} onChange={setFilterStatus} width={160}>
              <option value="">Tất cả hoàn thành</option>
              <option value="OT">OT – Đúng hạn</option>
              <option value="OD">OD – Trễ hạn</option>
              <option value="IC">IC – Không HT</option>
            </Sel>
          )}

          {/* Department filter */}
          <Sel value={filterDepartment} onChange={setFilterDepartment} width={160}>
            <option value="">Tất cả bộ phận</option>
            {allDepts.map(d => <option key={d} value={d}>{d}</option>)}
          </Sel>

          {/* Clear filters */}
          {hasFilter && (
            <button
              onClick={clearFilters}
              style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 6,
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)', cursor: 'pointer'
              }}
            >
              ✕ Xóa lọc
            </button>
          )}

          {/* Search box */}
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Tìm kiếm công việc..."
              value={searchText} onChange={e => setSearchText(e.target.value)}
              style={{ width:'100%', paddingLeft:28, paddingRight:10, paddingTop:5, paddingBottom:5,
                fontSize:12, borderRadius:8,
                border:`1.5px solid ${searchText ? '#0ea5e9' : 'var(--border)'}`,
                backgroundColor:'var(--bg-input)', color:'var(--text-primary)', outline:'none',
                boxSizing:'border-box', boxShadow: searchText ? '0 0 0 3px rgba(14,165,233,0.12)' : 'none' }}/>
          </div>

          {/* Count */}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
            {activeTab === 'events' ? eventTasks.length : monthlyTasks.length} CV
          </span>
        </div>
      )}

      {/* ── Stats bar ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <StatCard label="Tổng cộng"     value={stats.total}  color="#0ea5e9" icon="📋" />
        <StatCard label="Hoàn thành"    value={stats.done}   color="#10b981" icon="✅" />
        <StatCard label="Đang thực hiện" value={stats.inProg} color="#f59e0b" icon="⚡" />
        <StatCard label="Quá hạn"       value={stats.overdue} color="#ef4444" icon="⚠️" />
      </div>

      {/* ── Tab content ── */}
      {loading ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 60, color: 'var(--text-muted)', fontSize: 14
        }}>
          <div style={{
            width: 28, height: 28, border: '3px solid var(--border)',
            borderTopColor: '#0ea5e9', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', marginRight: 12
          }} />
          Đang tải dữ liệu...
        </div>
      ) : (
        <>
          {/* ── Sự kiện tab ── */}
          {activeTab === 'events' && (
            <div>
              {eventTasks.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '48px 20px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1.5px solid var(--border)', borderRadius: 14
                }}>
                  <Calendar size={40} style={{ color: 'var(--text-muted)', opacity: 0.4, margin: '0 auto 12px' }} />
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>
                    Không có sự kiện nào
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                    {hasFilter ? 'Thử xóa bộ lọc để xem thêm' : `Chưa có công việc trong tháng ${month}/${year}`}
                  </p>
                </div>
              ) : (
                <div style={{ columns: 'auto 320px', columnGap: 12 }}>
                  {filteredEvents.map(task => (
                    <div key={task.id} style={{ breakInside: 'avoid', marginBottom: 0 }}>
                      <EventTaskCard task={task} onClick={setSelectedTask} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CV hằng tháng tab ── */}
          {activeTab === 'monthly' && (
            <div>
              {monthlyTasks.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '48px 20px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1.5px solid var(--border)', borderRadius: 14
                }}>
                  <CheckCircle size={40} style={{ color: 'var(--text-muted)', opacity: 0.4, margin: '0 auto 12px' }} />
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>
                    Không có công việc tháng nào
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                    {hasFilter ? 'Thử xóa bộ lọc để xem thêm' : `Chưa có CV hằng tháng trong tháng ${month}/${year}`}
                  </p>
                </div>
              ) : (
                <div style={{ columns: 'auto 320px', columnGap: 12 }}>
                  {filteredMonthly.map(task => (
                    <div key={task.id} style={{ breakInside: 'avoid', marginBottom: 0 }}>
                      <MonthlyTaskCard task={task} onClick={setSelectedMonthly}/>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Task detail modal (event) ── */}
          {selectedTask && (
            <TaskDetailModal
              task={selectedTask}
              onClose={() => { setSelectedTask(null); fetchEventTasks(); }}
            />
          )}

          {/* ── Monthly task detail modal ── */}
          {selectedMonthly && (
            <SimpleMonthlyModal
              task={selectedMonthly}
              onClose={() => { setSelectedMonthly(null); fetchMonthlyTasks(); }}
            />
          )}
        </>
      )}
    </div>
  );
}
