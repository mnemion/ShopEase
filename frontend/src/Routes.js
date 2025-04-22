import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// 페이지 컴포넌트 import
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderComplete from './pages/OrderComplete';
import OrderHistory from './pages/OrderHistory';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import SocialLoginCallback from './pages/SocialLoginCallback';

// 인증이 필요한 라우트를 위한 컴포넌트
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// 메인 라우트 컴포넌트
const AppRoutes = () => {
  return (
    <Routes>
      {/* 공개 라우트 */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/products" element={<ProductList />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/categories/:categoryId" element={<ProductList />} />
      
      {/* 소셜 로그인 콜백 처리 라우트 */}
      <Route path="/login/callback/:provider" element={<SocialLoginCallback />} />
      
      {/* 이전 콜백 라우트 (기존 호환성을 위해 유지) */}
      <Route path="/login/callback" element={<SocialLoginCallback />} />
      <Route path="/login/success" element={<SocialLoginCallback />} />
      
      {/* 인증이 필요한 라우트 */}
      <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
      <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
      <Route path="/order-complete/:orderId" element={<PrivateRoute><OrderComplete /></PrivateRoute>} />
      <Route path="/orders" element={<PrivateRoute><OrderHistory /></PrivateRoute>} />
      <Route path="/orders/:id" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      
      {/* 404 페이지 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;