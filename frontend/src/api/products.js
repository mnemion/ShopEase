import apiClient from './client';

// 상품 목록 조회 API
export const getProducts = async (params = {}) => {
  const response = await apiClient.get('/products/', { params });
  return response.data;
};

// 상품 상세 조회 API
export const getProduct = async (id) => {
  const response = await apiClient.get(`/products/${id}/`);
  return response.data;
};

// 카테고리 목록 조회 API
export const getCategories = async (params = {}) => {
  // 캐시 방지 헤더 추가
  const headers = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
  
  const response = await apiClient.get('/products/categories/', { 
    params,
    headers
  });
  return response.data;
};

// 상품 검색 API
export const searchProducts = async (query) => {
  const response = await apiClient.get('/products/', { params: { search: query } });
  return response.data;
};

// 상품 필터링 API
export const filterProducts = async (filters) => {
  const response = await apiClient.get('/products/', { params: filters });
  return response.data;
};

// 상품 리뷰 작성 API
export const createReview = async (productId, reviewData) => {
  const response = await apiClient.post(`/products/${productId}/review/`, reviewData);
  return response.data;
};

// 내 리뷰 목록 조회 API
export const getMyReviews = async () => {
  const response = await apiClient.get('/products/reviews/');
  return response.data;
};

// 리뷰 삭제 API
export const deleteReview = async (reviewId) => {
  const response = await apiClient.delete(`/products/reviews/${reviewId}/`);
  return response.data;
};

// 카테고리 트리 조회 API
export const getCategoryTree = async () => {
  const response = await apiClient.get('/products/categories/tree/');
  return response.data;
}