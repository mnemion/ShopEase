import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatters';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import { toast } from 'react-toastify';

const Cart = () => {
  const {
    cartItems,
    totalItems,
    totalPrice,
    isLoading,
    loadCart,
    updateItemQuantity,
    removeItemFromCart,
    emptyCart
  } = useCart();
  const navigate = useNavigate();
  
  // 장바구니 정보 로드
  useEffect(() => {
    loadCart();
  }, [loadCart]);
  
  // 체크아웃으로 이동
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.warning('장바구니가 비어 있습니다.');
      return;
    }
    navigate('/checkout');
  };
  
  // 장바구니 비우기 핸들러
  const handleEmptyCart = () => {
    if (window.confirm('장바구니를 비우시겠습니까?')) {
      emptyCart();
    }
  };
  
  // 수량 변경 핸들러
  const handleQuantityChange = (cartItemId, quantity) => {
    if (quantity < 1) return;
    updateItemQuantity(cartItemId, quantity);
  };
  
  // 상품 제거 핸들러
  const handleRemoveItem = (cartItemId) => {
    if (window.confirm('상품을 장바구니에서 제거하시겠습니까?')) {
      removeItemFromCart(cartItemId);
    }
  };
  
  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <Loading text="장바구니 정보를 불러오는 중입니다..." />
        </div>
      </div>
    );
  }
  
  // 장바구니가 비어있을 때
  if (cartItems.length === 0) {
    return (
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              장바구니
            </h1>
            <div className="mt-12">
              <svg
                className="mx-auto h-24 w-24 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <h3 className="mt-4 text-xl font-medium text-gray-900">장바구니가 비어 있습니다</h3>
              <p className="mt-2 text-gray-500">
                원하는 상품을 장바구니에 담고 쇼핑을 계속해보세요.
              </p>
              <div className="mt-6">
                <Link to="/products">
                  <Button variant="primary">쇼핑 계속하기</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          장바구니
        </h1>
        <div className="mt-12">
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
            {/* 장바구니 상품 목록 */}
            <div className="lg:col-span-7">
              <div className="border-t border-b border-gray-200 divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <div key={item.id} className="py-6 sm:flex">
                    {/* 상품 이미지 */}
                    <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 overflow-hidden rounded-md border border-gray-200">
                      <img
                        src={item.product_detail.main_image || '/assets/placeholder-product.jpg'}
                        alt={item.product_detail.name}
                        className="w-full h-full object-center object-cover"
                      />
                    </div>
                    
                    {/* 상품 정보 */}
                    <div className="flex-1 ml-0 sm:ml-6 space-y-4">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            <Link to={`/products/${item.product}`} className="hover:text-indigo-600">
                              {item.product_detail.name}
                            </Link>
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {item.product_detail.category_name}
                          </p>
                        </div>
                        <p className="text-lg font-medium text-gray-900">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </div>
                      
                      {/* 수량 조절 및 삭제 버튼 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-gray-300 rounded">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="text-gray-500 px-3 py-1 focus:outline-none"
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="px-3 py-1 text-gray-700">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="text-gray-500 px-3 py-1 focus:outline-none"
                            disabled={item.quantity >= item.product_detail.stock}
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 장바구니 관리 버튼 */}
              <div className="mt-6 flex justify-between items-center">
                <Link to="/products">
                  <Button variant="secondary">쇼핑 계속하기</Button>
                </Link>
                <Button
                  onClick={handleEmptyCart}
                  variant="outline"
                >
                  장바구니 비우기
                </Button>
              </div>
            </div>
            
            {/* 주문 요약 */}
            <div className="mt-10 lg:mt-0 lg:col-span-5">
              <div className="bg-gray-50 rounded-lg px-6 py-8">
                <h2 className="text-xl font-medium text-gray-900">주문 요약</h2>
                
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                    <div className="text-base font-medium text-gray-900">상품 금액</div>
                    <div className="text-base font-medium text-gray-900">
                      {formatCurrency(totalPrice)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-base font-medium text-gray-900">상품 수</div>
                    <div className="text-base font-medium text-gray-900">
                      {totalItems}개
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-base font-medium text-gray-900">배송비</div>
                    <div className="text-base font-medium text-gray-900">
                      {formatCurrency(0)} {/* 임시로 배송비 0원 설정 */}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                    <div className="text-lg font-bold text-gray-900">결제 금액</div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(totalPrice)}
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <Button
                    onClick={handleCheckout}
                    variant="primary"
                    size="large"
                    fullWidth
                  >
                    결제하기
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;