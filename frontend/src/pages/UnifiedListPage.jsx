import React, { useState } from 'react';
import ListPage from './ListPage';
import MonthlyTaskPage from './MonthlyTaskPage';

export default function UnifiedListPage() {
  const [mode, setMode] = useState('event'); // 'event' | 'monthly'

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, height:'100%' }}>
      {/* Toggle tabs */}
      <div style={{ display:'flex', gap:8 }}>
        {[
          { key:'event',   label:'📋 Sự kiện' },
          { key:'monthly', label:'📅 Công việc hằng tháng' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setMode(tab.key)}
            style={{
              padding:'10px 20px', borderRadius:10, border:'none',
              fontSize:14, fontWeight:700, cursor:'pointer',
              backgroundColor: mode === tab.key ? '#0ea5e9' : 'var(--bg-hover)',
              color: mode === tab.key ? '#fff' : 'var(--text-secondary)',
              transition:'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:'auto' }}>
        {mode === 'event' ? <ListPage /> : <MonthlyTaskPage />}
      </div>
    </div>
  );
}
