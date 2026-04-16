import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../services/api';
import { updateUser, logout } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import LogoutIcon from '@mui/icons-material/Logout';
import CloseIcon from '@mui/icons-material/Close';
import BadgeIcon from '@mui/icons-material/Badge';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const roleIcons = {
  customer: <ShoppingBagIcon />, vendor: <StorefrontIcon />,
  delivery: <LocalShippingIcon />, admin: <AdminPanelSettingsIcon />,
};
const roleColors = {
  customer: '#059669', vendor: '#4338CA', delivery: '#D97706', admin: '#DC2626',
};

const s = {
  page: { maxWidth: 700, margin: '0 auto' },
  header: {
    background: 'var(--gradient-1)', borderRadius: 'var(--radius-xl)',
    padding: '2.5rem 2rem', color: '#fff', position: 'relative',
    overflow: 'hidden', marginBottom: '1.5rem', textAlign: 'center',
  },
  avatar: {
    width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 0.75rem', border: '3px solid rgba(255,255,255,0.4)',
  },
  card: {
    background: '#fff', borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow)', padding: '1.5rem 2rem', marginBottom: '1rem',
  },
  sectionTitle: {
    fontFamily: 'Poppins', fontWeight: 700, fontSize: '1rem',
    marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
  },
  fieldRow: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.75rem 0', borderBottom: '1px solid var(--surface-2)',
  },
  fieldIcon: { color: 'var(--text-3)', fontSize: '1.2rem', minWidth: 24 },
  fieldLabel: { fontSize: '0.75rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  fieldValue: { fontSize: '0.95rem', fontWeight: 500 },
  input: {
    width: '100%', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)',
    padding: '0.65rem 0.85rem', fontSize: '0.9rem', fontFamily: 'Inter',
    background: 'var(--surface)', outline: 'none',
  },
  btn: {
    padding: '0.75rem 1.5rem', border: 'none', borderRadius: 'var(--radius)',
    fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter',
    display: 'flex', alignItems: 'center', gap: '0.4rem', transition: '0.2s',
  },
};

export default function UserProfile() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    pincode: user?.address?.pincode || '',
  });

  const handleChange = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await authAPI.updateProfile({
        name: form.name,
        email: form.email,
        address: { street: form.street, city: form.city, state: form.state, pincode: form.pincode },
      });
      dispatch(updateUser(data.user));
      toast.success('Profile updated! ✨');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
    setSaving(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out');
    navigate('/login');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const roleBg = roleColors[user.role] || 'var(--primary)';

  return (
    <div style={s.page}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={s.header}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={s.avatar}>
          <PersonIcon style={{ fontSize: '2.5rem' }} />
        </div>
        <h1 style={{ fontFamily: 'Poppins', fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          {user.name}
        </h1>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          background: 'rgba(255,255,255,0.2)', borderRadius: 999,
          padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: 600,
        }}>
          {roleIcons[user.role]} {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
        </span>
      </motion.div>

      {/* Personal Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }} style={s.card}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={s.sectionTitle}><BadgeIcon style={{ color: 'var(--primary)' }} /> Personal Info</h2>
          {!editing ? (
            <button onClick={() => setEditing(true)}
              style={{ ...s.btn, background: 'var(--surface-2)', color: 'var(--primary)' }}
            >
              <EditIcon style={{ fontSize: '1rem' }} /> Edit
            </button>
          ) : (
            <button onClick={() => setEditing(false)}
              style={{ ...s.btn, background: 'var(--surface-2)', color: 'var(--text-3)' }}
            >
              <CloseIcon style={{ fontSize: '1rem' }} /> Cancel
            </button>
          )}
        </div>

        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div>
              <label style={s.fieldLabel}>Full Name</label>
              <input style={s.input} value={form.name} onChange={e => handleChange('name', e.target.value)} />
            </div>
            <div>
              <label style={s.fieldLabel}>Email</label>
              <input style={s.input} value={form.email} onChange={e => handleChange('email', e.target.value)} type="email" />
            </div>
            <div>
              <label style={s.fieldLabel}>Phone (read only)</label>
              <input style={{ ...s.input, opacity: 0.5 }} value={form.phone} disabled />
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
              style={{ ...s.btn, background: 'var(--gradient-2)', color: '#fff', justifyContent: 'center', opacity: saving ? 0.6 : 1 }}
            >
              <SaveIcon style={{ fontSize: '1rem' }} /> {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </div>
        ) : (
          <>
            <div style={s.fieldRow}>
              <PersonIcon style={s.fieldIcon} />
              <div><p style={s.fieldLabel}>Name</p><p style={s.fieldValue}>{user.name}</p></div>
            </div>
            <div style={s.fieldRow}>
              <PhoneIcon style={s.fieldIcon} />
              <div><p style={s.fieldLabel}>Phone</p><p style={s.fieldValue}>{user.phone}</p></div>
            </div>
            <div style={s.fieldRow}>
              <EmailIcon style={s.fieldIcon} />
              <div><p style={s.fieldLabel}>Email</p><p style={s.fieldValue}>{user.email || 'Not set'}</p></div>
            </div>
          </>
        )}
      </motion.div>

      {/* Address */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }} style={s.card}
      >
        <h2 style={s.sectionTitle}><LocationOnIcon style={{ color: 'var(--secondary)' }} /> Address</h2>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={s.fieldLabel}>Street</label>
              <input style={s.input} value={form.street} onChange={e => handleChange('street', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={s.fieldLabel}>City</label>
                <input style={s.input} value={form.city} onChange={e => handleChange('city', e.target.value)} />
              </div>
              <div>
                <label style={s.fieldLabel}>State</label>
                <input style={s.input} value={form.state} onChange={e => handleChange('state', e.target.value)} />
              </div>
            </div>
            <div>
              <label style={s.fieldLabel}>Pincode</label>
              <input style={s.input} value={form.pincode} onChange={e => handleChange('pincode', e.target.value)} />
            </div>
          </div>
        ) : (
          <div style={s.fieldRow}>
            <LocationOnIcon style={s.fieldIcon} />
            <div>
              <p style={s.fieldLabel}>Delivery Address</p>
              <p style={s.fieldValue}>
                {user.address ? `${user.address.street || ''}, ${user.address.city || ''}, ${user.address.state || ''} ${user.address.pincode || ''}`.replace(/^,\s*|,\s*$/g, '') || 'Not set' : 'Not set'}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Logout */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ textAlign: 'center', marginTop: '1rem', marginBottom: '2rem' }}
      >
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          style={{
            ...s.btn, background: '#FEE2E2', color: '#DC2626', justifyContent: 'center',
            width: '100%', padding: '1rem',
          }}
        >
          <LogoutIcon /> Sign Out
        </motion.button>
      </motion.div>
    </div>
  );
}
