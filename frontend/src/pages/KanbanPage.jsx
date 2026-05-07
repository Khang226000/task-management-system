import React, { useEffect, useState } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { STATUS_CONFIG } from '../utils/constants';
import TaskCard from '../components/Tasks/TaskCard';
import TaskDetailModal from '../components/Tasks/TaskDetailModal';
import FilterBar from '../components/Tasks/FilterBar';
import QuickAddTaskModal from '../components/Tasks/QuickAddTaskModal';

const COLUMNS = [
  { key: 'not_started', ...STATUS_CONFIG.not_started },
  { key: 'in_progress', ...STATUS_CONFIG.in_progress },
  { key: 'done',        ...STATUS_CONFIG.done },
  { key: 'delayed',     ...STATUS_CONFIG.delayed }
];

export default function KanbanPage() {
  const { kanbanBoard, fetchKanban, loading, updateTaskStatus, filters } = useTaskStore();
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal,    setShowModal]    = useState(false); // QuickAdd
  const [showDetail,   setShowDetail]   = useState(false);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  useEffect(() => { fetchKanban(); }, [
    filters.month, filters.year, filters.workCategory,
    filters.leadDepartment, filters.deputyDirector,
    filters.assigneeId, filters.status, filters.search
  ]);

  const handleDragStart = (e, task, fromStatus) => {
    setDraggedTask({ task, fromStatus });
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e, col) => { e.preventDefault(); setDragOverCol(col); };
  const handleDrop = async (e, toStatus) => {
    e.preventDefault(); setDragOverCol(null);
    if (!draggedTask || draggedTask.fromStatus === toStatus) return;
    await updateTaskStatus(draggedTask.task.id, toStatus);
    setDraggedTask(null);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <FilterBar />

      <div className="flex gap-4 flex-1 overflow-x-auto pb-2" style={{ margin: '0 -4px', padding: '0 4px' }}>
        {COLUMNS.map(col => {
          const tasks = kanbanBoard[col.key] || [];
          return (
            <div
              key={col.key}
              className={`kanban-col flex flex-col shrink-0 ${dragOverCol === col.key ? 'drag-over' : ''}`}
              style={{ flex: '1 1 0', minWidth: '260px', maxWidth: '400px' }}
              onDragOver={e => handleDragOver(e, col.key)}
              onDrop={e => handleDrop(e, col.key)}
              onDragLeave={() => setDragOverCol(null)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{col.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                    {tasks.length}
                  </span>
                </div>
                <button onClick={() => { setSelectedTask(null); setShowModal(true); }}
                  className="p-1 rounded transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--text-muted)' }}>
                  <Plus size={15} />
                </button>
              </div>

              {/* Tasks */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 kanban-column">
                {loading && tasks.length === 0 ? (
                  [1,2,3].map(i => <div key={i} className="h-28 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--bg-hover)' }} />)
                ) : tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10" style={{ color: 'var(--text-muted)' }}>
                    <Plus size={20} className="mb-1 opacity-40" />
                    <p className="text-xs opacity-60">Chưa có công việc</p>
                  </div>
                ) : (
                  tasks.map(task => (
                    <div key={task.id} draggable
                      onDragStart={e => handleDragStart(e, task, col.key)}
                      onDragEnd={() => setDraggedTask(null)}
                      className={draggedTask?.task.id === task.id ? 'opacity-40' : ''}
                    >
                      <TaskCard task={task} onClick={() => { setSelectedTask(task); setShowDetail(true); }} />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <QuickAddTaskModal onClose={() => { setShowModal(false); fetchKanban(); }} />
      )}

      {showDetail && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => { setShowDetail(false); setSelectedTask(null); }}
        />
      )}
    </div>
  );
}
