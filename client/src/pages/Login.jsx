import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { setCredentials, setLoading } from '../store/slices/authSlice';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const s = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 40%, #4338CA 100%)',
    padding: '1rem',
  },
  card: {
    background: '#fff', borderRadius: 'var(--radius-xl)', padding: '2.5rem 2rem',
    width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-xl)',
  },
  logo: {
    fontFamily: 'Poppins', fontWeight: 800, fontSize: '2rem', textAlign: 'center',
    background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    marginBottom: '0.25rem',
  },
  subtitle: { textAlign: 'center', color: 'var(--text-3)', fontSize: '0.9rem', marginBottom: '2rem' },
  inputGroup: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    border: '1.5px solid var(--border)', borderRadius: 'var(--radius)',
    padding: '0.75rem 1rem', transition: '0.2s', marginBottom: '1rem',
    background: 'var(--surface)',
  },
  input: {
    border: 'none', outline: 'none', flex: 1, fontSize: '0.95rem',
    background: 'transparent', fontFamily: 'Inter', color: 'var(--text)',
  },
  btn: {
    width: '100%', padding: '0.9rem', border: 'none', borderRadius: 'var(--radius)',
    background: 'var(--gradient-1)', color: '#fff', fontSize: '1rem', fontWeight: 700,
    cursor: 'pointer', marginTop: '0.5rem', fontFamily: 'Inter',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    transition: '0.2s',
  },
  link: { color: 'var(--primary-light)', fontWeight: 600, textDecoration: 'none' },
  footer: { textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-2)' },
  divider: {
    display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0',
    color: 'var(--text-3)', fontSize: '0.8rem',
  },
  otpBtn: {
    width: '100%', padding: '0.9rem', border: '2px solid var(--primary)',
    borderRadius: 'var(--radius)', background: 'transparent', color: 'var(--primary)',
    fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter',
    transition: '0.2s',
  },
};

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector(s => s.auth);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phone) return toast.error('Enter phone number');
    dispatch(setLoading(true));
    try {
      const { data } = await authAPI.login({ phone, password: password || phone + '123' });
      dispatch(setCredentials({ user: data.user, token: data.token }));
      toast.success('Welcome back! 🎉');
      const role = data.user.role;
      navigate(role === 'vendor' ? '/vendor' : role === 'delivery' ? '/delivery' : role === 'admin' ? '/admin' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleSendOTP = async () => {
    if (!phone) return toast.error('Enter phone number');
    try {
      const { data } = await authAPI.sendOTP({ phone });
      setOtpSent(true);
      toast.success(`OTP sent! ${data.otp ? `(Dev: ${data.otp})` : ''}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error('Enter OTP');
    dispatch(setLoading(true));
    try {
      const { data } = await authAPI.verifyOTP({ phone, otp });
      dispatch(setCredentials({ user: data.user, token: data.token }));
      toast.success('Welcome! 🎉');
      const role = data.user.role;
      navigate(role === 'vendor' ? '/vendor' : role === 'delivery' ? '/delivery' : role === 'admin' ? '/admin' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div style={s.page}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }} style={s.card}
      >
        <p style={s.logo}>🛒 Bazaaro</p>
        <p style={s.subtitle}>Sign in to your marketplace account</p>

        {!otpMode ? (
          <form onSubmit={handleLogin}>
            <div style={s.inputGroup}>
              <PhoneAndroidIcon style={{ color: 'var(--text-3)' }} />
              <input style={s.input} placeholder="Phone number" value={phone}
                onChange={e => setPhone(e.target.value)} type="tel" id="login-phone" />
            </div>

            <div style={s.inputGroup}>
              <LockIcon style={{ color: 'var(--text-3)' }} />
              <input style={s.input} placeholder="Password (or leave blank)" type={showPwd ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)} id="login-password" />
              <button type="button" style={{ ...s.input, flex: 'none', cursor: 'pointer', width: 24 }}
                onClick={() => setShowPwd(!showPwd)}>
                {showPwd ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
              </button>
            </div>

            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              style={{ ...s.btn, opacity: loading ? 0.6 : 1 }} disabled={loading} type="submit" id="login-btn">
              {loading ? 'Signing in...' : <>Sign In <ArrowForwardIcon fontSize="small" /></>}
            </motion.button>

            <div style={s.divider}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span>or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <button type="button" style={s.otpBtn} onClick={() => setOtpMode(true)} id="otp-mode-btn">
              Login with OTP
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <div style={s.inputGroup}>
              <PhoneAndroidIcon style={{ color: 'var(--text-3)' }} />
              <input style={s.input} placeholder="Phone number" value={phone}
                onChange={e => setPhone(e.target.value)} type="tel" id="otp-phone" />
            </div>

            {otpSent && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <div style={s.inputGroup}>
                  <LockIcon style={{ color: 'var(--text-3)' }} />
                  <input style={s.input} placeholder="Enter OTP (dev: 123456)" value={otp}
                    onChange={e => setOtp(e.target.value)} maxLength={6} id="otp-input" />
                </div>
              </motion.div>
            )}

            {!otpSent ? (
              <button type="button" style={s.btn} onClick={handleSendOTP} id="send-otp-btn">
                Send OTP <ArrowForwardIcon fontSize="small" />
              </button>
            ) : (
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                style={{ ...s.btn, opacity: loading ? 0.6 : 1 }} disabled={loading} type="submit" id="verify-otp-btn">
                {loading ? 'Verifying...' : 'Verify & Login'}
              </motion.button>
            )}

            <button type="button" style={{ ...s.otpBtn, marginTop: '1rem' }}
              onClick={() => { setOtpMode(false); setOtpSent(false); setOtp(''); }}>
              Back to Password Login
            </button>
          </form>
        )}

        <p style={s.footer}>
          Don't have an account? <Link to="/register" style={s.link}>Register</Link>
        </p>
      </motion.div>
    </div>
  );
}
