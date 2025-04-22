import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';
import Button from '../ui/Button';

const ProductCard = ({ product }) => {
  const { addItemToCart, isLoading } = useCart();

  // 상품을 장바구니에 추가하는 핸들러
  const handleAddToCart = (e) => {
    e.preventDefault(); // 클릭 이벤트가 링크로 전파되는 것을 방지
    addItemToCart(product.id);
  };

  return (
    <div className="product-card">
      <Link to={`/products/${product.id}`} className="block">
        {/* 상품 이미지 */}
        <div className="relative">
          <img
            src={product.main_image || '/assets/placeholder-product.jpg'}
            alt={product.name}
            className="product-card-image"
          />
          {product.is_on_sale && (
            <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1 m-2 rounded">
              할인
            </div>
          )}
        </div>

        {/* 상품 정보 */}
        <div className="product-card-body">
          {/* 카테고리 */}
          <div className="text-xs text-gray-500 mb-1">{product.category_name}</div>
          
          {/* 상품명 */}
          <h3 className="text-base font-medium text-gray-800 mb-1 truncate">{product.name}</h3>
          
          {/* 가격 정보 */}
          <div className="mb-3">
            {product.is_on_sale ? (
              <div className="flex items-center">
                <span className="price-original text-sm mr-2">
                  {formatCurrency(product.price)}
                </span>
                <span className="price-discount text-base">
                  {formatCurrency(product.current_price)}
                </span>
              </div>
            ) : (
              <span className="text-base font-medium text-gray-800">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>
          
          {/* 장바구니 추가 버튼 */}
          <Button
            variant="primary"
            size="small"
            fullWidth
            onClick={handleAddToCart}
            isLoading={isLoading}
          >
            장바구니 담기
          </Button>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;