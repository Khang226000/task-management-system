import React, { useEffect, useState } from 'react';

export default function LoadingScreen({ onDone }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Animate dots
    const dotInterval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 400);

    // Auto finish after 1.8s
    const timer = setTimeout(() => {
      clearInterval(dotInterval);
      onDone();
    }, 1800);

    return () => { clearInterval(dotInterval); clearTimeout(timer); };
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: '#0b1929',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 24
    }}>
      {/* Spinning ring */}
      <div style={{ position: 'relative', width: 64, height: 64 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          border: '3px solid rgba(20,184,166,0.15)',
          borderTopColor: '#14b8a6',
          animation: 'spin 0.9s linear infinite'
        }}/>
        {/* Inner glow */}
        <div style={{
          position: 'absolute', inset: 8,
          borderRadius: '50%',
          border: '1px solid rgba(20,184,166,0.2)',
          borderTopColor: 'rgba(20,184,166,0.5)',
          animation: 'spin 1.4s linear infinite reverse'
        }}/>
      </div>

      {/* Text */}
      <p style={{
        fontSize: 15, fontWeight: 600,
        color: '#14b8a6',
        letterSpacing: '0.05em',
        fontFamily: 'Inter, sans-serif',
        minWidth: 160, textAlign: 'center'
      }}>
        Đang tải dữ liệu{dots}
      </p>
    </div>
  );
}
