import React, { useState, useCallback, useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { _registerConfirm } from '../utils/confirm';

let _resolve = null;

export default function ConfirmDialog() {
  const [visible, setVisible] = useState(false);
  const [opts, setOpts] = useState({});

  const show = useCallback((options) => {
    return new Promise((resolve) => {
      _resolve = resolve;
      setOpts(options);
      setVisible(true);
    });
  }, []);

  useEffect(() => {
    _registerConfirm(show);
  }, [show]);

  // Đóng bằng Escape
  useEffect(() => {
    if (!visible) return;
    const handler = (e) => { if (e.key === 'Escape') handleCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible]);

  const handleConfirm = () => {
    setVisible(false);
    if (_resolve) { _resolve(true); _resolve = null; }
  };

  const handleCancel = () => {
    setVisible(false);
    if (_resolve) { _resolve(false); _resolve = null; }
  };

  if (!visible) return null;

  const isDanger = opts.danger !== false; // mặc định là danger (đỏ)
  const confirmLabel = opts.confirmLabel || 'Xác nhận';
  const cancelLabel  = opts.cancelLabel  || 'Huỷ';
  const title        = opts.title        || 'Xác nhận';
  const message      = opts.message      || 'Bạn có chắc không?';

  return (
    <div
      onClick={handleCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-surface, #1e2130)',
          border: '1.5px solid var(--border, #2d3148)',
          borderRadius: 16,
          padding: '28px 28px 24px',
          width: '100%',
          maxWidth: 420,
          margin: '0 16px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          animation: 'slideUp 0.18s ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            backgroundColor: isDanger ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isDanger
              ? <Trash2 size={20} style={{ color: '#ef4444' }} />
              : <AlertTriangle size={20} style={{ color: '#6366f1' }} />
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary, #f1f5f9)', marginBottom: 6 }}>
              {title}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.5 }}>
              {message}
            </div>
          </div>
          <button
            onClick={handleCancel}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #64748b)', padding: 2, display: 'flex', flexShrink: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            onClick={handleCancel}
            style={{
              padding: '9px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              border: '1.5px solid var(--border, #2d3148)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary, #94a3b8)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover, #2d3148)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '9px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              backgroundColor: isDanger ? '#ef4444' : '#6366f1',
              color: '#fff',
              boxShadow: isDanger ? '0 4px 14px rgba(239,68,68,0.35)' : '0 4px 14px rgba(99,102,241,0.35)',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
      `}</style>
    </div>
  );
}
