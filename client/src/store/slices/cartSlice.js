import { createSlice } from '@reduxjs/toolkit';

const savedCart = localStorage.getItem('bazaaro_cart');

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: savedCart ? JSON.parse(savedCart) : [],
    vendorId: null,
    vendorName: '',
  },
  reducers: {
    addToCart: (state, action) => {
      const { product, vendorId, vendorName } = action.payload;
      // If cart has items from different vendor, clear it
      if (state.vendorId && state.vendorId !== vendorId) {
        state.items = [];
      }
      state.vendorId = vendorId;
      state.vendorName = vendorName;

      const existing = state.items.find(i => i.productId === product._id);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({
          productId: product._id,
          name: product.name,
          price: product.price,
          mrp: product.mrp,
          unit: product.unit,
          image: product.images?.[0] || '',
          quantity: 1,
          stock: product.stock
        });
      }
      localStorage.setItem('bazaaro_cart', JSON.stringify(state.items));
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter(i => i.productId !== action.payload);
      if (state.items.length === 0) { state.vendorId = null; state.vendorName = ''; }
      localStorage.setItem('bazaaro_cart', JSON.stringify(state.items));
    },
    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find(i => i.productId === productId);
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(i => i.productId !== productId);
        } else {
          item.quantity = Math.min(quantity, item.stock);
        }
      }
      if (state.items.length === 0) { state.vendorId = null; state.vendorName = ''; }
      localStorage.setItem('bazaaro_cart', JSON.stringify(state.items));
    },
    clearCart: (state) => {
      state.items = [];
      state.vendorId = null;
      state.vendorName = '';
      localStorage.removeItem('bazaaro_cart');
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;

// Selectors
export const selectCartTotal = (state) => state.cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
export const selectCartCount = (state) => state.cart.items.reduce((sum, i) => sum + i.quantity, 0);

export default cartSlice.reducer;
