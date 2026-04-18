import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CircleIcon from '@mui/icons-material/Circle';
import StarIcon from '@mui/icons-material/Star';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const vehicleIcons = {
  motorcycle: <TwoWheelerIcon style={{ fontSize: '1.2rem' }} />,
  bicycle: <DirectionsBikeIcon style={{ fontSize: '1.2rem' }} />,
  car: <DirectionsCarIcon style={{ fontSize: '1.2rem' }} />,
};

const s = {
  header: { marginBottom: '1.5rem' },
  title: { fontFamily: 'Poppins', fontSize: '1.5rem', fontWeight: 800 },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem', marginBottom: '1.5rem',
  },
  statCard: {
    background: '#fff', borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow)', padding: '1rem 1.25rem', textAlign: 'center',
  },
  statNum: { fontSize: '1.6rem', fontWeight: 800 },
  statLabel: { fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '0.15rem' },
  table: {
    width: '100%', background: '#fff', borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow)', overflow: 'hidden',
  },
  th: {
    textAlign: 'left', padding: '0.85rem 1rem', fontSize: '0.75rem',
    fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase',
    letterSpacing: '0.05em', borderBottom: '1px solid var(--border)',
    background: 'var(--surface-2)',
  },
  td: {
    padding: '0.85rem 1rem', fontSize: '0.9rem', borderBottom: '1px solid var(--surface-2)',
    verticalAlign: 'middle',
  },
  nameCell: { display: 'flex', alignItems: 'center', gap: '0.65rem' },
  avatar: {
    width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
  },
  actionBtn: {
    padding: '0.35rem 0.75rem', borderRadius: 'var(--radius)',
    border: 'none', fontSize: '0.78rem', fontWeight: 600,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
  },
};

export default function AdminDeliveryPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPartners(); }, []);

  const loadPartners = async () => {
    try {
      // Use admin users API with role filter
      const { data } = await adminAPI.getUsers({ role: 'delivery' });
      setPartners(data.users || []);
    } catch {}
    setLoading(false);
  };

  const handleToggle = async (id) => {
    try {
      await adminAPI.toggleUser(id);
      setPartners(prev => prev.map(p =>
        p._id === id ? { ...p, isActive: !p.isActive } : p
      ));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete this delivery partner? This cannot be undone.')) return;
    try {
      await adminAPI.deleteUser(id);
      setPartners(prev => prev.filter(p => p._id !== id));
      toast.success('Partner deleted completely');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const online = partners.filter(p => p.isActive !== false);
  const total = partners.length;

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>🚚 Delivery Partners</h1>
        <p style={{ color: 'var(--text-3)', fontSize: '0.9rem' }}>{total} partners registered</p>
      </div>

      {/* Stats */}
      <div style={s.statsRow}>
        <motion.div whileHover={{ y: -2 }} style={s.statCard}>
          <p style={{ ...s.statNum, color: 'var(--primary)' }}>{total}</p>
          <p style={s.statLabel}>Total Partners</p>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} style={s.statCard}>
          <p style={{ ...s.statNum, color: 'var(--secondary)' }}>{online.length}</p>
          <p style={s.statLabel}>Active</p>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} style={s.statCard}>
          <p style={{ ...s.statNum, color: 'var(--accent)' }}>{total - online.length}</p>
          <p style={s.statLabel}>Blocked</p>
        </motion.div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="shimmer" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
      ) : partners.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={s.table} cellSpacing={0}>
            <thead>
              <tr>
                <th style={s.th}>Partner</th>
                <th style={s.th}>Phone</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Verified</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {partners.map(p => (
                <tr key={p._id} style={{ transition: '0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={s.td}>
                    <div style={s.nameCell}>
                      <div style={s.avatar}>
                        {p.name?.charAt(0) || <PersonIcon style={{ fontSize: '1rem' }} />}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                          {p.address?.city || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={s.td}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                      <PhoneIcon style={{ fontSize: '0.85rem', color: 'var(--text-3)' }} />
                      {p.phone}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      padding: '0.2rem 0.6rem', borderRadius: 999,
                      fontSize: '0.75rem', fontWeight: 700,
                      background: p.isActive !== false ? '#D1FAE5' : '#FEE2E2',
                      color: p.isActive !== false ? '#065F46' : '#991B1B',
                    }}>
                      <CircleIcon style={{ fontSize: '0.5rem' }} />
                      {p.isActive !== false ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 600,
                      color: p.isVerified ? 'var(--secondary)' : 'var(--text-3)',
                    }}>
                      {p.isVerified ? '✅ Verified' : '⏳ Pending'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={() => handleToggle(p._id)}
                        style={{
                          ...s.actionBtn,
                          background: p.isActive !== false ? '#FEE2E2' : '#D1FAE5',
                          color: p.isActive !== false ? '#DC2626' : '#059669',
                        }}
                      >
                        {p.isActive !== false
                          ? <><BlockIcon style={{ fontSize: '0.85rem' }} /> Block</>
                          : <><CheckCircleIcon style={{ fontSize: '0.85rem' }} /> Activate</>
                        }
                      </motion.button>
                      
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(p._id)}
                        style={{
                          ...s.actionBtn,
                          background: '#EF4444',
                          color: '#FFFFFF',
                        }}
                      >
                        Delete
                      </motion.button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)', background: '#fff', borderRadius: 'var(--radius-lg)' }}>
          <LocalShippingIcon style={{ fontSize: '3rem', opacity: 0.3 }} />
          <p style={{ fontWeight: 600, marginTop: '0.5rem' }}>No delivery partners yet</p>
        </div>
      )}
    </div>
  );
}
