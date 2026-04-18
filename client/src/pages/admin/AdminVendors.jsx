import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

export default function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadVendors(); }, []);

  const loadVendors = async () => {
    try {
      const { data } = await adminAPI.getVendors();
      setVendors(data.vendors || []);
    } catch { }
    setLoading(false);
  };

  const handleApprove = async (id, approved) => {
    try {
      await adminAPI.approveVendor(id, { isApproved: approved });
      toast.success(approved ? 'Vendor approved! ✅' : 'Vendor rejected');
      loadVendors();
    } catch { toast.error('Action failed'); }
  };

  const handleDelete = async (userId, vendorId) => {
    if(!window.confirm('Delete this vendor? This cannot be undone.')) return;
    try {
      await adminAPI.deleteUser(userId);
      setVendors(prev => prev.filter(v => v._id !== vendorId));
      toast.success('Vendor deleted successfully');
    } catch {
      toast.error('Failed to delete vendor');
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <StorefrontIcon style={{ color: 'var(--primary)' }} /> Vendor Management
      </h1>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3].map(i => <div key={i} className="shimmer" style={{ height: 90, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : vendors.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {vendors.map((v, i) => (
            <motion.div key={v._id} initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{
                background: '#fff', borderRadius: 'var(--radius-lg)', padding: '1.25rem',
                boxShadow: 'var(--shadow)',
                borderLeft: `4px solid ${v.isApproved ? 'var(--secondary)' : 'var(--accent)'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '1rem' }}>{v.shopName}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                    {v.shopCategory} • {v.address?.city || 'Local'}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {v.isApproved ? (
                    <>
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: '0.25rem',
                        padding: '0.3rem 0.75rem', borderRadius: 999,
                        background: '#D1FAE5', color: '#065F46', fontSize: '0.75rem', fontWeight: 700,
                      }}>
                        <CheckCircleIcon style={{ fontSize: '0.85rem' }} /> Approved
                      </span>
                      <button onClick={() => handleDelete(v.userId?._id, v._id)}
                        style={{
                          padding: '0.35rem 0.85rem', borderRadius: 999, border: 'none',
                          background: '#EF4444', color: '#fff', fontSize: '0.8rem',
                          fontWeight: 600, cursor: 'pointer', marginLeft: '0.5rem'
                        }}>
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: '0.25rem',
                        padding: '0.3rem 0.75rem', borderRadius: 999,
                        background: '#FEF3C7', color: '#92400E', fontSize: '0.75rem', fontWeight: 700,
                      }}>
                        <HourglassEmptyIcon style={{ fontSize: '0.85rem' }} /> Pending
                      </span>
                      <button onClick={() => handleApprove(v._id, true)}
                        style={{
                          padding: '0.35rem 0.85rem', borderRadius: 999, border: 'none',
                          background: 'var(--secondary)', color: '#fff', fontSize: '0.8rem',
                          fontWeight: 600, cursor: 'pointer',
                        }}>
                        Approve
                      </button>
                      <button onClick={() => handleApprove(v._id, false)}
                        style={{
                          padding: '0.35rem 0.85rem', borderRadius: 999, border: '1.5px solid var(--danger)',
                          background: 'transparent', color: 'var(--danger)', fontSize: '0.8rem',
                          fontWeight: 600, cursor: 'pointer',
                        }}>
                        Reject
                      </button>
                      <button onClick={() => handleDelete(v.userId?._id, v._id)}
                        style={{
                          padding: '0.35rem 0.85rem', borderRadius: 999, border: 'none',
                          background: '#EF4444', color: '#fff', fontSize: '0.8rem',
                          fontWeight: 600, cursor: 'pointer', marginLeft: '0.5rem'
                        }}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', padding: '3rem', textAlign: 'center', color: 'var(--text-3)' }}>
          <StorefrontIcon style={{ fontSize: '3rem', opacity: 0.3 }} />
          <p style={{ fontWeight: 600, marginTop: '0.5rem' }}>No vendors found</p>
        </div>
      )}
    </div>
  );
}
