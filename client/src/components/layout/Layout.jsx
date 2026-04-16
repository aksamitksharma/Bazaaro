import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1, padding: '1.5rem', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
