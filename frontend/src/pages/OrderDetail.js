import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getOrder, cancelOrder, completePayment } from '../api/orders';
import { formatCurrency, formatDate, translateOrderStatus, translatePaymentMethod } from '../utils/formatters';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import { toast } from 'react-toastify';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 주문 정보 가져오기
  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      
      try {
        const data = await getOrder(id);
        setOrder(data);
      } catch (error) {
        console.error('주문 정보 로드 실패:', error);
        setError('주문 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrder();
  }, [id]);
  
  // 주문 취소 핸들러
  const handleCancelOrder = async () => {
    if (!window.confirm('주문을 취소하시겠습니까?')) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const updatedOrder = await cancelOrder(order.id);
      setOrder(updatedOrder);
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
  
  // 결제 완료 처리 핸들러 (시뮬레이션)
  const handleCompletePayment = async () => {
    setIsProcessing(true);
    
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
      setIsProcessing(false);
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
        <div className="max-w-3xl mx-auto">
          {/* 주문 상세 헤더 */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              주문 상세 정보
            </h1>
            <Link to="/orders">
              <Button variant="secondary" size="small">주문 내역으로 돌아가기</Button>
            </Link>
          </div>
          
          {/* 주문 기본 정보 */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <p className="text-sm text-gray-500">주문번호</p>
                <p className="text-lg font-medium text-gray-900">{order.order_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">주문일시</p>
                <p className="text-lg font-medium text-gray-900">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">주문 상태</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(order.status)}`}>
                  {translateOrderStatus(order.status)}
                </span>
              </div>
            </div>
            
            {/* 주문 취소/결제 버튼 */}
            {order.status === 'pending' && (
              <div className="mt-6 flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={handleCancelOrder}
                  isLoading={isProcessing}
                >
                  주문 취소
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCompletePayment}
                  isLoading={isProcessing}
                >
                  결제 완료 처리 (시뮬레이션)
                </Button>
              </div>
            )}
          </div>
          
          {/* 배송 정보 */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">배송 정보</h2>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <dl className="divide-y divide-gray-200">
                <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">수령인</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {order.recipient_name}
                  </dd>
                </div>
                <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">연락처</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {order.recipient_phone}
                  </dd>
                </div>
                <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">주소</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    ({order.shipping_zip_code}) {order.shipping_address1}
                    {order.shipping_address2 && ` ${order.shipping_address2}`}
                  </dd>
                </div>
                {order.shipping_note && (
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">배송 메모</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {order.shipping_note}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
          
          {/* 결제 정보 */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">결제 정보</h2>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <dl className="divide-y divide-gray-200">
                <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">결제 방법</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {translatePaymentMethod(order.payment_method)}
                  </dd>
                </div>
                <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">결제 상태</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {order.status === 'pending' && '결제 대기'}
                    {order.status === 'paid' && '결제 완료'}
                    {order.status === 'cancelled' && '주문 취소'}
                    {/* TODO: 필요시 추가 상태 처리 */}
                  </dd>
                </div>
                {order.paid_at && (
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">결제일시</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {formatDate(order.paid_at)}
                    </dd>
                  </div>
                )}
                {order.payment_id && (
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">결제 번호</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {order.payment_id}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
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
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;