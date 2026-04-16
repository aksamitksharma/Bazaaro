import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import PeopleIcon from '@mui/icons-material/People';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const { data } = await adminAPI.getUsers();
      setUsers(data.users || []);
    } catch { }
    setLoading(false);
  };

  const toggleUser = async (id) => {
    try {
      await adminAPI.toggleUser(id);
      toast.success('User status updated');
      loadUsers();
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <PeopleIcon style={{ color: 'var(--primary)' }} /> All Users
      </h1>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 70, borderRadius: 'var(--radius)' }} />)}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 0.8fr 0.6fr 0.5fr',
            padding: '0.85rem 1.25rem', background: 'var(--surface-2)',
            fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <span>Name</span><span>Phone</span><span>Role</span><span>Status</span><span>Action</span>
          </div>
          {users.map((u, i) => (
            <motion.div key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 0.8fr 0.6fr 0.5fr',
                padding: '0.85rem 1.25rem', alignItems: 'center',
                borderBottom: '1px solid var(--border)', fontSize: '0.85rem',
              }}>
              <span style={{ fontWeight: 600 }}>{u.name}</span>
              <span style={{ color: 'var(--text-2)' }}>{u.phone}</span>
              <span style={{
                display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: 999,
                fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize',
                background: u.role === 'admin' ? '#E0E7FF' : u.role === 'vendor' ? '#D1FAE5' : u.role === 'delivery' ? '#FEF3C7' : '#F1F5F9',
                color: u.role === 'admin' ? '#3730A3' : u.role === 'vendor' ? '#065F46' : u.role === 'delivery' ? '#92400E' : '#475569',
              }}>
                {u.role}
              </span>
              <span style={{ color: u.isActive ? 'var(--secondary)' : 'var(--danger)', fontWeight: 600, fontSize: '0.8rem' }}>
                {u.isActive ? '● Active' : '● Blocked'}
              </span>
              <button onClick={() => toggleUser(u._id)}
                style={{
                  padding: '0.3rem 0.6rem', borderRadius: 999, border: 'none',
                  background: u.isActive ? '#FEE2E2' : '#D1FAE5',
                  color: u.isActive ? '#991B1B' : '#065F46',
                  fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                }}>
                {u.isActive ? 'Block' : 'Activate'}
              </button>
            </motion.div>
          ))}
          {users.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)' }}>No users found</div>
          )}
        </div>
      )}
    </div>
  );
}
