import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { getCartItems, getCartSummary, addToCart, updateCartItem, removeFromCart, clearCart } from '../api/cart';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

// 장바구니 컨텍스트 생성
const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // 장바구니 정보 로드 (useCallback 적용)
  const loadCart = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      // 장바구니 아이템 가져오기
      const items = await getCartItems();
      setCartItems(items.results || []);
      
      // 장바구니 요약 정보 가져오기
      const summary = await getCartSummary();
      setTotalItems(summary.total_items);
      setTotalPrice(summary.total_price);
    } catch (error) {
      console.error('장바구니 로드 실패:', error);
      toast.error('장바구니 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // 장바구니에 상품 추가 (useCallback 적용)
  const addItemToCart = useCallback(async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      toast.warning('로그인이 필요합니다.');
      return false;
    }
    setIsLoading(true);
    try {
      await addToCart(productId, quantity);
      toast.success('상품이 장바구니에 추가되었습니다.');
      await loadCart();
      return true;
    } catch (error) {
      console.error('장바구니 추가 실패:', error);
      
      if (error.response && error.response.data) {
        // 서버 오류 메시지 표시
        const message = error.response.data.quantity || error.response.data.detail || '장바구니에 추가하지 못했습니다.';
        toast.error(message);
      } else {
        toast.error('장바구니에 추가하지 못했습니다.');
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, loadCart]);

  // 장바구니 상품 수량 변경 (useCallback 적용)
  const updateItemQuantity = useCallback(async (cartItemId, quantity) => {
    if (quantity < 1) return;
    
    setIsLoading(true);
    
    try {
      await updateCartItem(cartItemId, quantity);
      await loadCart();
    } catch (error) {
      console.error('장바구니 수정 실패:', error);
      toast.error('수량을 변경하지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [loadCart]);

  // 장바구니에서 상품 제거 (useCallback 적용)
  const removeItemFromCart = useCallback(async (cartItemId) => {
    setIsLoading(true);
    
    try {
      await removeFromCart(cartItemId);
      toast.success('상품이 장바구니에서 제거되었습니다.');
      await loadCart();
    } catch (error) {
      console.error('장바구니 제거 실패:', error);
      toast.error('상품을 제거하지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [loadCart]);

  // 장바구니 비우기 (useCallback 적용)
  const emptyCart = useCallback(async () => {
    setIsLoading(true);
    
    try {
      await clearCart();
      toast.success('장바구니가 비워졌습니다.');
      setCartItems([]);
      setTotalItems(0);
      setTotalPrice(0);
    } catch (error) {
      console.error('장바구니 비우기 실패:', error);
      toast.error('장바구니를 비우지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 로그인 상태가 변경되면 장바구니 정보 로드
  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    } else {
      setCartItems([]);
      setTotalItems(0);
      setTotalPrice(0);
    }
  }, [isAuthenticated, loadCart]);

  // 컨텍스트에 제공할 값
  const value = {
    cartItems,
    totalItems,
    totalPrice,
    isLoading,
    loadCart,
    addItemToCart,
    updateItemQuantity,
    removeItemFromCart,
    emptyCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// 장바구니 컨텍스트 사용을 위한 훅
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart는 CartProvider 내부에서만 사용할 수 있습니다.');
  }
  return context;
};