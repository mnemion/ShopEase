import apiClient from './client';

// 주문 목록 조회 API
export const getOrders = async () => {
  const response = await apiClient.get('/orders/');
  return response.data;
};

// 주문 상세 조회 API
export const getOrder = async (orderId) => {
  const response = await apiClient.get(`/orders/${orderId}/`);
  return response.data;
};

// 주문 생성 API (결제)
export const checkout = async (checkoutData) => {
  const response = await apiClient.post('/orders/checkout/', checkoutData);
  return response.data;
};

// 주문 취소 API
export const cancelOrder = async (orderId) => {
  const response = await apiClient.post(`/orders/${orderId}/cancel/`);
  return response.data;
};

// 결제 완료 처리 API (시뮬레이션)
export const completePayment = async (orderId, paymentData) => {
  const response = await apiClient.post(`/orders/${orderId}/payment_complete/`, paymentData);
  return response.data;
};