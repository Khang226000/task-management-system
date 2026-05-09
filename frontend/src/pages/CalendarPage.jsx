import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, X, Calendar, AlertTriangle
} from 'lucide-react';
import { eventService, taskService } from '../services/taskService';
import { EVENT_TYPE_CONFIG, STATUS_CONFIG, WORK_CATEGORY } from '../utils/constants';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameDay, isToday, addMonths, subMonths
} from 'date-fns';
import { vi } from 'date-fns/locale';
import TaskDetailModal from '../components/Tasks/TaskDetailModal';

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
function normalizeVN(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

// Màu theo status cho task chip
const STATUS_CHIP = {
  not_started: { bg: '#374151', text: '#9ca3af', dot: '#6b7280' },
  in_progress:  { bg: '#78350f', text: '#fcd34d', dot: '#f59e0b' },
  done:         { bg: '#064e3b', text: '#6ee7b7', dot: '#10b981' },
  delayed:      { bg: '#7f1d1d', text: '#fca5a5', dot: '#ef4444' }
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents]           = useState([]);
  const [tasks, setTasks]             = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '', type: 'meeting', color: '#6366f1',
    startDate: '', allDay: true, description: ''
  });

  const month = currentDate.getMonth() + 1;
  const year  = currentDate.getFullYear();

  const fetchData = useCallback(async () => {
    try {
      const [evRes, tkRes] = await Promise.all([
        eventService.getEvents({ month, year }),
        taskService.getTasks({ month, year })
      ]);
      setEvents(evRes.data.data || []);
      setTasks(tkRes.data.data || []);
    } catch (e) { console.error(e); }
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(search);
  }, 300);

  return () => clearTimeout(timer);
}, [search]);

  // Build calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd   = endOfMonth(currentDate);
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad   = getDay(monthStart); // 0=Sun

  const filteredTasks = useMemo(() => {
  if (!debouncedSearch.trim()) return tasks;

  const kw = normalizeVN(debouncedSearch);

  return tasks.filter(t => {
    return (
      normalizeVN(t.taskName).includes(kw) ||
      normalizeVN(t.taskCode).includes(kw) ||
      normalizeVN(t.assignee?.name).includes(kw) ||
      normalizeVN(t.leadDepartment).includes(kw)
    );
  });
}, [tasks, debouncedSearch]);

const getTasksForDay = (day) =>
  filteredTasks.filter(t => {
      const dl = t.extendedDeadline || t.deadline;
      if (!dl) return false;
      const d = new Date(dl);
      return !isNaN(d.getTime()) && isSameDay(d, day);
    });

  const getEventsForDay = (day) =>
    events.filter(e => {
      if (!e.startDate) return false;
      const d = new Date(e.startDate);
      return !isNaN(d.getTime()) && isSameDay(d, day);
    });

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setShowDayModal(true);
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      await eventService.create({
        ...eventForm,
        startDate: new Date(eventForm.startDate).toISOString()
      });
      setShowEventModal(false);
      setEventForm({ title: '', type: 'meeting', color: '#6366f1', startDate: '', allDay: true, description: '' });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteEvent = async (id) => {
    await eventService.delete(id);
    fetchData();
  };

  // Tasks + events for selected day
  const selectedTasks  = selectedDay ? getTasksForDay(selectedDay) : [];
  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  // Status filter tabs
  const [activeFilter, setActiveFilter] = useState('all');
  const statusCounts = {
    all:         tasks.length,
    not_started: tasks.filter(t => t.status === 'not_started').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    review:      tasks.filter(t => t.status === 'review').length,
    done:        tasks.filter(t => t.status === 'done').length,
  };

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Status filter tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-lg font-bold mr-2" style={{ color: 'var(--text-primary)' }}>Lịch Biểu</h2>
          <input
        type="text"
        placeholder="Tìm công việc..."
      value={search}
        onChange={(e) => setSearch(e.target.value)}
      className="input h-9 text-sm"
        style={{
          width: '220px',
        minWidth: '220px'
      }}
    />
          {[
            { key: 'all',         label: `Tất cả (${statusCounts.all})` },
            { key: 'not_started', label: `Chưa bắt đầu (${statusCounts.not_started})` },
            { key: 'in_progress', label: `Đang làm (${statusCounts.in_progress})` },
            { key: 'done',        label: `Hoàn thành (${statusCounts.done})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                backgroundColor: activeFilter === tab.key ? '#6366f1' : 'var(--bg-hover)',
                color: activeFilter === tab.key ? '#fff' : 'var(--text-secondary)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Month nav + Add */}
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentDate(d => subMonths(d, 1))}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text-secondary)' }}>
            <ChevronLeft size={18} />
          </button>
          <span className="text-base font-bold min-w-36 text-center" style={{ color: 'var(--text-primary)' }}>
            {format(currentDate, 'MMMM yyyy', { locale: vi }).toUpperCase()}
          </span>
          <button onClick={() => setCurrentDate(d => addMonths(d, 1))}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text-secondary)' }}>
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => { setEventForm(f => ({ ...f, startDate: format(new Date(), 'yyyy-MM-dd') })); setShowEventModal(true); }}
            className="btn btn-primary text-sm">
            <Plus size={15} /> Thêm sự kiện
          </button>
        </div>
      </div>

      {/* ── Calendar grid ── */}
      <div className="app-card p-0 overflow-hidden flex-1 flex flex-col">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border)' }}>
          {WEEKDAYS.map((d, i) => (
            <div key={d} className="py-3 text-center text-xs font-bold uppercase tracking-wider"
              style={{ color: i === 0 ? '#ef4444' : i === 6 ? '#6366f1' : 'var(--text-muted)' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 flex-1" style={{ gridAutoRows: 'minmax(110px, 1fr)' }}>
          {/* Padding cells */}
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} className="border-b border-r p-2"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-base)', opacity: 0.5 }} />
          ))}

          {days.map((day, idx) => {
            const dayTasks  = getTasksForDay(day).filter(t =>
              activeFilter === 'all' || t.status === activeFilter
            );
            const dayEvents = getEventsForDay(day);
            const today     = isToday(day);
            const colIdx    = (startPad + idx) % 7;
            const isSun     = colIdx === 0;
            const isSat     = colIdx === 6;
            const total     = dayTasks.length + dayEvents.length;

            return (
              <div
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className="border-b border-r p-1.5 cursor-pointer group overflow-hidden"
                style={{
                  borderColor: 'var(--border)',
                  borderRight: isSat ? 'none' : undefined,
                  backgroundColor: today ? 'rgba(99,102,241,0.06)' : 'var(--bg-surface)',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = today ? 'rgba(99,102,241,0.1)' : 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = today ? 'rgba(99,102,241,0.06)' : 'var(--bg-surface)'}
              >
                {/* Day number row */}
                <div className="flex items-center justify-between mb-1">
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold
                    ${today ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40' : ''}`}
                    style={{ color: today ? undefined : isSun ? '#ef4444' : isSat ? '#6366f1' : 'var(--text-primary)' }}>
                    {format(day, 'd')}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); setEventForm(f => ({ ...f, startDate: format(day, 'yyyy-MM-dd') })); setShowEventModal(true); }}
                      className="w-5 h-5 rounded flex items-center justify-center hover:bg-indigo-500/20 text-indigo-400">
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                {/* Events */}
                {dayEvents.slice(0, 1).map(ev => (
                  <div key={ev.id}
                    className="text-xs px-1.5 py-0.5 rounded mb-0.5 truncate font-medium"
                    style={{ backgroundColor: `${ev.color}25`, color: ev.color, border: `1px solid ${ev.color}40` }}
                    onClick={e => e.stopPropagation()}>
                    📅 {ev.title}
                  </div>
                ))}

                {/* Tasks */}
                {dayTasks.slice(0, 3).map(task => {
                  const chip = STATUS_CHIP[task.status] || STATUS_CHIP.not_started;
                  const cat  = WORK_CATEGORY[task.workCategory];
                  return (
                    <div key={task.id}
                      className="text-xs px-1.5 py-0.5 rounded mb-0.5 truncate flex items-center gap-1"
                      style={{ backgroundColor: chip.bg, color: chip.text }}>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: chip.dot }} />
                      <span className="truncate font-medium">{task.taskCode}: {task.taskName}</span>
                    </div>
                  );
                })}

                {/* More indicator */}
                {total > 3 && (
                  <div className="text-xs font-semibold mt-0.5 px-1" style={{ color: 'var(--text-muted)' }}>
                    +{total - 3} thêm...
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Day detail modal ── */}
      {showDayModal && selectedDay && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDayModal(false)}>
          <div className="modal-content" style={{ maxWidth: '520px', maxHeight: '80vh', overflowY: 'auto' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-indigo-400" />
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Công việc ngày {format(selectedDay, 'dd/MM/yyyy')}
                </h2>
              </div>
              <button onClick={() => setShowDayModal(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Events section */}
              {selectedEvents.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    Sự kiện
                  </p>
                  {selectedEvents.map(ev => (
                    <div key={ev.id}
                      className="flex items-center gap-3 p-3 rounded-xl mb-2 group"
                      style={{ backgroundColor: `${ev.color}15`, border: `1px solid ${ev.color}30` }}>
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{ev.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {EVENT_TYPE_CONFIG[ev.type]?.label}
                          {ev.description && ` · ${ev.description}`}
                        </p>
                      </div>
                      <button onClick={() => handleDeleteEvent(ev.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-red-400 hover:bg-red-500/10">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Tasks section */}
              {selectedTasks.length > 0 ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    Công việc đến hạn ({selectedTasks.length})
                  </p>
                  {selectedTasks.map(task => {
                    const status = STATUS_CONFIG[task.status];
                    const cat    = WORK_CATEGORY[task.workCategory];
                    const chip   = STATUS_CHIP[task.status] || STATUS_CHIP.not_started;
                    return (
                      <div key={task.id}
                        className="p-3 rounded-xl mb-2 border-l-4 cursor-pointer hover:opacity-90 transition-opacity"
                        style={{
                          backgroundColor: 'var(--bg-hover)',
                          borderLeftColor: cat?.color || '#6366f1'
                        }}
                        onClick={() => { setSelectedTask(task); setShowTaskDetail(true); setShowDayModal(false); }}
                      >                        {/* Code + status */}
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono font-bold" style={{ color: cat?.color }}>
                            {task.taskCode}
                          </span>
                          <span className={`badge ${status.bg} ${status.text}`} style={{ fontSize: '11px' }}>
                            {status.label}
                          </span>
                        </div>
                        {/* Name */}
                        <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                          {task.taskName}
                        </p>
                        {/* Meta */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: `${cat?.color}20`, color: cat?.color }}>
                            {task.workCategory}
                          </span>
                          {task.leadDepartment && (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {task.leadDepartment}
                            </span>
                          )}
                          {task.assignee && (
                            <div className="flex items-center gap-1">
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                style={{ backgroundColor: task.assignee.color || '#6366f1' }}>
                                {task.assignee.name?.charAt(0)}
                              </div>
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {task.assignee.name}
                              </span>
                            </div>
                          )}
                          {task.extendedDeadline && (
                            <span className="text-xs text-amber-400 font-medium">⏰ Gia hạn</span>
                          )}
                        </div>
                        {/* Progress */}
                        {task.progress > 0 && (
                          <div className="mt-2">
                            <div className="w-full rounded-full h-1.5" style={{ backgroundColor: 'var(--bg-base)' }}>
                              <div className="h-1.5 rounded-full"
                                style={{ width: `${task.progress}%`, backgroundColor: chip.dot }} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : selectedEvents.length === 0 ? (
                <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
                  <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Không có công việc hay sự kiện nào</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ── Task detail modal ── */}
      {showTaskDetail && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => { setShowTaskDetail(false); setSelectedTask(null); fetchData(); }}
        />
      )}

      {/* ── Add event modal ── */}      {showEventModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowEventModal(false)}>
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Thêm sự kiện</h2>
              <button onClick={() => setShowEventModal(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-secondary)' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddEvent} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Tiêu đề *</label>
                <input className="input" placeholder="Tên sự kiện..." value={eventForm.title}
                  onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Loại</label>
                  <select className="select" value={eventForm.type}
                    onChange={e => setEventForm(f => ({ ...f, type: e.target.value }))}>
                    {Object.entries(EVENT_TYPE_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Màu</label>
                  <input type="color" className="input h-11 p-1 cursor-pointer" value={eventForm.color}
                    onChange={e => setEventForm(f => ({ ...f, color: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Ngày *</label>
                <input type="date" className="input" value={eventForm.startDate}
                  onChange={e => setEventForm(f => ({ ...f, startDate: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Mô tả</label>
                <textarea className="input resize-none" rows={2} value={eventForm.description}
                  onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowEventModal(false)} className="btn btn-secondary">Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu sự kiện</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
