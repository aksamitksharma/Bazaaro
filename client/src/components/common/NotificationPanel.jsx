import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationAPI } from '../../services/api';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import StorefrontIcon from '@mui/icons-material/Storefront';
import InfoIcon from '@mui/icons-material/Info';
import DoneAllIcon from '@mui/icons-material/DoneAll';

const typeIcons = {
  order: <ShoppingBagIcon style={{ fontSize: '1.1rem' }} />,
  delivery: <LocalShippingIcon style={{ fontSize: '1.1rem' }} />,
  vendor: <StorefrontIcon style={{ fontSize: '1.1rem' }} />,
  info: <InfoIcon style={{ fontSize: '1.1rem' }} />,
  default: <NotificationsIcon style={{ fontSize: '1.1rem' }} />,
};
const typeColors = {
  order: '#4338CA', delivery: '#D97706', vendor: '#059669', info: '#6366F1', default: '#64748B',
};

const s = {
  wrapper: { position: 'relative' },
  bellBtn: {
    position: 'relative', background: 'none', border: 'none',
    cursor: 'pointer', padding: '0.4rem', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: '0.2s',
  },
  badge: {
    position: 'absolute', top: 0, right: 0, width: 18, height: 18,
    borderRadius: '50%', background: '#DC2626', color: '#fff',
    fontSize: '0.65rem', fontWeight: 800, display: 'flex',
    alignItems: 'center', justifyContent: 'center', border: '2px solid #fff',
  },
  panel: {
    position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0,
    width: 340, maxHeight: 440, background: '#fff',
    borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)',
    overflow: 'hidden', zIndex: 1000,
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)',
  },
  title: { fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.95rem' },
  markAllBtn: {
    fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 600,
    background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '0.2rem',
  },
  list: { maxHeight: 360, overflowY: 'auto' },
  item: {
    display: 'flex', gap: '0.75rem', padding: '0.85rem 1.25rem',
    borderBottom: '1px solid var(--surface-2)', transition: '0.15s',
    cursor: 'pointer',
  },
  iconCircle: {
    width: 36, height: 36, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  empty: {
    padding: '2.5rem', textAlign: 'center', color: 'var(--text-3)',
  },
};

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef();

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const loadNotifications = async () => {
    try {
      const { data } = await notificationAPI.getAll({ limit: 20 });
      const items = data.notifications || [];
      setNotifications(items);
      setUnread(items.filter(n => !n.isRead).length);
    } catch {}
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnread(u => Math.max(0, u - 1));
    } catch {}
  };

  const handleMarkAll = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {}
  };

  const timeAgo = (date) => {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div style={s.wrapper} ref={panelRef}>
      <motion.button whileTap={{ scale: 0.9 }} style={s.bellBtn}
        onClick={() => setOpen(!open)} id="notification-bell"
      >
        <NotificationsIcon style={{ fontSize: '1.5rem', color: 'var(--text-2)' }} />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={s.badge}>
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }} style={s.panel}
          >
            <div style={s.header}>
              <span style={s.title}>Notifications</span>
              {unread > 0 && (
                <button style={s.markAllBtn} onClick={handleMarkAll}>
                  <DoneAllIcon style={{ fontSize: '0.85rem' }} /> Mark all read
                </button>
              )}
            </div>
            <div style={s.list}>
              {notifications.length > 0 ? notifications.map(n => {
                const type = n.type || 'default';
                const color = typeColors[type] || typeColors.default;
                return (
                  <motion.div key={n._id} whileHover={{ background: 'var(--surface)' }}
                    style={{ ...s.item, background: n.isRead ? 'transparent' : '#F8FAFF' }}
                    onClick={() => !n.isRead && handleMarkRead(n._id)}
                  >
                    <div style={{ ...s.iconCircle, background: `${color}15`, color }}>
                      {typeIcons[type] || typeIcons.default}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '0.85rem', fontWeight: n.isRead ? 400 : 600,
                        color: 'var(--text)', lineHeight: 1.4,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {n.title || n.message}
                      </p>
                      {n.message && n.title && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '0.1rem',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {n.message}
                        </p>
                      )}
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {!n.isRead && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, marginTop: '0.5rem' }} />
                    )}
                  </motion.div>
                );
              }) : (
                <div style={s.empty}>
                  <NotificationsIcon style={{ fontSize: '2.5rem', opacity: 0.2, marginBottom: '0.5rem' }} />
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>All caught up!</p>
                  <p style={{ fontSize: '0.8rem' }}>No notifications yet</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
