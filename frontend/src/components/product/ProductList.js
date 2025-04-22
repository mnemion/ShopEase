import React from 'react';
import ProductCard from './ProductCard';
import Loading from '../ui/Loading';

const ProductList = ({ products, isLoading, error }) => {
  // 로딩 중일 때
  if (isLoading) {
    return <Loading text="상품 정보를 불러오는 중입니다..." />;
  }

  // 에러 발생 시
  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">상품 정보를 불러오는데 문제가 발생했습니다.</p>
        <p className="text-gray-600 mt-2">{error}</p>
      </div>
    );
  }

  // 상품이 없을 때
  if (!products || products.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600 text-lg">검색 결과가 없습니다.</p>
        <p className="text-gray-500 mt-2">다른 검색어나 필터를 사용해보세요.</p>
      </div>
    );
  }

  // 상품 목록 표시
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductList;