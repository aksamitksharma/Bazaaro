import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { productAPI, reviewAPI } from '../services/api';
import { addToCart } from '../store/slices/cartSlice';
import toast from 'react-hot-toast';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import InventoryIcon from '@mui/icons-material/Inventory';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import VerifiedIcon from '@mui/icons-material/Verified';
import PersonIcon from '@mui/icons-material/Person';

const s = {
  page: { maxWidth: 900, margin: '0 auto' },
  backBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    fontSize: '0.9rem', color: 'var(--primary-light)', fontWeight: 600,
    cursor: 'pointer', marginBottom: '1rem', background: 'none', border: 'none',
  },
  card: {
    background: '#fff', borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
  },
  imgBox: {
    width: '100%', height: 300, background: 'var(--surface-2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  infoBox: { padding: '1.5rem 2rem 2rem' },
  name: { fontFamily: 'Poppins', fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem' },
  priceLine: { display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1rem' },
  price: { fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)' },
  mrp: { fontSize: '1.1rem', color: 'var(--text-3)', textDecoration: 'line-through' },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
    background: '#FEF3C7', color: '#92400E', borderRadius: 999,
    padding: '0.2rem 0.75rem', fontSize: '0.8rem', fontWeight: 700,
  },
  meta: {
    display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem',
  },
  metaItem: {
    display: 'flex', alignItems: 'center', gap: '0.35rem',
    fontSize: '0.85rem', color: 'var(--text-2)',
    background: 'var(--surface-2)', borderRadius: 'var(--radius)',
    padding: '0.45rem 0.85rem',
  },
  qtyRow: {
    display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem',
  },
  qtyBtn: {
    width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--border)',
    background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: '0.15s',
  },
  qtyNum: { fontSize: '1.2rem', fontWeight: 700, minWidth: 32, textAlign: 'center' },
  actionRow: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  addBtn: {
    flex: 1, minWidth: 180, padding: '0.9rem 1.5rem', border: 'none',
    borderRadius: 'var(--radius)', background: 'var(--gradient-2)',
    color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    fontFamily: 'Inter',
  },
  compareBtn: {
    padding: '0.9rem 1.5rem', border: '2px solid var(--primary)',
    borderRadius: 'var(--radius)', background: 'transparent',
    color: 'var(--primary)', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'Inter',
  },
  vendorBox: {
    background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)',
    padding: '1.25rem', marginTop: '1.5rem', display: 'flex', alignItems: 'center',
    gap: '1rem', cursor: 'pointer', transition: '0.2s',
  },
  vendorIcon: {
    width: 48, height: 48, borderRadius: 'var(--radius)', background: 'var(--gradient-1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
  },
  section: {
    background: '#fff', borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow)', padding: '1.5rem 2rem', marginTop: '1.5rem',
  },
  sectionTitle: {
    fontFamily: 'Poppins', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem',
    display: 'flex', alignItems: 'center', gap: '0.5rem',
  },
  reviewCard: {
    borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem',
  },
  stars: { display: 'flex', gap: '0.15rem', color: '#F59E0B' },
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(s => s.auth);
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadProduct(); }, [id]);

  const loadProduct = async () => {
    try {
      const { data } = await productAPI.getOne(id);
      setProduct(data.product);
      // Try to load reviews for this product's vendor
      if (data.product?.vendorId?._id) {
        try {
          const rRes = await reviewAPI.getVendorReviews(data.product.vendorId._id);
          setReviews(rRes.data.reviews || []);
        } catch {}
      }
    } catch {
      toast.error('Product not found');
    }
    setLoading(false);
  };

  const handleAdd = () => {
    if (!product) return;
    const vendor = product.vendorId;
    for (let i = 0; i < quantity; i++) {
      dispatch(addToCart({
        product,
        vendorId: vendor?._id || '',
        vendorName: vendor?.shopName || 'Unknown',
      }));
    }
    toast.success(`${quantity}x ${product.name} added! 🛒`);
  };

  const discount = product ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  if (loading) return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1rem' }}>
      <div className="shimmer" style={{ width: '100%', height: 300, borderRadius: 'var(--radius-xl)', marginBottom: '1rem' }} />
      <div className="shimmer" style={{ width: '70%', height: 28, borderRadius: 8, marginBottom: '0.5rem' }} />
      <div className="shimmer" style={{ width: '40%', height: 40, borderRadius: 8 }} />
    </div>
  );

  if (!product) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-3)' }}>
      <InventoryIcon style={{ fontSize: '4rem', opacity: 0.3 }} />
      <p style={{ marginTop: '1rem', fontWeight: 600 }}>Product not found</p>
      <button onClick={() => navigate('/')} style={{ ...s.compareBtn, marginTop: '1rem', display: 'inline-flex' }}>Go Home</button>
    </div>
  );

  const vendor = product.vendorId;

  return (
    <div style={s.page}>
      <button onClick={() => navigate(-1)} style={s.backBtn}>
        <ArrowBackIcon style={{ fontSize: '1.1rem' }} /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={s.card}>
        {/* Image */}
        <div style={s.imgBox}>
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '5rem', opacity: 0.2 }}>📦</span>
          )}
          {discount > 0 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'var(--danger)', color: '#fff', fontWeight: 800,
                fontSize: '0.85rem', padding: '0.4rem 0.9rem', borderRadius: 999,
              }}
            >
              {discount}% OFF
            </motion.span>
          )}
          {!product.isAvailable && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: '1.3rem',
            }}>Out of Stock</div>
          )}
        </div>

        {/* Info */}
        <div style={s.infoBox}>
          {product.category?.name && (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {product.category.name}
            </span>
          )}
          <h1 style={s.name}>{product.name}</h1>

          {/* Price */}
          <div style={s.priceLine}>
            <span style={s.price}>₹{product.price}</span>
            {product.mrp > product.price && <span style={s.mrp}>₹{product.mrp}</span>}
            {discount > 0 && (
              <span style={s.badge}>
                <LocalOfferIcon style={{ fontSize: '0.85rem' }} /> Save ₹{product.mrp - product.price}
              </span>
            )}
          </div>

          {/* Meta tags */}
          <div style={s.meta}>
            <span style={s.metaItem}>
              <InventoryIcon style={{ fontSize: '1rem' }} />
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
            <span style={s.metaItem}>📦 {product.unit}</span>
            {product.tags?.map((t, i) => (
              <span key={i} style={{ ...s.metaItem, background: '#EEF2FF', color: 'var(--primary)' }}>#{t}</span>
            ))}
          </div>

          {product.description && (
            <p style={{ color: 'var(--text-2)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {product.description}
            </p>
          )}

          {/* Quantity + Actions */}
          {product.isAvailable && product.stock > 0 && (
            <>
              <div style={s.qtyRow}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-2)' }}>Quantity:</span>
                <button style={s.qtyBtn} onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                  <RemoveIcon style={{ fontSize: '1rem' }} />
                </button>
                <span style={s.qtyNum}>{quantity}</span>
                <button style={s.qtyBtn} onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}>
                  <AddIcon style={{ fontSize: '1rem' }} />
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>Total: ₹{product.price * quantity}</span>
              </div>

              <div style={s.actionRow}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleAdd} style={s.addBtn} id="add-to-cart-btn"
                >
                  <AddShoppingCartIcon /> Add to Cart
                </motion.button>
                <Link to={`/compare/${encodeURIComponent(product.name)}`} style={s.compareBtn}>
                  <CompareArrowsIcon /> Compare Prices
                </Link>
              </div>
            </>
          )}

          {/* Vendor Info */}
          {vendor && (
            <Link to={`/shop/${vendor._id}`}>
              <motion.div whileHover={{ scale: 1.01 }} style={s.vendorBox}>
                <div style={s.vendorIcon}>
                  <StorefrontIcon />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{vendor.shopName}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                    {vendor.isOpen ? '🟢 Open' : '🔴 Closed'}
                    {vendor.rating > 0 && ` • ⭐ ${vendor.rating?.toFixed(1)}`}
                    {vendor.address?.city && ` • ${vendor.address.city}`}
                  </p>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 600 }}>Visit Shop →</span>
              </motion.div>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Reviews Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }} style={s.section}
      >
        <h2 style={s.sectionTitle}>
          <StarIcon style={{ color: '#F59E0B' }} /> Reviews ({reviews.length})
        </h2>
        {reviews.length > 0 ? (
          reviews.slice(0, 5).map((r, i) => (
            <div key={r._id || i} style={s.reviewCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: 'var(--gradient-1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem',
                }}>
                  <PersonIcon style={{ fontSize: '1rem' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.userId?.name || 'Customer'}</p>
                  <div style={s.stars}>
                    {[1, 2, 3, 4, 5].map(n => n <= r.rating
                      ? <StarIcon key={n} style={{ fontSize: '0.85rem' }} />
                      : <StarBorderIcon key={n} style={{ fontSize: '0.85rem', opacity: 0.3 }} />
                    )}
                  </div>
                </div>
                {r.isVerified && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <VerifiedIcon style={{ fontSize: '0.8rem' }} /> Verified
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-2)', lineHeight: 1.5 }}>{r.comment}</p>
              {r.reply && (
                <div style={{ marginTop: '0.5rem', padding: '0.6rem 0.8rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)', fontSize: '0.85rem' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--primary-light)', marginBottom: '0.15rem' }}>Vendor Reply</p>
                  <p style={{ color: 'var(--text-2)' }}>{r.reply}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: '1.5rem 0' }}>
            No reviews yet. Be the first to review!
          </p>
        )}
      </motion.div>
    </div>
  );
}
