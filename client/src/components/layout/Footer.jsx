import React from 'react';

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--primary-dark)', color: 'rgba(255,255,255,0.7)',
      padding: '2rem 1.5rem', marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
        alignItems: 'center', gap: '1rem',
      }}>
        <div>
          <p style={{
            fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.25rem',
            background: 'linear-gradient(135deg, #6366F1, #10B981)', WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent', marginBottom: '0.25rem',
          }}>
            🛒 Bazaaro
          </p>
          <p style={{ fontSize: '0.8rem' }}>Your hyperlocal marketplace</p>
        </div>
        <p style={{ fontSize: '0.75rem' }}>© {new Date().getFullYear()} Bazaaro. Built with ❤️</p>
      </div>
      <div style={{
        height: 3, borderRadius: 2,
        background: 'linear-gradient(90deg, #312E81, #059669, #D97706)',
        marginTop: '1.5rem', opacity: 0.5,
      }}/>
    </footer>
  );
}
