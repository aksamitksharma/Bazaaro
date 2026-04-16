import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { productAPI } from '../services/api';
import { addToCart } from '../store/slices/cartSlice';
import toast from 'react-hot-toast';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import StorefrontIcon from '@mui/icons-material/Storefront';
import StarIcon from '@mui/icons-material/Star';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import LocationOnIcon from '@mui/icons-material/LocationOn';

export default function ProductCompare() {
  const { productName } = useParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    loadComparisons();
  }, [productName]);

  const loadComparisons = async () => {
    try {
      const { data } = await productAPI.compare(productName, { lat: 28.6139, lng: 77.2090 });
      setResults(data.results || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  const handleAdd = (item) => {
    dispatch(addToCart({
      product: item.product,
      vendorId: item.vendor._id,
      vendorName: item.vendor.shopName,
    }));
    toast.success(`Added from ${item.vendor.shopName}! 🛒`);
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CompareArrowsIcon style={{ color: 'var(--primary)' }} />
          Compare: "{decodeURIComponent(productName)}"
        </h1>
        <p style={{ color: 'var(--text-3)', fontSize: '0.9rem' }}>
          {results.length} vendor{results.length !== 1 ? 's' : ''} selling this product
        </p>
      </motion.div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : results.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {results.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              whileHover={{ boxShadow: 'var(--shadow-lg)' }}
              style={{
                background: '#fff', borderRadius: 'var(--radius-lg)', padding: '1.25rem',
                boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: '1rem',
                flexWrap: 'wrap', position: 'relative',
                border: i === 0 ? '2px solid var(--secondary)' : '1px solid var(--border)',
              }}
            >
              {i === 0 && (
                <span style={{
                  position: 'absolute', top: -10, left: 16,
                  background: 'var(--secondary)', color: '#fff', fontSize: '0.7rem',
                  fontWeight: 700, padding: '0.2rem 0.75rem', borderRadius: 999,
                }}>
                  🏷️ Best Price
                </span>
              )}

              <div style={{
                width: 64, height: 64, borderRadius: 'var(--radius)',
                background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <StorefrontIcon style={{ color: 'var(--primary)', fontSize: '1.5rem' }} />
              </div>

              <div style={{ flex: 1, minWidth: 150 }}>
                <Link to={`/shop/${item.vendor?._id}`} style={{ textDecoration: 'none' }}>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{item.vendor?.shopName}</p>
                </Link>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <LocationOnIcon style={{ fontSize: '0.8rem' }} /> {item.vendor?.address?.city || 'Local'}
                  {item.vendor?.rating > 0 && (
                    <span style={{ marginLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                      <StarIcon style={{ fontSize: '0.8rem', color: 'var(--accent)' }} /> {item.vendor.rating?.toFixed(1)}
                    </span>
                  )}
                </p>
              </div>

              <div style={{ textAlign: 'right', marginRight: '0.5rem' }}>
                <p style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--secondary)' }}>₹{item.product?.price}</p>
                {item.product?.mrp > item.product?.price && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', textDecoration: 'line-through' }}>₹{item.product.mrp}</p>
                )}
              </div>

              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleAdd(item)}
                style={{
                  background: 'var(--gradient-2)', border: 'none', color: '#fff',
                  borderRadius: 'var(--radius)', padding: '0.6rem 1rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.85rem',
                }}
              >
                <AddShoppingCartIcon style={{ fontSize: '1rem' }} /> Add
              </motion.button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center', padding: '4rem', background: 'var(--surface-2)',
          borderRadius: 'var(--radius-lg)', color: 'var(--text-3)',
        }}>
          <CompareArrowsIcon style={{ fontSize: '3rem', opacity: 0.3 }} />
          <p style={{ fontWeight: 600, marginTop: '0.5rem' }}>No vendors found for this product</p>
        </div>
      )}
    </div>
  );
}
