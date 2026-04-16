import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { vendorAPI, productAPI } from '../services/api';
import { addToCart } from '../store/slices/cartSlice';
import toast from 'react-hot-toast';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CircleIcon from '@mui/icons-material/Circle';

export default function ShopPage() {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    loadShop();
  }, [id]);

  const loadShop = async () => {
    try {
      const [vRes, pRes] = await Promise.all([
        vendorAPI.getOne(id),
        productAPI.getAll({ vendor: id }),
      ]);
      setVendor(vRes.data.vendor);
      setProducts(pRes.data.products || []);
    } catch (err) {
      toast.error('Failed to load shop');
    }
    setLoading(false);
  };

  const handleAdd = (product) => {
    if (!vendor) return;
    dispatch(addToCart({ product, vendorId: vendor._id, vendorName: vendor.shopName }));
    toast.success(`${product.name} added! 🛒`);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <div className="shimmer" style={{ width: '100%', height: 300, borderRadius: 'var(--radius-lg)' }} />
    </div>
  );

  if (!vendor) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-3)' }}>
      <StorefrontIcon style={{ fontSize: '4rem', opacity: 0.3 }} />
      <p style={{ marginTop: '1rem', fontWeight: 600 }}>Shop not found</p>
    </div>
  );

  return (
    <div>
      {/* Shop Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{
          background: 'var(--gradient-1)', borderRadius: 'var(--radius-xl)',
          padding: '2rem', color: '#fff', marginBottom: '2rem',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', bottom: -50, right: -50, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <StorefrontIcon style={{ fontSize: '2rem' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{vendor.shopName}</h1>
            <p style={{ opacity: 0.8, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <LocationOnIcon style={{ fontSize: '0.9rem' }} />
              {vendor.address?.street || vendor.address?.city || 'Local Area'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <CircleIcon style={{ fontSize: '0.6rem', color: vendor.isOpen ? '#4ADE80' : '#F87171' }} />
            {vendor.isOpen ? 'Open' : 'Closed'}
          </span>
          {vendor.rating > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <StarIcon style={{ fontSize: '0.9rem', color: '#FDE68A' }} /> {vendor.rating?.toFixed(1)}
            </span>
          )}
        </div>
      </motion.div>

      {/* Products Grid */}
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>Products ({products.length})</h2>
      {products.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {products.map(p => (
            <motion.div key={p._id} whileHover={{ y: -4 }}
              style={{
                background: '#fff', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                boxShadow: 'var(--shadow)', transition: '0.25s',
              }}
            >
              <div style={{
                height: 120, background: 'var(--surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '2.5rem', opacity: 0.3 }}>📦</span>
                )}
                {!p.isAvailable && (
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                  }}>Out of Stock</div>
                )}
              </div>
              <div style={{ padding: '0.75rem' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.15rem' }}>{p.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: '0.5rem' }}>
                  {p.unit} • Stock: {p.stock}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--secondary)' }}>₹{p.price}</span>
                    {p.mrp > p.price && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', textDecoration: 'line-through', marginLeft: '0.35rem' }}>
                        ₹{p.mrp}
                      </span>
                    )}
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }}
                    onClick={() => handleAdd(p)}
                    disabled={!p.isAvailable}
                    style={{
                      background: p.isAvailable ? 'var(--gradient-2)' : 'var(--border)',
                      border: 'none', color: '#fff', borderRadius: 'var(--radius)',
                      padding: '0.5rem 0.75rem', cursor: p.isAvailable ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600,
                    }}
                  >
                    <AddShoppingCartIcon style={{ fontSize: '1rem' }} /> Add
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div style={{
          background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', padding: '3rem',
          textAlign: 'center', color: 'var(--text-3)',
        }}>
          <p style={{ fontWeight: 600 }}>No products listed yet</p>
        </div>
      )}
    </div>
  );
}
