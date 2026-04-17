import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import NotificationPanel from '../common/NotificationPanel';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { logout } from '../../store/slices/authSlice';
import { selectCartCount } from '../../store/slices/cartSlice';
import { useTranslation } from 'react-i18next';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HomeIcon from '@mui/icons-material/Home';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CloseIcon from '@mui/icons-material/Close';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LocalShippingIcon2 from '@mui/icons-material/LocalShipping';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const styles = {
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--border)',
    padding: '0 1.5rem', height: 64,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  logo: {
    fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.5rem',
    background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    textDecoration: 'none',
  },
  right: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  iconBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-2)', transition: '0.2s',
    position: 'relative',
  },
  badge: {
    position: 'absolute', top: 2, right: 2,
    background: 'var(--danger)', color: '#fff', fontSize: '0.65rem', fontWeight: 700,
    borderRadius: '50%', width: 18, height: 18,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  userBtn: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.35rem 0.9rem', borderRadius: 999, border: '1px solid var(--border)',
    background: 'var(--surface)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
    color: 'var(--text)',
  },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    background: '#fff', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--border)', minWidth: 200, overflow: 'hidden',
    zIndex: 200,
  },
  dropItem: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.75rem 1rem', fontSize: '0.9rem', color: 'var(--text)',
    cursor: 'pointer', transition: '0.15s', textDecoration: 'none', border: 'none',
    background: 'none', width: '100%',
  },
  mobileMenu: {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    background: 'rgba(0,0,0,0.4)', zIndex: 999,
    display: 'flex',
  },
  mobilePanel: {
    width: 280, background: '#fff', height: '100%', padding: '1.5rem',
    display: 'flex', flexDirection: 'column', gap: '0.25rem',
    boxShadow: 'var(--shadow-xl)',
  },
  mobileLink: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.75rem 0.5rem', fontSize: '0.95rem', color: 'var(--text)',
    textDecoration: 'none', borderRadius: 'var(--radius)', transition: '0.15s',
  },
};

export default function Navbar({ onToggleSidebar }) {
  const { isAuthenticated, user } = useSelector(s => s.auth);
  const cartCount = useSelector(selectCartCount);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobile, setShowMobile] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'hi' ? 'en' : 'hi';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = () => {
    dispatch(logout());
    setShowDropdown(false);
    setShowMobile(false);
    navigate('/login');
  };

  const roleLinks = {
    customer: [
      { to: '/', icon: <HomeIcon fontSize="small"/>, label: 'Home' },
      { to: '/orders', icon: <ReceiptLongIcon fontSize="small"/>, label: 'My Orders' },
    ],
    vendor: [
      { to: '/vendor', icon: <DashboardIcon fontSize="small"/>, label: 'Dashboard' },
      { to: '/vendor/products', icon: <StorefrontIcon fontSize="small"/>, label: 'Products' },
      { to: '/vendor/orders', icon: <ReceiptLongIcon fontSize="small"/>, label: 'Orders' },
    ],
    delivery: [
      { to: '/delivery', icon: <LocalShippingIcon fontSize="small"/>, label: 'Dashboard' },
    ],
    admin: [
      { to: '/admin', icon: <AdminPanelSettingsIcon fontSize="small"/>, label: 'Dashboard' },
      { to: '/admin/users', icon: <PersonIcon fontSize="small"/>, label: 'Users' },
      { to: '/admin/vendors', icon: <StorefrontIcon fontSize="small"/>, label: 'Vendors' },
      { to: '/admin/orders', icon: <ReceiptLongIcon fontSize="small"/>, label: 'Orders' },
      { to: '/admin/coupons', icon: <LocalOfferIcon fontSize="small"/>, label: 'Coupons' },
      { to: '/admin/delivery-partners', icon: <LocalShippingIcon2 fontSize="small"/>, label: 'Delivery' },
      { to: '/admin/analytics', icon: <BarChartIcon fontSize="small"/>, label: 'Analytics' },
    ],
  };

  const links = roleLinks[user?.role] || roleLinks.customer;

  return (
    <>
      <nav style={styles.nav}>
        {/* Left: Menu + Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button style={styles.iconBtn} onClick={() => setShowMobile(true)} className="mobile-only">
            <MenuIcon />
          </button>
          <Link to="/" style={styles.logo}>🛒 Bazaaro</Link>
        </div>

        {/* Desktop nav links */}
        <div className="desktop-nav" style={{ display: 'flex', gap: '0.25rem', marginLeft: '2rem' }}>
          {links.map(l => (
            <Link key={l.to} to={l.to} style={{
              ...styles.mobileLink,
              padding: '0.5rem 0.75rem',
              fontSize: '0.85rem',
              fontWeight: location.pathname === l.to ? 600 : 400,
              background: location.pathname === l.to ? 'var(--surface-2)' : 'transparent',
            }}>
              {l.icon} {l.label}
            </Link>
          ))}
        </div>

        {/* Right: Cart + User */}
        <div style={styles.right}>
          <button style={{ ...styles.iconBtn, fontSize: '0.9rem', fontWeight: 700 }} onClick={toggleLanguage}>
            {i18n.language === 'hi' ? 'EN' : 'HI'}
          </button>
          
          {isAuthenticated && <NotificationPanel />}
          {(!user || user.role === 'customer') && (
            <button style={styles.iconBtn} onClick={() => navigate('/cart')}>
              <ShoppingCartIcon />
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={styles.badge}
                >
                  {cartCount}
                </motion.span>
              )}
            </button>
          )}

          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button style={styles.userBtn} onClick={() => setShowDropdown(!showDropdown)}>
                <PersonIcon fontSize="small" />
                <span className="desktop-only">{user?.name?.split(' ')[0]}</span>
              </button>
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }} style={styles.dropdown}
                  >
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', textTransform: 'capitalize' }}>{user?.role}</p>
                    </div>
                    <Link to="/profile" style={styles.dropItem}
                      onClick={() => setShowDropdown(false)}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <AccountCircleIcon fontSize="small" style={{ color: 'var(--primary)' }} /> Profile
                    </Link>
                    <button style={styles.dropItem} onClick={handleLogout}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogoutIcon fontSize="small" style={{ color: 'var(--danger)' }} /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button style={styles.userBtn} onClick={() => navigate('/login')}>
              <LoginIcon fontSize="small" /> <span>Login</span>
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Slide Menu */}
      <AnimatePresence>
        {showMobile && (
          <div style={styles.mobileMenu} onClick={() => setShowMobile(false)}>
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={styles.mobilePanel}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ ...styles.logo, fontSize: '1.3rem' }}>🛒 Bazaaro</span>
                <button style={styles.iconBtn} onClick={() => setShowMobile(false)}><CloseIcon /></button>
              </div>
              {links.map(l => (
                <Link key={l.to} to={l.to} style={{
                  ...styles.mobileLink,
                  fontWeight: location.pathname === l.to ? 600 : 400,
                  background: location.pathname === l.to ? 'var(--surface-2)' : 'transparent',
                }}
                  onClick={() => setShowMobile(false)}
                >
                  {l.icon} {l.label}
                </Link>
              ))}
              {isAuthenticated && (
                <button style={{ ...styles.mobileLink, border: 'none', background: 'none', cursor: 'pointer', marginTop: 'auto', color: 'var(--danger)' }}
                  onClick={handleLogout}
                >
                  <LogoutIcon fontSize="small" /> Logout
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .desktop-nav { display: none !important; }
        .desktop-only { display: none !important; }
        .mobile-only { display: flex !important; }
        @media (min-width: 769px) {
          .desktop-nav { display: flex !important; }
          .desktop-only { display: inline !important; }
          .mobile-only { display: none !important; }
        }
      `}</style>
    </>
  );
}
