/**
 * DatePicker.jsx — Custom date picker đẹp, dùng chung toàn app
 * Props:
 *   value: string 'YYYY-MM-DD' | ''
 *   onChange: (val: string) => void
 *   placeholder?: string
 *   label?: string
 *   minDate?: string
 *   maxDate?: string
 *   style?: object  — style cho wrapper
 */
import React, { useState, useRef, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, isSameDay, isToday,
  parseISO, isValid
} from 'date-fns';
import { vi } from 'date-fns/locale';

const WEEKDAYS = ['CN','T2','T3','T4','T5','T6','T7'];
const MONTHS_VI = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                   'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

export default function DatePicker({ value, onChange, placeholder = 'dd/mm/yyyy', label, minDate, maxDate, style = {} }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) { const d = parseISO(value); return isValid(d) ? d : new Date(); }
    return new Date();
  });
  const [hovered, setHovered] = useState(null);
  const wrapRef = useRef(null);

  // Đóng khi click ngoài
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Sync viewDate khi value thay đổi từ ngoài
  useEffect(() => {
    if (value) { const d = parseISO(value); if (isValid(d)) setViewDate(d); }
  }, [value]);

  const selectedDate = value ? parseISO(value) : null;
  const monthStart = startOfMonth(viewDate);
  const monthEnd   = endOfMonth(viewDate);
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad   = getDay(monthStart); // 0=CN

  const isDisabled = (day) => {
    if (minDate && day < parseISO(minDate)) return true;
    if (maxDate && day > parseISO(maxDate)) return true;
    return false;
  };

  const selectDay = (day) => {
    if (isDisabled(day)) return;
    onChange(format(day, 'yyyy-MM-dd'));
    setOpen(false);
  };

  const displayValue = selectedDate && isValid(selectedDate)
    ? format(selectedDate, 'dd/MM/yyyy')
    : '';

  return (
    <div ref={wrapRef} style={{ position: 'relative', ...style }}>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5 }}>
          {label}
        </label>
      )}

      {/* Input trigger */}
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px',
          borderRadius: 10,
          border: `1.5px solid ${open ? 'var(--border-focus)' : 'var(--border)'}`,
          backgroundColor: 'var(--bg-input)',
          cursor: 'pointer',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: open ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
          minWidth: 150,
          userSelect: 'none',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.borderColor = 'var(--border-focus)'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor = 'var(--border)'; }}
      >
        <CalendarDays size={15} style={{ color: open ? 'var(--border-focus)' : 'var(--text-muted)', flexShrink: 0, transition: 'color 0.2s' }}/>
        <span style={{ flex: 1, fontSize: 13, color: displayValue ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: displayValue ? 600 : 400 }}>
          {displayValue || placeholder}
        </span>
        {displayValue && (
          <button
            onClick={e => { e.stopPropagation(); onChange(''); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex', borderRadius: 4 }}
            title="Xóa ngày"
          >
            <X size={13}/>
          </button>
        )}
      </div>

      {/* Calendar dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 1000,
          backgroundColor: 'var(--bg-surface)',
          border: '1.5px solid var(--border)',
          borderRadius: 14,
          boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
          padding: '14px',
          minWidth: 280,
          animation: 'fadeInScale 0.15s ease',
        }}>
          {/* Month/Year nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button onClick={() => setViewDate(d => subMonths(d, 1))}
              style={{ width: 30, height: 30, borderRadius: 8, border: 'none', backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--border)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}>
              <ChevronLeft size={15}/>
            </button>

            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
              {MONTHS_VI[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>

            <button onClick={() => setViewDate(d => addMonths(d, 1))}
              style={{ width: 30, height: 30, borderRadius: 8, border: 'none', backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--border)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}>
              <ChevronRight size={15}/>
            </button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 6 }}>
            {WEEKDAYS.map((d, i) => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, padding: '4px 0',
                color: i === 0 ? '#ef4444' : i === 6 ? '#0ea5e9' : 'var(--text-muted)' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
            {/* Padding cells */}
            {Array.from({ length: startPad }).map((_, i) => (
              <div key={`p${i}`} style={{ height: 34 }}/>
            ))}

            {days.map(day => {
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isTodayDay = isToday(day);
              const disabled   = isDisabled(day);
              const isHov      = hovered && isSameDay(day, hovered);
              const colIdx     = getDay(day);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => selectDay(day)}
                  onMouseEnter={() => !disabled && setHovered(day)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    height: 34, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: isSelected || isTodayDay ? 800 : 500,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.3 : 1,
                    backgroundColor: isSelected
                      ? '#0ea5e9'
                      : isHov && !disabled
                        ? 'rgba(14,165,233,0.18)'
                        : isTodayDay
                          ? 'rgba(14,165,233,0.1)'
                          : 'transparent',
                    color: isSelected
                      ? '#fff'
                      : colIdx === 0
                        ? '#ef4444'
                        : colIdx === 6
                          ? '#0ea5e9'
                          : 'var(--text-primary)',
                    border: isTodayDay && !isSelected ? '1.5px solid rgba(14,165,233,0.4)' : '1.5px solid transparent',
                    transition: 'background 0.12s, transform 0.1s',
                    transform: isHov && !disabled && !isSelected ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {format(day, 'd')}
                </div>
              );
            })}
          </div>

          {/* Footer shortcuts */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => { onChange(''); setOpen(false); }}
              style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Xóa
            </button>
            <button
              onClick={() => selectDay(new Date())}
              style={{ fontSize: 12, fontWeight: 700, color: '#0ea5e9', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(14,165,233,0.1)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Hôm nay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
