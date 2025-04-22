import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { getOrder, completePayment } from '../api/orders';
import { formatCurrency, formatDate, translatePaymentMethod } from '../utils/formatters';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import { toast } from 'react-toastify';

const OrderComplete = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(location.state?.order || null);
  const [isLoading, setIsLoading] = useState(!location.state?.order);
  const [error, setError] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // 주문 정보 가져오기
  useEffect(() => {
    const fetchOrder = async () => {
      if (order) return; // 이미 주문 정보가 있으면 API 호출 건너뛰기
      
      setIsLoading(true);
      
      try {
        const data = await getOrder(orderId);
        setOrder(data);
      } catch (error) {
        console.error('주문 정보 로드 실패:', error);
        setError('주문 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrder();
  }, [orderId, order]);
  
  // 결제 완료 처리 핸들러 (시뮬레이션)
  const handleCompletePayment = async () => {
    setIsProcessingPayment(true);
    
    try {
      // 결제 ID 생성 (실제로는 PG사에서 제공)
      const paymentId = `PID${Date.now()}`;
      
      // 결제 완료 처리 API 호출
      const updatedOrder = await completePayment(order.id, { payment_id: paymentId });
      setOrder(updatedOrder);
      
      toast.success('결제가 완료되었습니다.');
    } catch (error) {
      console.error('결제 처리 실패:', error);
      toast.error('결제 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessingPayment(false);
    }
  };
  
  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <Loading text="주문 정보를 불러오는 중입니다..." />
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
          <Button onClick={() => navigate('/orders')}>주문 내역으로 이동</Button>
        </div>
      </div>
    );
  }
  
  // 주문 정보가 없는 경우
  if (!order) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">주문 정보를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-6">요청하신 주문 정보가 존재하지 않습니다.</p>
          <Link to="/orders">
            <Button>주문 내역으로 이동</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* 주문 완료 헤더 */}
          <div className="text-center">
            <svg
              className="mx-auto h-16 w-16 text-green-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <h1 className="mt-4 text-3xl font-extrabold text-gray-900">
              주문이 완료되었습니다
            </h1>
            <p className="mt-2 text-lg text-gray-500">
              주문번호: {order.order_number}
            </p>
            <p className="mt-1 text-gray-500">
              주문일시: {formatDate(order.created_at)}
            </p>
          </div>
          
          {/* 결제 상태 */}
          <div className="mt-8">
            <div className={`rounded-md ${
              order.status === 'paid' ? 'bg-green-50' : 'bg-yellow-50'
            } p-4`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {order.status === 'paid' ? (
                    <svg
                      className="h-5 w-5 text-green-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${
                    order.status === 'paid' ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {order.status === 'paid' ? '결제 완료' : '결제 대기 중'}
                  </h3>
                  <div className={`mt-2 text-sm ${
                    order.status === 'paid' ? 'text-green-700' : 'text-yellow-700'
                  }`}>
                    {order.status === 'paid' ? (
                      <p>
                        {formatDate(order.paid_at)}에 결제가 완료되었습니다.
                      </p>
                    ) : (
                      <div>
                        <p className="mb-2">결제를 완료해주세요.</p>
                        <Button
                          onClick={handleCompletePayment}
                          variant="primary"
                          size="small"
                          isLoading={isProcessingPayment}
                        >
                          결제 완료 처리 (시뮬레이션)
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 주문 요약 정보 */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">주문 정보</h2>
            
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">결제 방법</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {translatePaymentMethod(order.payment_method)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">주문 상태</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {order.status === 'pending' && '결제 대기'}
                  {order.status === 'paid' && '결제 완료'}
                  {order.status === 'shipping' && '배송 중'}
                  {order.status === 'delivered' && '배송 완료'}
                  {order.status === 'cancelled' && '주문 취소'}
                </dd>
              </div>
              
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">배송지 정보</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <address className="not-italic">
                    <span className="block">수령인: {order.recipient_name}</span>
                    <span className="block">연락처: {order.recipient_phone}</span>
                    <span className="block">
                      주소: ({order.shipping_zip_code}) {order.shipping_address1}
                      {order.shipping_address2 && ` ${order.shipping_address2}`}
                    </span>
                    {order.shipping_note && (
                      <span className="block">배송 메모: {order.shipping_note}</span>
                    )}
                  </address>
                </dd>
              </div>
            </dl>
          </div>
          
          {/* 주문 상품 목록 */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">주문 상품</h2>
            <div className="border-t border-gray-200 divide-y divide-gray-200">
              {order.items.map((item) => (
                <div key={item.id} className="py-6 flex">
                  <div className="flex-none">
                    <Link to={`/products/${item.product}`}>
                      <img
                        src={`/api/placeholder/100/100`} // 실제로는 상품 이미지 URL 사용
                        alt={item.product_name}
                        className="w-20 h-20 object-center object-cover bg-gray-200 rounded-md"
                      />
                    </Link>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between">
                      <h3 className="text-base font-medium text-gray-900">
                        <Link to={`/products/${item.product}`} className="hover:text-indigo-600">
                          {item.product_name}
                        </Link>
                      </h3>
                      <p className="text-base font-medium text-gray-900 ml-4">
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
          </div>
          
          {/* 주문 금액 정보 */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">결제 내역</h2>
            
            <dl className="space-y-4">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">상품 금액</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {formatCurrency(order.total_price)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">배송비</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {formatCurrency(0)}
                </dd>
              </div>
              <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                <dt className="text-base font-medium text-gray-900">총 결제 금액</dt>
                <dd className="text-base font-medium text-gray-900">
                  {formatCurrency(order.total_price)}
                </dd>
              </div>
            </dl>
          </div>
          
          {/* 버튼 그룹 */}
          <div className="mt-8 flex justify-between">
            <Link to="/products">
              <Button variant="secondary">쇼핑 계속하기</Button>
            </Link>
            <Link to="/orders">
              <Button>주문 내역 보기</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderComplete;