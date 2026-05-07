import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

/**
 * UserPicker — dùng cho cả single (assignee) và multi (collaborators)
 * Props:
 *  - users: array of {id, name, color}
 *  - value: string (single) | string[] (multi)
 *  - onChange: (newValue) => void
 *  - multi: boolean
 *  - placeholder: string
 *  - disabled: boolean
 */
export default function UserPicker({ users = [], value, onChange, multi = false, placeholder, disabled = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Đóng khi click ngoài
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedIds = multi ? (Array.isArray(value) ? value : []) : (value ? [value] : []);
  const selectedUsers = selectedIds.map(id => users.find(u => u.id === id)).filter(Boolean);

  const toggle = (uid) => {
    if (disabled) return;
    if (multi) {
      const cur = Array.isArray(value) ? value : [];
      onChange(cur.includes(uid) ? cur.filter(id => id !== uid) : [...cur, uid]);
    } else {
      onChange(value === uid ? '' : uid);
      setOpen(false);
    }
  };

  const remove = (e, uid) => {
    e.stopPropagation();
    if (disabled) return;
    if (multi) {
      onChange((Array.isArray(value) ? value : []).filter(id => id !== uid));
    } else {
      onChange('');
    }
  };

  return (
    <div ref={ref} style={{ position:'relative' }}>
      {/* Trigger */}
      <div
        onClick={() => !disabled && setOpen(v => !v)}
        style={{
          minHeight: 40, padding:'6px 10px', borderRadius:10,
          border:`1.5px solid ${open ? 'var(--border-focus)' : 'var(--border)'}`,
          backgroundColor: disabled ? 'var(--bg-hover)' : 'var(--bg-input)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display:'flex', flexWrap:'wrap', gap:5, alignItems:'center',
          transition:'border-color 0.2s'
        }}>
        {selectedUsers.length === 0 ? (
          <span style={{ fontSize:13, color:'var(--text-muted)' }}>
            {placeholder || (multi ? '-- Chọn người phối hợp --' : '-- Chọn người --')}
          </span>
        ) : (
          selectedUsers.map(u => (
            <span key={u.id} style={{
              display:'flex', alignItems:'center', gap:4,
              padding:'3px 8px 3px 6px', borderRadius:20,
              backgroundColor: u.color || '#6366f1', color:'#fff',
              fontSize:12, fontWeight:700
            }}>
              <div style={{ width:18, height:18, borderRadius:'50%', backgroundColor:'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900 }}>
                {u.name?.charAt(0)}
              </div>
              {u.name}
              {!disabled && (
                <button type="button" onClick={e => remove(e, u.id)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.8)', padding:0, lineHeight:1, fontSize:14, display:'flex', alignItems:'center' }}>
                  <X size={12}/>
                </button>
              )}
            </span>
          ))
        )}
        {!disabled && (
          <ChevronDown size={14} style={{ color:'var(--text-muted)', marginLeft:'auto', flexShrink:0, transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}/>
        )}
      </div>

      {/* Dropdown */}
      {open && !disabled && (
        <div style={{
          position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:200,
          backgroundColor:'var(--bg-surface)', border:'1.5px solid var(--border)',
          borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.3)',
          maxHeight:220, overflowY:'auto'
        }}>
          {users.length === 0 ? (
            <div style={{ padding:'12px 16px', fontSize:13, color:'var(--text-muted)', textAlign:'center' }}>Không có người dùng</div>
          ) : users.map(u => {
            const selected = selectedIds.includes(u.id);
            return (
              <div key={u.id} onClick={() => toggle(u.id)}
                style={{
                  display:'flex', alignItems:'center', gap:10, padding:'9px 14px',
                  cursor:'pointer',
                  backgroundColor: selected ? 'rgba(14,165,233,0.08)' : 'transparent',
                  transition:'background 0.12s'
                }}
                onMouseEnter={e => { if(!selected) e.currentTarget.style.backgroundColor='var(--bg-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = selected ? 'rgba(14,165,233,0.08)' : 'transparent'; }}>
                <div style={{ width:30, height:30, borderRadius:'50%', backgroundColor:u.color||'#6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, color:'#fff', flexShrink:0 }}>
                  {u.name?.charAt(0)}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{u.name}</div>
                  {u.department && <div style={{ fontSize:11, color:'var(--text-muted)' }}>{u.department}</div>}
                </div>
                {selected && <Check size={15} style={{ color:'#0ea5e9', flexShrink:0 }}/>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
