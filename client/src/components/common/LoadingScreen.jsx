import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', width: '100vw', background: 'var(--surface)', gap: '2rem',
      position: 'fixed', top: 0, left: 0, zIndex: 9999,
    }}>
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--gradient-1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px rgba(49,46,129,0.3)',
        }}
      >
        <span style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 800 }}>B</span>
      </motion.div>
      <motion.p
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-2)' }}
      >
        Loading Bazaaro...
      </motion.p>
    </div>
  );
}
