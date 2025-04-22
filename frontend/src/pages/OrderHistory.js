import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOrders, cancelOrder } from '../api/orders';
import { formatCurrency, formatDate, translateOrderStatus } from '../utils/formatters';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import { toast } from 'react-toastify';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 주문 내역 가져오기
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      
      try {
        const data = await getOrders();
        setOrders(data.results || []);
      } catch (error) {
        console.error('주문 내역 로드 실패:', error);
        setError('주문 내역을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrders();
  }, []);
  
  // 주문 취소 핸들러
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('주문을 취소하시겠습니까?')) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const updatedOrder = await cancelOrder(orderId);
      
      // 주문 목록 업데이트
      setOrders(orders.map(order => 
        order.id === updatedOrder.id ? updatedOrder : order
      ));
      
      toast.success('주문이 취소되었습니다.');
    } catch (error) {
      console.error('주문 취소 실패:', error);
      
      if (error.response && error.response.data) {
        const errorMessage = error.response.data.detail || '주문 취소에 실패했습니다.';
        toast.error(errorMessage);
      } else {
        toast.error('주문 취소 중 오류가 발생했습니다.');
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <Loading text="주문 내역을 불러오는 중입니다..." />
      </div>
    );
  }
  
  // 에러 발생 시
  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>다시 시도</Button>
        </div>
      </div>
    );
  }
  
  // 주문 내역이 없는 경우
  if (orders.length === 0) {
    return (
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              주문 내역
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-4 text-xl font-medium text-gray-900">주문 내역이 없습니다</h3>
              <p className="mt-2 text-gray-500">
                지금 첫 주문을 해보세요!
              </p>
              <div className="mt-6">
                <Link to="/products">
                  <Button variant="primary">쇼핑하러 가기</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // 주문 상태에 따른 배지 색상
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'shipping':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-indigo-100 text-indigo-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          주문 내역
        </h1>
        
        <div className="mt-12 space-y-8">
          {orders.map((order) => (
            <div key={order.id} className="bg-white shadow overflow-hidden rounded-lg">
              {/* 주문 요약 정보 */}
              <div className="px-6 py-5 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    주문번호: {order.order_number}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    주문일시: {formatDate(order.created_at)}
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  {/* 주문 상태 배지 */}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                    {translateOrderStatus(order.status)}
                  </span>
                  
                  {/* 주문 상세/취소 버튼 */}
                  <div className="flex gap-2">
                    <Link to={`/orders/${order.id}`}>
                      <Button variant="secondary" size="small">상세보기</Button>
                    </Link>
                    
                    {order.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => handleCancelOrder(order.id)}
                        isLoading={isProcessing}
                      >
                        주문취소
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 주문 상품 목록 */}
              <div className="px-6 py-5 divide-y divide-gray-200">
                {order.items.map((item) => (
                  <div key={item.id} className="py-4 flex items-center">
                    <div className="flex-shrink-0 w-16 h-16 overflow-hidden rounded-md border border-gray-200">
                      <img
                        src={`/api/placeholder/64/64`} // 실제로는 상품 이미지 URL 사용
                        alt={item.product_name}
                        className="w-full h-full object-center object-cover"
                      />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          <Link to={`/products/${item.product}`} className="hover:text-indigo-600">
                            {item.product_name}
                          </Link>
                        </h4>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {formatCurrency(item.price)} x {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 주문 금액 정보 */}
              <div className="px-6 py-5 bg-gray-50 flex justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">결제 방법</p>
                  <p className="text-sm text-gray-500">
                    {order.payment_method === 'card' && '신용카드'}
                    {order.payment_method === 'bank_transfer' && '계좌이체'}
                    {order.payment_method === 'mobile' && '휴대폰 결제'}
                    {order.payment_method === 'virtual_account' && '가상계좌'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">총 결제 금액</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(order.total_price)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;