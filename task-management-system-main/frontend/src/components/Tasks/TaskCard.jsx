import React from 'react';
import { Flag, CheckCircle, AlertTriangle, Clock, Paperclip, Zap } from 'lucide-react';
import { STATUS_CONFIG, WORK_CATEGORY, LEAD_DEPT, COMPLETION_CONFIG } from '../../utils/constants';
import { format } from 'date-fns';

const DEPT_SHORT = {
  'LD-COM':  'Truyền thông',
  'LD-INF':  'Thông tin',
  'LD-ADM':  'Hành chính',
  'LD-SER':  'Dịch vụ',
  'LD-INNO': 'KN&ĐMST',
  'LD-BOD':  'Ban GĐ',
};

const STATUS_HEADER_BG = {
  not_started: '#475569',
  in_progress:  '#d97706',
  done:         '#059669',
  delayed:      '#dc2626',
};

// Helper dùng chung cho cả Card và Row
export function getDeadlineAlert(task) {
  const effectiveDeadline = task.extendedDeadline || task.deadline;
  const deadlineDate = effectiveDeadline ? new Date(effectiveDeadline) : null;
  const isValidDate  = deadlineDate && !isNaN(deadlineDate.getTime());
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isDone = task.status === 'done';

  if (!isValidDate || isDone) return { level: 'none' };

  const dl = new Date(deadlineDate); dl.setHours(0,0,0,0);
  const diffDays = Math.ceil((dl - today) / 86400000);

  if (diffDays < 0)   return { level: 'overdue',  diffDays: Math.abs(diffDays), deadlineDate };
  if (diffDays === 0) return { level: 'today',     diffDays: 0,                 deadlineDate };
  if (diffDays <= 3)  return { level: 'soon',      diffDays,                    deadlineDate };
  return { level: 'normal', diffDays, deadlineDate };
}

export default function TaskCard({ task, onClick }) {
  const status    = STATUS_CONFIG[task.status];
  const category  = WORK_CATEGORY[task.workCategory];
  const dept      = LEAD_DEPT[task.leadDepartment];
  const deptShort = DEPT_SHORT[task.leadDepartment] || task.leadDepartment;
  const headerBg  = STATUS_HEADER_BG[task.status] || '#475569';
  const statusColor = status?.color || '#64748b';

  const alert = getDeadlineAlert(task);
  const isOverdue  = alert.level === 'overdue';
  const isDueToday = alert.level === 'today';
  const isDueSoon  = alert.level === 'soon';
  const isDone     = task.status === 'done';

  const effectiveDeadline = task.extendedDeadline || task.deadline;
  const deadlineDate = alert.deadlineDate;
  const isValidDate  = !!deadlineDate;

  // ── Màu viền + nền card theo mức cảnh báo ──
  const cardBorderColor = isOverdue  ? '#ef4444'
                        : isDueToday ? '#ef4444'   // hôm nay = đỏ
                        : isDueSoon  ? '#f97316'   // gần đến = cam
                        : statusColor;

  const cardBg = isOverdue  ? 'rgba(239,68,68,0.09)'
               : isDueToday ? 'rgba(239,68,68,0.07)' // hôm nay = đỏ nhạt
               : isDueSoon  ? 'rgba(249,115,22,0.05)'
               : 'var(--bg-card)';

  const cardBorderWidth = (isOverdue || isDueToday) ? '2px' : '1.5px';

  return (
    <div onClick={onClick}
      style={{
        backgroundColor: cardBg,
        border: `${cardBorderWidth} solid ${cardBorderColor}${isOverdue ? 'cc' : isDueToday ? 'aa' : '50'}`,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        transition: 'transform 0.15s, box-shadow 0.15s',
        // Pulse glow khi overdue
        boxShadow: isOverdue  ? '0 0 0 0 rgba(239,68,68,0.4), inset 0 0 0 1px rgba(239,68,68,0.2)'
                 : isDueToday ? '0 0 0 0 rgba(239,68,68,0.3)'  // hôm nay = đỏ
                 : 'none',
        animation: (isOverdue || isDueToday) ? 'overdueGlow 2s ease-in-out infinite' : 'none',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 8px 28px rgba(0,0,0,0.35), 0 0 0 2px ${cardBorderColor}60`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isOverdue ? '0 0 0 0 rgba(239,68,68,0.4)' : 'none';
      }}>

      {/* ── Banner cảnh báo nổi bật (chỉ khi overdue hoặc today) ── */}
      {(isOverdue || isDueToday) && (
        <div style={{
          backgroundColor: isOverdue ? '#ef4444' : '#ef4444', // hôm nay cũng đỏ
          padding: '4px 12px',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <AlertTriangle size={12} style={{ color: '#fff', flexShrink: 0 }}/>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#fff', letterSpacing: '0.04em' }}>
            {isOverdue
              ? `⚠ QUÁ HẠN ${alert.diffDays} NGÀY — CHƯA HOÀN THÀNH`
              : '🔴 ĐẾN HẠN HÔM NAY — CHƯA HOÀN THÀNH'}
          </span>
        </div>
      )}

      {/* ── Dải header màu theo TRẠNG THÁI ── */}
      <div style={{
        backgroundColor: headerBg,
        padding: '7px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 900, color: '#fff', opacity: 0.95, flexShrink: 0 }}>
          {task.taskCode}
        </span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flex: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
          {task.leadDepartment && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
              {deptShort}
            </span>
          )}
          {task.taskType && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
              backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff' }}>
              {task.taskType}
            </span>
          )}
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 9px', borderRadius: 5,
          backgroundColor: 'rgba(0,0,0,0.25)', color: '#fff', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {status?.label}
        </span>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '11px 13px', display: 'flex', flexDirection: 'column', gap: 8 }}>

        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {task.taskName}
        </div>

        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {task.workCategory && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
              backgroundColor: `${category?.color || '#6366f1'}20`, color: category?.color || '#6366f1' }}>
              {task.workCategory}
            </span>
          )}
          {task.leadDepartment && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
              backgroundColor: `${dept?.color || '#6366f1'}18`, color: dept?.color || '#6366f1' }}>
              {task.leadDepartment}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 4, color: 'var(--text-muted)' }}>
            <span>Tiến độ</span>
            <span style={{ fontWeight: 800, color: isOverdue ? '#ef4444' : isDueToday ? '#ef4444' : 'var(--text-muted)' }}>
              {task.progress}%
            </span>
          </div>
          <div style={{ width: '100%', height: 6, borderRadius: 3, backgroundColor: 'var(--bg-hover)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, width: `${task.progress}%`, transition: 'width 0.4s',
              backgroundColor: isDone ? '#10b981' : isOverdue ? '#ef4444' : isDueToday ? '#ef4444' : isDueSoon ? '#f97316' : statusColor }}/>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            {isValidDate && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5,
                backgroundColor: isOverdue  ? 'rgba(239,68,68,0.20)'
                               : isDueToday ? 'rgba(239,68,68,0.20)'  // hôm nay = đỏ
                               : isDueSoon  ? 'rgba(249,115,22,0.16)'
                               : isDone     ? 'rgba(16,185,129,0.16)'
                               : 'var(--bg-hover)',
                color: isOverdue  ? '#ef4444'
                     : isDueToday ? '#ef4444'   // hôm nay = đỏ
                     : isDueSoon  ? '#f97316'
                     : isDone     ? '#10b981'
                     : 'var(--text-muted)',
                border: isOverdue  ? '1px solid rgba(239,68,68,0.5)'
                      : isDueToday ? '1px solid rgba(239,68,68,0.5)'  // hôm nay = đỏ
                      : isDueSoon  ? '1px solid rgba(249,115,22,0.4)'
                      : '1px solid transparent',
              }}>
                {isOverdue  ? <AlertTriangle size={11}/> :
                 isDueToday ? <Clock size={11}/> :
                 isDone     ? <CheckCircle size={11}/> :
                              <Flag size={11}/>}
                <span>
                  {task.extendedDeadline
                    ? <><s style={{ opacity:0.5, marginRight:3 }}>{format(new Date(task.deadline),'d/M')}</s>{format(new Date(task.extendedDeadline),'d/M/yy')}</>
                    : format(deadlineDate,'d/M/yyyy')}
                </span>
              </div>
            )}
            {task.completion && (
              <span style={{ fontSize:10, fontWeight:800, padding:'2px 7px', borderRadius:4,
                backgroundColor:`${COMPLETION_CONFIG[task.completion]?.color}20`,
                color:COMPLETION_CONFIG[task.completion]?.color }}>
                {task.completion}
              </span>
            )}
            {task.attachments?.length > 0 && (
              <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, fontWeight:700,
                color:'#0ea5e9', backgroundColor:'#0ea5e915', padding:'2px 6px', borderRadius:4 }}>
                <Paperclip size={10}/> {task.attachments.length}
              </span>
            )}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
            {task.deputyDirector && (
              <span style={{ fontSize:9, padding:'2px 5px', borderRadius:3,
                backgroundColor:'var(--bg-hover)', color:'var(--text-muted)', fontWeight:600 }}>
                {task.deputyDirector.replace('GĐ-','').replace('PGĐ-','')}
              </span>
            )}
            {task.assignee && (
              <div title={task.assignee.name} style={{
                width:26, height:26, borderRadius:'50%',
                backgroundColor: task.assignee.color || '#6366f1',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:11, fontWeight:900, color:'#fff',
                boxShadow:`0 0 0 2px var(--bg-card), 0 0 0 3px ${task.assignee.color||'#6366f1'}60`
              }}>
                {task.assignee.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
