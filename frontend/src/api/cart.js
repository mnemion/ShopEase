import apiClient from './client';

// 장바구니 목록 조회 API
export const getCartItems = async () => {
  const response = await apiClient.get('/orders/cart/');
  return response.data;
};

// 장바구니 요약 정보 조회 API
export const getCartSummary = async () => {
  const response = await apiClient.get('/orders/cart/summary/');
  return response.data;
};

// 장바구니에 상품 추가 API
export const addToCart = async (productId, quantity = 1) => {
  const response = await apiClient.post('/orders/cart/', {
    product: productId,
    quantity,
  });
  return response.data;
};

// 장바구니 상품 수량 변경 API
export const updateCartItem = async (cartItemId, quantity) => {
  const response = await apiClient.put(`/orders/cart/${cartItemId}/`, {
    quantity,
  });
  return response.data;
};

// 장바구니 상품 삭제 API
export const removeFromCart = async (cartItemId) => {
  const response = await apiClient.delete(`/orders/cart/${cartItemId}/`);
  return response.data;
};

// 장바구니 비우기 API
export const clearCart = async () => {
  const response = await apiClient.delete('/orders/cart/clear/');
  return response.data;
};