import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { productAPI, vendorAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CategoryIcon from '@mui/icons-material/Category';
import StarIcon from '@mui/icons-material/Star';
import SearchIcon from '@mui/icons-material/Search';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

const card = {
  background: '#fff', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
  boxShadow: 'var(--shadow)', transition: '0.25s', cursor: 'pointer',
};

const categories = [
  { name: 'Grocery', emoji: '🥦', color: '#D1FAE5' },
  { name: 'Fruits', emoji: '🍎', color: '#FEF3C7' },
  { name: 'Dairy', emoji: '🥛', color: '#DBEAFE' },
  { name: 'Bakery', emoji: '🍞', color: '#FDE68A' },
  { name: 'Snacks', emoji: '🍿', color: '#FCE7F3' },
  { name: 'Beverages', emoji: '🥤', color: '#CFFAFE' },
  { name: 'Meat', emoji: '🍖', color: '#FEE2E2' },
  { name: 'Pharmacy', emoji: '💊', color: '#E0E7FF' },
];

export default function Home() {
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useSelector(s => s.auth);
  const { t } = useTranslation();

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const lat = user?.address?.coordinates?.lat;
      const lng = user?.address?.coordinates?.lng;
      const params = (lat && lng) ? { lat, lng, radius: 20 } : {};

      const [vendorsRes, productsRes] = await Promise.allSettled([
        vendorAPI.getNearby(params),
        productAPI.getAll({ limit: 8 }),
      ]);
      if (vendorsRes.status === 'fulfilled') setShops(vendorsRes.value.data.vendors || []);
      if (productsRes.status === 'fulfilled') setProducts(productsRes.value.data.products || []);
    } catch { /* fallback to empty */ }
    setLoading(false);
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div>
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--gradient-1)', borderRadius: 'var(--radius-xl)',
          padding: '2.5rem 2rem', color: '#fff', marginBottom: '2rem',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
        }} />
        <h1 style={{ fontFamily: 'Poppins', fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          {t('home_welcome')}
        </h1>
        <p style={{ opacity: 0.85, fontSize: '0.95rem', marginBottom: '1.25rem' }}>
          {t('home_subtitle')}
        </p>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
          borderRadius: 999, padding: '0.7rem 1.25rem',
        }}>
          <SearchIcon style={{ opacity: 0.7 }} />
          <input style={{
            border: 'none', outline: 'none', flex: 1, background: 'transparent',
            color: '#fff', fontSize: '0.95rem', fontFamily: 'Inter',
          }}
            placeholder={t('search_placeholder')}
            value={search} onChange={e => setSearch(e.target.value)}
            id="home-search"
          />
        </div>
      </motion.div>

      {/* Categories */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CategoryIcon style={{ color: 'var(--primary)' }} /> {t('categories')}
        </h2>
        <motion.div variants={stagger} initial="hidden" animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '0.75rem' }}
        >
          {categories.map(c => (
            <motion.div key={c.name} variants={fadeUp} whileHover={{ scale: 1.06, y: -3 }}
              style={{
                background: c.color, borderRadius: 'var(--radius)', padding: '1rem 0.5rem',
                textAlign: 'center', cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>{c.emoji}</div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600 }}>{c.name}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Flash Sell Fast Clearance */}
      {products.some(p => p.isFlashDeal) && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#DC2626' }}>
            🔥 Flash Clearance (Sell Fast)
          </h2>
          <motion.div variants={stagger} initial="hidden" animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}
          >
            {products.filter(p => p.isFlashDeal).map(p => (
              <motion.div key={p._id} variants={fadeUp} whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(220, 38, 38, 0.2)' }}
                style={{ ...card, border: '2px solid #FECACA', background: '#FEF2F2' }}
              >
                <Link to={`/product/${p._id}`} style={{ display: 'block', height: 140, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : <span style={{ fontSize: '3rem', opacity: 0.3 }}>📦</span>}

                  <span style={{ position: 'absolute', top: 8, right: 8, background: '#EF4444', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: 999, boxShadow: '0 2px 10px rgba(239, 68, 68, 0.5)' }}>
                    CLEARANCE -30%
                  </span>
                </Link>

                <div style={{ padding: '1rem' }}>
                  <Link to={`/product/${p._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <p style={{ fontWeight: 800, color: '#991B1B', fontSize: '0.95rem', marginBottom: '0.25rem' }}>{p.name}</p>
                  </Link>
                  <p style={{ fontSize: '0.75rem', color: '#B91C1C', marginBottom: '0.5rem' }}>By {p.vendorId?.shopName}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 900, color: '#DC2626', fontSize: '1.2rem' }}>₹{p.price}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-3)', textDecoration: 'line-through' }}>
                      ₹{p.originalPrice}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* Nearby Shops */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <StorefrontIcon style={{ color: 'var(--secondary)' }} /> {t('nearby_shops')}
        </h2>
        {shops.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {shops.map(shop => (
              <Link key={shop._id} to={`/shop/${shop._id}`} style={{ textDecoration: 'none' }}>
                <motion.div whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }} style={card}>
                  <div style={{
                    height: 120, background: 'var(--gradient-1)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <StorefrontIcon style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.5)' }} />
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      {shop.shopName}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <LocationOnIcon style={{ fontSize: '0.85rem' }} /> {shop.address?.city || 'Local Area'}
                    </p>
                    {shop.rating > 0 && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                        <StarIcon style={{ fontSize: '0.85rem' }} /> {shop.rating?.toFixed(1)}
                      </p>
                    )}
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{
            background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', padding: '3rem',
            textAlign: 'center', color: 'var(--text-3)',
          }}>
            <StorefrontIcon style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '0.5rem' }} />
            <p style={{ fontWeight: 600 }}>{t('no_shops')}</p>
            <p style={{ fontSize: '0.85rem' }}>{t('run_seed')}</p>
          </div>
        )}
      </section>

      {/* Trending Products */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUpIcon style={{ color: 'var(--accent)' }} /> {t('trending')}
        </h2>
        {(search ? filteredProducts : products).length > 0 ? (
          <motion.div variants={stagger} initial="hidden" animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}
          >
            {(search ? filteredProducts : products).map(p => (
              <motion.div key={p._id} variants={fadeUp} whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
                style={card}
              >
                <Link to={`/product/${p._id}`} style={{ display: 'block', height: 140, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : <span style={{ fontSize: '3rem', opacity: 0.3 }}>📦</span>}

                  {p.mrp > p.price && (
                    <span style={{ position: 'absolute', top: 8, right: 8, background: 'var(--danger)', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: 999 }}>
                      {Math.round(((p.mrp - p.price) / p.mrp) * 100)}% OFF
                    </span>
                  )}
                </Link>

                <div style={{ padding: '1rem' }}>
                  <Link to={`/product/${p._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{p.name}</p>
                  </Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, color: 'var(--secondary)' }}>₹{p.price}</span>
                    {p.mrp > p.price && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', textDecoration: 'line-through' }}>
                        ₹{p.mrp}
                      </span>
                    )}
                  </div>
                  <Link to={`/compare/${encodeURIComponent(p.name)}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                      fontSize: '0.7rem', color: 'var(--primary-light)', fontWeight: 600, marginTop: '0.5rem',
                    }}>
                    <LocalOfferIcon style={{ fontSize: '0.8rem' }} /> Compare prices
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div style={{
            background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', padding: '3rem',
            textAlign: 'center', color: 'var(--text-3)',
          }}>
            <p style={{ fontWeight: 600 }}>No products yet</p>
            <p style={{ fontSize: '0.85rem' }}>Run seed data to populate products!</p>
          </div>
        )}
      </section>
    </div>
  );
}
