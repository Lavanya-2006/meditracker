import React from 'react';

const LoadingScreen = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'var(--bg)',
    flexDirection: 'column',
    gap: 16
  }}>
    <div style={{
      width: 60, height: 60,
      background: 'var(--gradient-primary)',
      borderRadius: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 28,
      animation: 'pulse 1.5s ease infinite'
    }}>🏥</div>
    <div style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>
      Loading MediTracker...
    </div>
    <div style={{
      width: 160,
      height: 3,
      background: 'var(--border)',
      borderRadius: 99,
      overflow: 'hidden'
    }}>
      <div style={{
        height: '100%',
        background: 'var(--gradient-primary)',
        borderRadius: 99,
        animation: 'loading-bar 1.5s ease infinite'
      }} />
    </div>
    <style>{`
      @keyframes loading-bar {
        0% { width: 0%; margin-left: 0; }
        50% { width: 60%; margin-left: 20%; }
        100% { width: 0%; margin-left: 100%; }
      }
    `}</style>
  </div>
);

export default LoadingScreen;
