import axios from 'axios';

const API = axios.create({ baseURL: '/api', withCredentials: true });

// Attach token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('bazaaro_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 errors
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('bazaaro_token');
      localStorage.removeItem('bazaaro_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  sendOTP: (data) => API.post('/auth/send-otp', data),
  verifyOTP: (data) => API.post('/auth/verify-otp', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
};

// Products
export const productAPI = {
  getAll: (params) => API.get('/products', { params }),
  getNearby: (params) => API.get('/products/nearby', { params }),
  compare: (name, params) => API.get(`/products/compare/${name}`, { params }),
  getOne: (id) => API.get(`/products/${id}`),
  create: (data) => API.post('/products', data),
  update: (id, data) => API.put(`/products/${id}`, data),
  delete: (id) => API.delete(`/products/${id}`),
  getMyProducts: (params) => API.get('/products/vendor/my', { params }),
  bulkUpload: (data) => API.post('/products/bulk-upload', data),
  getCheapestCombo: (data) => API.post('/products/cheapest-combo', data),
};

// Vendors
export const vendorAPI = {
  getNearby: (params) => API.get('/vendors/nearby', { params }),
  getOne: (id) => API.get(`/vendors/${id}`),
  updateProfile: (data) => API.put('/vendors/profile', data),
  toggleShop: () => API.put('/vendors/toggle'),
  getDashboard: () => API.get('/vendors/dashboard'),
  getAnalytics: () => API.get('/vendors/analytics'),
  getDemand: () => API.get('/vendors/ai/demand'),
  getPricing: () => API.get('/vendors/ai/pricing'),
};

// Orders
export const orderAPI = {
  place: (data) => API.post('/orders', data),
  validateCoupon: (data) => API.post('/orders/validate-coupon', data),
  getAvailableCoupons: (params) => API.get('/orders/coupons', { params }),
  getAll: (params) => API.get('/orders', { params }),
  getOne: (id) => API.get(`/orders/${id}`),
  updateStatus: (id, data) => API.put(`/orders/${id}/status`, data),
  cancel: (id, data) => API.post(`/orders/${id}/cancel`, data),
  track: (id) => API.get(`/orders/${id}/track`),
};

// Delivery
export const deliveryAPI = {
  toggle: () => API.put('/delivery/toggle'),
  updateLocation: (data) => API.put('/delivery/location', data),
  getOrders: (params) => API.get('/delivery/orders', { params }),
  acceptOrder: (id) => API.put(`/delivery/orders/${id}/accept`),
  updateStatus: (id, data) => API.put(`/delivery/orders/${id}/status`, data),
  getDashboard: () => API.get('/delivery/dashboard'),
};

// Reviews
export const reviewAPI = {
  create: (data) => API.post('/reviews', data),
  getVendorReviews: (vendorId, params) => API.get(`/reviews/vendor/${vendorId}`, { params }),
  replyToReview: (id, data) => API.put(`/reviews/${id}/reply`, data),
};

// Notifications
export const notificationAPI = {
  getAll: (params) => API.get('/notifications', { params }),
  markRead: (id) => API.put(`/notifications/${id}/read`),
  markAllRead: () => API.put('/notifications/read-all'),
};

// Admin
export const adminAPI = {
  getDashboard: () => API.get('/admin/dashboard'),
  getUsers: (params) => API.get('/admin/users', { params }),
  toggleUser: (id) => API.put(`/admin/users/${id}/toggle`),
  getVendors: () => API.get('/admin/vendors'),
  approveVendor: (id, data) => API.put(`/admin/vendors/${id}/approve`, data),
  getOrders: (params) => API.get('/admin/orders', { params }),
  assignDelivery: (data) => API.post('/admin/orders/assign-delivery', data),
  getDeliveryPartners: () => API.get('/admin/delivery-partners'),
  getCoupons: () => API.get('/admin/coupons'),
  createCoupon: (data) => API.post('/admin/coupons', data),
  getCategories: () => API.get('/admin/categories'),
  createCategory: (data) => API.post('/admin/categories', data),
  getAnalytics: () => API.get('/admin/analytics'),
};

export default API;
