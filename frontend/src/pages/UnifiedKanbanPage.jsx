import React, { useState } from 'react';
import KanbanPage from './KanbanPage';
import MonthlyKanbanPage from './MonthlyKanbanPage';

export default function UnifiedKanbanPage() {
  const [mode, setMode] = useState('event');

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14, height:'100%' }}>
      {/* Toggle */}
      <div style={{ display:'flex', gap:6, padding:'4px', backgroundColor:'var(--bg-hover)', borderRadius:12, width:'fit-content' }}>
        {[
          { key:'event',   label:'📋 Sự kiện' },
          { key:'monthly', label:'📅 Công việc tháng' }
        ].map(tab => (
          <button key={tab.key} onClick={() => setMode(tab.key)}
            style={{
              padding:'8px 20px', borderRadius:9, border:'none', fontSize:13, fontWeight:700, cursor:'pointer',
              backgroundColor: mode === tab.key ? '#0ea5e9' : 'transparent',
              color: mode === tab.key ? '#fff' : 'var(--text-secondary)',
              transition:'all 0.2s'
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        {mode === 'event' ? <KanbanPage /> : <MonthlyKanbanPage />}
      </div>
    </div>
  );
}
