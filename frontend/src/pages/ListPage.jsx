import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Plus, CheckCircle, ChevronRight, ChevronDown, AlertTriangle, Paperclip, XCircle, Clock } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useAuthStore } from '../store/authStore';
import { STATUS_CONFIG, WORK_CATEGORY, LEAD_DEPT } from '../utils/constants';
import FilterBar from '../components/Tasks/FilterBar';
import TaskModal from '../components/Tasks/TaskModal';
import TaskDetailModal from '../components/Tasks/TaskDetailModal';
import QuickAddTaskModal from '../components/Tasks/QuickAddTaskModal';
import { format } from 'date-fns';
import api from '../services/api';
import { getDeadlineAlert } from '../components/Tasks/TaskCard';

const APPROVAL_BADGE = {
  pending:  { label:'Chờ duyệt',      color:'#f59e0b', bg:'rgba(245,158,11,0.12)', Icon:Clock },
  review:   { label:'Yêu cầu duyệt',  color:'#0ea5e9', bg:'rgba(14,165,233,0.15)', Icon:Clock },
  approved: { label:'Đã duyệt',       color:'#10b981', bg:'rgba(16,185,129,0.12)', Icon:CheckCircle },
  rejected: { label:'Từ chối',        color:'#ef4444', bg:'rgba(239,68,68,0.12)',  Icon:XCircle },
};

// Normalize tiếng Việt để tìm kiếm không phân biệt dấu
function normalizeVN(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
}

function matchSearch(task, kw) {
  if (!kw) return true;
  const norm = normalizeVN(kw);
  return (
    normalizeVN(task.taskName).includes(norm) ||
    normalizeVN(task.taskCode).includes(norm) ||
    normalizeVN(task.assignee?.name).includes(norm) ||
    normalizeVN(task.leadDepartment).includes(norm) ||
    normalizeVN(task.deputyDirector).includes(norm) ||
    normalizeVN(task.deliverable).includes(norm) ||
    normalizeVN(task.notes).includes(norm)
  );
}

function TaskRow({ task, children, onEdit, onDelete, onApprove, level = 0, searchKw = '' }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = children && children.length > 0;
  const status      = STATUS_CONFIG[task.status];
  const category    = WORK_CATEGORY[task.workCategory];
  const dept        = LEAD_DEPT[task.leadDepartment];

  const today = new Date(); today.setHours(0,0,0,0);
  const dlDate    = task.deadline ? new Date(task.deadline) : null;
  const extDate   = task.extendedDeadline ? new Date(task.extendedDeadline) : null;
  const effectiveDL = extDate || dlDate;
  const isValidDL   = effectiveDL && !isNaN(effectiveDL.getTime());

  // Dùng helper chung
  const alert = getDeadlineAlert(task);
  const isOverdue  = alert.level === 'overdue';
  const isDueToday = alert.level === 'today';
  const isDueSoon  = alert.level === 'soon';

  const collaborators = task.collaboratorUsers || [];
  const approval = APPROVAL_BADGE[task.approvalStatus || 'pending'] || APPROVAL_BADGE.pending;
  const ApprovalIcon = approval.Icon || Clock;
  const { user } = useAuthStore();
  const canApprove = ['admin','director','manager'].includes(user?.role);

  // Màu nền row theo mức cảnh báo
  const rowBg = isOverdue  ? 'rgba(239,68,68,0.07)'
              : isDueToday ? 'rgba(239,68,68,0.07)'
              : isDueSoon  ? 'rgba(249,115,22,0.04)'
              : 'transparent';

  const rowBorderLeft = isOverdue  ? '3px solid #ef4444'
                      : isDueToday ? '3px solid #ef4444'
                      : isDueSoon  ? '3px solid #f97316'
                      : '3px solid transparent';

  return (
    <>
      <tr
        onClick={() => onEdit(task)}
        className="transition-colors group"
        style={{
          borderBottom: '1px solid var(--border)',
          cursor: 'pointer',
          backgroundColor: rowBg,
          borderLeft: rowBorderLeft,
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = isOverdue ? 'rgba(239,68,68,0.13)' : isDueToday ? 'rgba(239,68,68,0.13)' : 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = rowBg}
      >
        {/* Task Code */}
        <td className="app-table-td" style={{ whiteSpace:'nowrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:4, paddingLeft: level * 18 }}>
            {hasChildren ? (
              <button onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:2, display:'flex' }}>
                {expanded ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}
              </button>
            ) : <span style={{ width:17, display:'inline-block' }}/>}
            <span style={{ fontFamily:'monospace', fontSize:14, fontWeight:800, color: category?.color || '#0ea5e9',
              backgroundColor:`${category?.color || '#0ea5e9'}15`, padding:'2px 7px', borderRadius:4 }}>
              {task.taskCode}
            </span>
            {task.attachments?.length > 0 && (
              <span style={{ display:'flex', alignItems:'center', gap:2, fontSize:10, color:'#0ea5e9' }}>
                <Paperclip size={10}/>{task.attachments.length}
              </span>
            )}
          </div>
        </td>

        {/* Task Name — highlight cảnh báo */}
        <td className="app-table-td" style={{ minWidth:200, maxWidth:320 }}>
          <div>
            <span style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)', lineHeight:1.4 }}>
              {task.taskName}
            </span>
            {/* Badge cảnh báo inline */}
            {(isOverdue || isDueToday) && (
              <div style={{ display:'inline-flex', alignItems:'center', gap:4, marginLeft:8,
                fontSize:10, fontWeight:800, padding:'2px 7px', borderRadius:4,
                backgroundColor: isOverdue ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.18)',
                color: isOverdue ? '#ef4444' : '#ef4444',
                border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.4)'}`,
                verticalAlign: 'middle',
              }}>
                <AlertTriangle size={10}/>
                {isOverdue ? `QUÁ HẠN ${alert.diffDays}N` : 'HÔM NAY'}
              </div>
            )}
          </div>
        </td>

        {/* Lead Dept */}
        <td className="app-table-td" style={{ whiteSpace:'nowrap' }}>
          <span style={{ fontSize:14, fontWeight:700, color: dept?.color || 'var(--text-secondary)',
            backgroundColor:`${dept?.color || '#6366f1'}15`, padding:'4px 10px', borderRadius:6 }}>
            {task.leadDepartment}
          </span>
        </td>

        {/* Assignee */}
        <td className="app-table-td" style={{ whiteSpace:'nowrap' }}>
          {task.assignee ? (
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:22, height:22, borderRadius:'50%', backgroundColor:task.assignee.color||'#6366f1',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, color:'#fff', flexShrink:0 }}>
                {task.assignee.name?.charAt(0)}
              </div>
              <span style={{ fontSize:14, fontWeight:600, color:'var(--text-secondary)' }}>{task.assignee.name}</span>
            </div>
          ) : <span style={{ color:'var(--text-muted)' }}>—</span>}
        </td>

        {/* Collaborators */}
        <td className="app-table-td">
          {collaborators.length > 0 ? (
            <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
              {collaborators.map(u => (
                <div key={u.id} title={u.name}
                  style={{ width:22, height:22, borderRadius:'50%', backgroundColor:u.color||'#6366f1',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, color:'#fff' }}>
                  {u.name?.charAt(0)}
                </div>
              ))}
            </div>
          ) : <span style={{ color:'var(--text-muted)' }}>—</span>}
        </td>

        {/* Deputy Director */}
        <td className="app-table-td" style={{ whiteSpace:'nowrap' }}>
          <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{task.deputyDirector || '—'}</span>
        </td>

        {/* Deadline — đỏ khi overdue */}
        <td className="app-table-td" style={{ whiteSpace:'nowrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:14,
            fontWeight: isOverdue || isDueToday ? 800 : 400,
            color: isOverdue ? '#ef4444' : isDueToday ? '#ef4444' : isDueSoon ? '#f97316' : 'var(--text-secondary)' }}>
            {(isOverdue || isDueToday) && <AlertTriangle size={11}/>}
            {dlDate && !isNaN(dlDate.getTime()) ? format(dlDate, 'd/M/yyyy') : '—'}
          </div>
        </td>

        {/* Extension */}
        <td className="app-table-td" style={{ whiteSpace:'nowrap' }}>
          {extDate && !isNaN(extDate.getTime()) ? (
            <span style={{ fontSize:12, fontWeight:700, color: isOverdue ? '#ef4444' : '#f59e0b' }}>
              {format(extDate, 'd/M/yyyy')}
            </span>
          ) : <span style={{ color:'var(--text-muted)' }}>—</span>}
        </td>

        {/* Deliverable */}
        <td className="app-table-td" style={{ maxWidth:220 }}>
          {task.deliverable ? (
            <span style={{ fontSize:12, color:'var(--text-secondary)', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
              {task.deliverable}
            </span>
          ) : <span style={{ color:'var(--text-muted)' }}>—</span>}
        </td>

        {/* Status */}
        <td className="app-table-td" style={{ whiteSpace:'nowrap' }}>
          <span style={{ fontSize:11, padding:'5px 14px', borderRadius:8, fontWeight:700,
            backgroundColor: status?.bgHex, color: status?.textHex }}>
            {status?.label}
          </span>
        </td>

        {/* Approval */}
        <td className="app-table-td" style={{ whiteSpace:'nowrap' }}>
          <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, fontWeight:700, padding:'5px 12px', borderRadius:8, backgroundColor:approval.bg, color:approval.color, width:'fit-content' }}>
            <ApprovalIcon size={14}/> {approval.label}
          </span>
        </td>

        {/* Progress */}
        <td className="app-table-td" style={{ whiteSpace:'nowrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:60, height:6, borderRadius:3, backgroundColor:'var(--bg-hover)', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:3,
                backgroundColor: task.progress===100 ? '#10b981' : isOverdue ? '#ef4444' : isDueToday ? '#ef4444' : '#0ea5e9',
                width:`${task.progress}%` }}/>
            </div>
            <span style={{ fontSize:11, fontWeight:700, color: isOverdue ? '#ef4444' : 'var(--text-muted)', minWidth:28 }}>
              {task.progress}%
            </span>
          </div>
        </td>

        {/* Actions */}
        <td className="app-table-td" style={{ whiteSpace:'nowrap', minWidth:80 }} onClick={e => e.stopPropagation()}>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {canApprove && task.approvalStatus === 'review' && (
              <button onClick={() => onApprove(task.id, 'approve')}
                style={{ padding:'5px 12px', borderRadius:6, border:'none', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:800 }}>
                <CheckCircle size={11}/> Duyệt
              </button>
            )}
            {canApprove && (!task.approvalStatus || task.approvalStatus === 'pending') && (
              <button onClick={() => onApprove(task.id, 'approve')}
                style={{ padding:'5px 12px', borderRadius:6, border:'none', backgroundColor:'rgba(16,185,129,0.12)', color:'#10b981', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700 }}>
                <CheckCircle size={11}/> Duyệt
              </button>
            )}
            {canApprove && task.approvalStatus === 'approved' && (
              <button onClick={() => onApprove(task.id, 'reject')}
                style={{ padding:'5px 12px', borderRadius:6, border:'none', backgroundColor:'rgba(239,68,68,0.1)', color:'#ef4444', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700 }}>
                <XCircle size={11}/> Hủy
              </button>
            )}
          </div>
        </td>
      </tr>

      {expanded && hasChildren && children.map(child => (
        <TaskRow key={child.id} task={child} children={[]} onEdit={onEdit} onDelete={onDelete} onApprove={onApprove} level={level + 1} searchKw={searchKw}/>
      ))}
    </>
  );
}


import { showConfirm } from '../utils/confirm';

export default function ListPage() {
  const { taskTree, fetchTree, deleteTask, loading, filters } = useTaskStore();
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal,    setShowModal]    = useState(false);
  const [showDetail,   setShowDetail]   = useState(false);
  const [debouncedKw, setDebouncedKw] = useState('');

  const fetchRef = React.useRef(fetchTree);
  fetchRef.current = fetchTree;

  useEffect(() => {
  fetchRef.current();
}, [
  filters.month,
  filters.year,
  filters.workCategory,
  filters.leadDepartment,
  filters.deputyDirector,
  filters.assigneeId,
  filters.status
]);

  const handleDelete = async (id) => {
    const ok = await showConfirm({ title:'Xóa công việc', message:'Xóa công việc này? Các task con cũng sẽ bị xóa.', confirmLabel:'Xóa' });
    if (ok) {
      await deleteTask(id);
    }
  };

  const handleApprove = async (id, action) => {
    try {
      await api.patch(`/tasks/${id}/approve`, { action });
      fetchTree();
    } catch (e) { console.error(e); }
  };

  // Client-side search — tìm chính xác tiếng Việt có dấu + không dấu
  const kw = filters.search?.trim() || '';
  useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedKw(kw);
  }, 300);

  return () => clearTimeout(timer);
}, [kw]);
  const filteredTree = useMemo(() => {
  if (!debouncedKw) return taskTree;

  return taskTree
    .filter(parent => {
      const parentMatch = matchSearch(parent, debouncedKw);

      const childMatch = (parent.children || []).some(c =>
        matchSearch(c, debouncedKw)
      );

      return parentMatch || childMatch;
    })
    .map(parent => ({
      ...parent,
      children: (parent.children || []).filter(
        c =>
          matchSearch(c, debouncedKw) ||
          matchSearch(parent, debouncedKw)
      )
    }));
}, [taskTree, debouncedKw]);

  const HEADERS = [
    { label:'Mã CV',           width:130 },
    { label:'Tên công việc',   width:220 },
    { label:'Bộ phận',         width:90  },
    { label:'Người thực hiện', width:120 },
    { label:'Phối hợp',        width:100 },
    { label:'Lãnh đạo',        width:110 },
    { label:'Deadline',        width:100 },
    { label:'Gia hạn',         width:90  },
    { label:'Kết quả đầu ra',  width:200 },
    { label:'Trạng thái',      width:110 },
    { label:'Duyệt',           width:100 },
    { label:'Tiến độ',         width:100 },
    { label:'',                width:70  },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <FilterBar/>
        <button onClick={() => { setSelectedTask(null); setShowModal(true); }} className="btn btn-primary text-sm">
          <Plus size={15}/> Thêm công việc
        </button>
      </div>

      <div className="app-card overflow-hidden p-0">
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:1100 }}>
            <thead>
              <tr style={{ backgroundColor:'var(--bg-surface)' }}>
                {HEADERS.map((h, i) => (
                  <th key={i} style={{
                    padding:'11px 14px', fontSize:13, fontWeight:800, textTransform:'uppercase',
                    letterSpacing:'0.06em', color:'var(--text-muted)', borderBottom:'2px solid var(--border)',
                    textAlign:'left', whiteSpace:'nowrap', width:h.width,
                    backgroundColor:'var(--bg-surface)'
                  }}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {HEADERS.map((_, j) => (
                      <td key={j} className="app-table-td">
                        <div style={{ height:14, borderRadius:4, backgroundColor:'var(--bg-hover)', animation:'pulse 1.5s infinite' }}/>
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredTree.length === 0 ? (
                <tr>
                  <td colSpan={HEADERS.length} style={{ padding:'48px 16px', textAlign:'center', color:'var(--text-muted)', fontSize:14 }}>
                    {kw ? `Không tìm thấy công việc nào khớp "${kw}"` : 'Không có công việc nào'}
                  </td>
                </tr>
              ) : (
                filteredTree.map(parent => (
                  <TaskRow
                    key={parent.id}
                    task={parent}
                    children={parent.children || []}
                    onEdit={t => { setSelectedTask(t); setShowDetail(true); }}
                    onDelete={handleDelete}
                    onApprove={handleApprove}
                    level={0}
                    searchKw={kw}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <TaskModal task={null} onClose={() => { setShowModal(false); fetchTree(); }}/>}
      {showDetail && selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => { setShowDetail(false); setSelectedTask(null); fetchTree(); }}/>
      )}
    </div>
  );
}

