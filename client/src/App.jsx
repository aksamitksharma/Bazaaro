import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Layout from './components/layout/Layout';
import LoadingScreen from './components/common/LoadingScreen';

// Lazy load pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Home = lazy(() => import('./pages/Home'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ProductCompare = lazy(() => import('./pages/ProductCompare'));
const Cart = lazy(() => import('./pages/Cart'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard'));
const VendorProducts = lazy(() => import('./pages/vendor/VendorProducts'));
const VendorOrders = lazy(() => import('./pages/vendor/VendorOrders'));
const DeliveryDashboard = lazy(() => import('./pages/delivery/DeliveryDashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminVendors = lazy(() => import('./pages/admin/AdminVendors'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminDeliveryPartners = lazy(() => import('./pages/admin/AdminDeliveryPartners'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const UserProfile = lazy(() => import('./pages/UserProfile'));

// Protected Route
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useSelector(s => s.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Customer */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/shop/:id" element={<Layout><ShopPage /></Layout>} />
        <Route path="/compare/:productName" element={<Layout><ProductCompare /></Layout>} />
        <Route path="/product/:id" element={<Layout><ProductDetail /></Layout>} />
        <Route path="/profile" element={<Layout><ProtectedRoute><UserProfile /></ProtectedRoute></Layout>} />
        <Route path="/cart" element={<Layout><ProtectedRoute><Cart /></ProtectedRoute></Layout>} />
        <Route path="/orders" element={<Layout><ProtectedRoute><Orders /></ProtectedRoute></Layout>} />
        <Route path="/orders/:id/track" element={<Layout><ProtectedRoute><OrderTracking /></ProtectedRoute></Layout>} />

        {/* Vendor */}
        <Route path="/vendor" element={<Layout><ProtectedRoute roles={['vendor']}><VendorDashboard /></ProtectedRoute></Layout>} />
        <Route path="/vendor/products" element={<Layout><ProtectedRoute roles={['vendor']}><VendorProducts /></ProtectedRoute></Layout>} />
        <Route path="/vendor/orders" element={<Layout><ProtectedRoute roles={['vendor']}><VendorOrders /></ProtectedRoute></Layout>} />

        {/* Delivery */}
        <Route path="/delivery" element={<Layout><ProtectedRoute roles={['delivery']}><DeliveryDashboard /></ProtectedRoute></Layout>} />

        {/* Admin */}
        <Route path="/admin" element={<Layout><ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute></Layout>} />
        <Route path="/admin/users" element={<Layout><ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute></Layout>} />
        <Route path="/admin/vendors" element={<Layout><ProtectedRoute roles={['admin']}><AdminVendors /></ProtectedRoute></Layout>} />
        <Route path="/admin/orders" element={<Layout><ProtectedRoute roles={['admin']}><AdminOrders /></ProtectedRoute></Layout>} />
        <Route path="/admin/coupons" element={<Layout><ProtectedRoute roles={['admin']}><AdminCoupons /></ProtectedRoute></Layout>} />
        <Route path="/admin/delivery-partners" element={<Layout><ProtectedRoute roles={['admin']}><AdminDeliveryPartners /></ProtectedRoute></Layout>} />
        <Route path="/admin/analytics" element={<Layout><ProtectedRoute roles={['admin']}><AdminAnalytics /></ProtectedRoute></Layout>} />

        {/* 404 */}
        <Route path="*" element={<Layout><div style={{textAlign:'center',padding:'4rem'}}><h1 style={{fontSize:'3rem'}}>404</h1><p>Page not found</p></div></Layout>} />
      </Routes>
    </Suspense>
  );
}
