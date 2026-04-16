import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { productAPI } from '../../services/api';
import toast from 'react-hot-toast';
import InventoryIcon from '@mui/icons-material/Inventory';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';

const emptyProduct = { name: '', price: '', mrp: '', stock: '', unit: 'kg', category: '', description: '' };

export default function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      const { data } = await productAPI.getMyProducts();
      setProducts(data.products || []);
    } catch { }
    setLoading(false);
  };

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const openAdd = () => { setEditing(null); setForm(emptyProduct); setShowModal(true); };
  const openEdit = (p) => {
    setEditing(p._id);
    setForm({ name: p.name, price: p.price, mrp: p.mrp, stock: p.stock, unit: p.unit, category: p.category || '', description: p.description || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return toast.error('Name & price required');
    try {
      if (editing) {
        await productAPI.update(editing, form);
        toast.success('Product updated! ✏️');
      } else {
        await productAPI.create(form);
        toast.success('Product added! 🎉');
      }
      setShowModal(false);
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productAPI.delete(id);
      toast.success('Product deleted');
      setProducts(products.filter(p => p._id !== id));
    } catch {
      toast.error('Delete failed');
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius)', fontSize: '0.9rem', fontFamily: 'Inter',
    outline: 'none', background: 'var(--surface)',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <InventoryIcon style={{ color: 'var(--primary)' }} /> My Products
        </h1>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openAdd}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.6rem 1.25rem', borderRadius: 999, border: 'none',
            background: 'var(--gradient-2)', color: '#fff', fontWeight: 700,
            fontSize: '0.85rem', cursor: 'pointer',
          }}>
          <AddIcon fontSize="small" /> Add Product
        </motion.button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {[1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height: 180, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : products.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {products.map(p => (
            <motion.div key={p._id} whileHover={{ y: -3 }}
              style={{
                background: '#fff', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                boxShadow: 'var(--shadow)',
                border: p.stock <= (p.lowStockThreshold || 5) ? '2px solid var(--accent)' : '1px solid var(--border)',
              }}
            >
              <div style={{
                height: 100, background: 'var(--surface-2)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', position: 'relative',
              }}>
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : <span style={{ fontSize: '2rem', opacity: 0.3 }}>📦</span>}
                {p.stock <= (p.lowStockThreshold || 5) && (
                  <span style={{
                    position: 'absolute', top: 6, left: 6, background: 'var(--accent)',
                    color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 999,
                  }}>⚠ Low Stock</span>
                )}
              </div>
              <div style={{ padding: '0.75rem' }}>
                <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.15rem' }}>{p.name}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Stock: {p.stock} {p.unit}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontWeight: 800, color: 'var(--secondary)' }}>₹{p.price}</span>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button onClick={() => openEdit(p)}
                      style={{ background: 'var(--surface-2)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <EditIcon style={{ fontSize: '0.9rem', color: 'var(--primary)' }} />
                    </button>
                    <button onClick={() => handleDelete(p._id)}
                      style={{ background: 'var(--surface-2)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <DeleteIcon style={{ fontSize: '0.9rem', color: 'var(--danger)' }} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', padding: '4rem', textAlign: 'center', color: 'var(--text-3)' }}>
          <InventoryIcon style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '0.5rem' }} />
          <p style={{ fontWeight: 600 }}>No products yet</p>
          <p style={{ fontSize: '0.85rem' }}>Add your first product!</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }} onClick={() => setShowModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                background: '#fff', borderRadius: 'var(--radius-xl)', padding: '2rem',
                width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{editing ? 'Edit Product' : 'Add Product'}</h2>
                <button onClick={() => setShowModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}><CloseIcon /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <input style={inputStyle} placeholder="Product name *" value={form.name} onChange={e => update('name', e.target.value)} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <input style={inputStyle} placeholder="Price *" type="number" value={form.price} onChange={e => update('price', e.target.value)} />
                  <input style={inputStyle} placeholder="MRP" type="number" value={form.mrp} onChange={e => update('mrp', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <input style={inputStyle} placeholder="Stock" type="number" value={form.stock} onChange={e => update('stock', e.target.value)} />
                  <select style={inputStyle} value={form.unit} onChange={e => update('unit', e.target.value)}>
                    <option value="kg">kg</option><option value="piece">piece</option>
                    <option value="litre">litre</option><option value="pack">pack</option>
                  </select>
                </div>
                <input style={inputStyle} placeholder="Category" value={form.category} onChange={e => update('category', e.target.value)} />
                <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="Description" value={form.description} onChange={e => update('description', e.target.value)} />

                <motion.button whileTap={{ scale: 0.98 }} onClick={handleSave}
                  style={{
                    width: '100%', padding: '0.85rem', border: 'none', borderRadius: 'var(--radius)',
                    background: 'var(--gradient-1)', color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  }}>
                  <SaveIcon fontSize="small" /> {editing ? 'Update' : 'Add'} Product
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
