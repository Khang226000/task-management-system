import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('React Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: '#0f1117', color: '#e2e8f0',
          fontFamily: 'monospace', padding: '24px'
        }}>
          <div style={{ maxWidth: '600px', width: '100%' }}>
            <div style={{ color: '#ef4444', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              ⚠ Lỗi ứng dụng
            </div>
            <div style={{
              background: '#1e2535', border: '1px solid #374151',
              borderRadius: '8px', padding: '16px', fontSize: '13px',
              color: '#f87171', whiteSpace: 'pre-wrap', wordBreak: 'break-all'
            }}>
              {this.state.error?.message}
              {'\n\n'}
              {this.state.error?.stack}
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '16px', padding: '8px 20px', background: '#6366f1',
                color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'
              }}
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
