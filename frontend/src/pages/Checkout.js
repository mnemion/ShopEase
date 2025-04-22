import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getAddresses } from '../api/auth';
import { checkout } from '../api/orders';
import { formatCurrency } from '../utils/formatters';
import { validateRequired, validatePhone, validateZipCode } from '../utils/validators';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import { toast } from 'react-toastify';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, totalItems, totalPrice, isLoading: isCartLoading, loadCart } = useCart();
  const { user } = useAuth();
  
  const [addresses, setAddresses] = useState([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isNewAddressMode, setIsNewAddressMode] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card'); // 기본 결제 방법
  const [shippingNote, setShippingNote] = useState('');
  
  // 새 배송지 폼 상태
  const [shippingForm, setShippingForm] = useState({
    recipient_name: user?.name || '',
    recipient_phone: user?.phone || '',
    shipping_zip_code: '',
    shipping_address1: '',
    shipping_address2: '',
  });
  
  // 폼 유효성 검증 에러
  const [formErrors, setFormErrors] = useState({});
  
  // 장바구니 및 배송지 정보 로드
  useEffect(() => {
    const fetchData = async () => {
      // 장바구니 정보 로드
      await loadCart();
      
      // 배송지 정보 로드
      setIsLoadingAddresses(true);
      try {
        const response = await getAddresses();
        setAddresses(response.results || []);
        
        // 기본 배송지 선택
        const defaultAddress = response.results.find(address => address.is_default);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress.id);
        } else if (response.results.length > 0) {
          setSelectedAddress(response.results[0].id);
        } else {
          // 저장된 배송지가 없으면 새 배송지 입력 모드로 설정
          setIsNewAddressMode(true);
        }
      } catch (error) {
        console.error('배송지 로드 실패:', error);
        toast.error('배송지 정보를 불러오는데 실패했습니다.');
        setIsNewAddressMode(true);
      } finally {
        setIsLoadingAddresses(false);
      }
    };
    
    fetchData();
  }, [loadCart, user]);
  
  // 장바구니가 비어있으면 장바구니 페이지로 리다이렉트
  useEffect(() => {
    if (!isCartLoading && cartItems.length === 0) {
      toast.warning('장바구니가 비어 있습니다.');
      navigate('/cart');
    }
  }, [cartItems, isCartLoading, navigate]);
  
  // 새 배송지 폼 입력 핸들러
  const handleShippingFormChange = (e) => {
    const { name, value } = e.target;
    setShippingForm({
      ...shippingForm,
      [name]: value,
    });
    
    // 폼 에러 초기화
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };
  
  // 배송지 선택 핸들러
  const handleAddressSelect = (e) => {
    const value = e.target.value;
    if (value === 'new') {
      setIsNewAddressMode(true);
      setSelectedAddress(null);
    } else {
      setIsNewAddressMode(false);
      setSelectedAddress(parseInt(value));
    }
  };
  
  // 폼 유효성 검증
  const validateForm = () => {
    const errors = {};
    
    if (isNewAddressMode) {
      // 새 배송지 입력 시 검증
      if (!validateRequired(shippingForm.recipient_name)) {
        errors.recipient_name = '수령인 이름을 입력해주세요.';
      }
      
      if (!validateRequired(shippingForm.recipient_phone)) {
        errors.recipient_phone = '연락처를 입력해주세요.';
      } else if (!validatePhone(shippingForm.recipient_phone)) {
        errors.recipient_phone = '올바른 연락처 형식이 아닙니다.';
      }
      
      if (!validateRequired(shippingForm.shipping_zip_code)) {
        errors.shipping_zip_code = '우편번호를 입력해주세요.';
      } else if (!validateZipCode(shippingForm.shipping_zip_code)) {
        errors.shipping_zip_code = '올바른 우편번호 형식이 아닙니다.';
      }
      
      if (!validateRequired(shippingForm.shipping_address1)) {
        errors.shipping_address1 = '기본주소를 입력해주세요.';
      }
    } else {
      // 기존 배송지 선택 시 검증
      if (!selectedAddress) {
        errors.address = '배송지를 선택해주세요.';
      }
    }
    
    // 결제 방법 검증
    if (!validateRequired(paymentMethod)) {
      errors.paymentMethod = '결제 방법을 선택해주세요.';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // 주문 제출 핸들러
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    // 폼 유효성 검증
    if (!validateForm()) {
      toast.error('입력 정보를 확인해주세요.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 주문 생성 API 요청 데이터 준비
      const orderData = {
        cart_items: cartItems.map(item => item.id),
        payment_method: paymentMethod,
        shipping_note: shippingNote,
      };
      
      if (isNewAddressMode) {
        // 새 배송지 정보
        orderData.recipient_name = shippingForm.recipient_name;
        orderData.recipient_phone = shippingForm.recipient_phone;
        orderData.shipping_zip_code = shippingForm.shipping_zip_code;
        orderData.shipping_address1 = shippingForm.shipping_address1;
        orderData.shipping_address2 = shippingForm.shipping_address2;
      } else {
        // 기존 배송지 정보
        const address = addresses.find(addr => addr.id === selectedAddress);
        orderData.recipient_name = address.recipient;
        orderData.recipient_phone = address.phone;
        orderData.shipping_zip_code = address.zip_code;
        orderData.shipping_address1 = address.address1;
        orderData.shipping_address2 = address.address2;
      }
      
      // 주문 생성 API 호출
      const response = await checkout(orderData);
      
      // 주문 완료 페이지로 이동
      navigate(`/order-complete/${response.id}`, { state: { order: response } });
    } catch (error) {
      console.error('주문 실패:', error);
      
      if (error.response && error.response.data) {
        // 서버 오류 메시지 표시
        if (error.response.data.detail) {
          toast.error(error.response.data.detail);
        } else {
          toast.error('주문 처리 중 오류가 발생했습니다.');
        }
      } else {
        toast.error('서버 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 로딩 중
  if (isCartLoading || isLoadingAddresses) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <Loading text="정보를 불러오는 중입니다..." />
      </div>
    );
  }
  
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          결제하기
        </h1>
        
        <form onSubmit={handleSubmitOrder} className="mt-12">
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
            {/* 배송 정보 및 결제 방법 */}
            <div className="lg:col-span-7">
              {/* 배송 정보 */}
              <div className="border-t border-gray-200 pt-10">
                <h2 className="text-lg font-medium text-gray-900">배송 정보</h2>
                
                {addresses.length > 0 && (
                  <div className="mt-6">
                    <label htmlFor="address-select" className="block text-sm font-medium text-gray-700">
                      저장된 배송지
                    </label>
                    <div className="mt-1">
                      <select
                        id="address-select"
                        value={isNewAddressMode ? 'new' : selectedAddress}
                        onChange={handleAddressSelect}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        {addresses.map((address) => (
                          <option key={address.id} value={address.id}>
                            {address.name} - {address.recipient} ({address.address1})
                          </option>
                        ))}
                        <option value="new">+ 새 배송지 입력</option>
                      </select>
                    </div>
                  </div>
                )}
                
                {isNewAddressMode ? (
                  <div className="mt-6 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                    {/* 수령인 */}
                    <div className="sm:col-span-2">
                      <label htmlFor="recipient_name" className="block text-sm font-medium text-gray-700">
                        수령인 <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="recipient_name"
                          name="recipient_name"
                          value={shippingForm.recipient_name}
                          onChange={handleShippingFormChange}
                          className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                            formErrors.recipient_name ? 'border-red-300' : ''
                          }`}
                        />
                        {formErrors.recipient_name && (
                          <p className="mt-2 text-sm text-red-600">{formErrors.recipient_name}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* 연락처 */}
                    <div className="sm:col-span-2">
                      <label htmlFor="recipient_phone" className="block text-sm font-medium text-gray-700">
                        연락처 <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1">
                        <input
                          type="tel"
                          id="recipient_phone"
                          name="recipient_phone"
                          value={shippingForm.recipient_phone}
                          onChange={handleShippingFormChange}
                          placeholder="01012345678"
                          className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                            formErrors.recipient_phone ? 'border-red-300' : ''
                          }`}
                        />
                        {formErrors.recipient_phone && (
                          <p className="mt-2 text-sm text-red-600">{formErrors.recipient_phone}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* 우편번호 */}
                    <div className="sm:col-span-2">
                      <label htmlFor="shipping_zip_code" className="block text-sm font-medium text-gray-700">
                        우편번호 <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="shipping_zip_code"
                          name="shipping_zip_code"
                          value={shippingForm.shipping_zip_code}
                          onChange={handleShippingFormChange}
                          className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                            formErrors.shipping_zip_code ? 'border-red-300' : ''
                          }`}
                        />
                        {formErrors.shipping_zip_code && (
                          <p className="mt-2 text-sm text-red-600">{formErrors.shipping_zip_code}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* 기본주소 */}
                    <div className="sm:col-span-2">
                      <label htmlFor="shipping_address1" className="block text-sm font-medium text-gray-700">
                        기본주소 <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="shipping_address1"
                          name="shipping_address1"
                          value={shippingForm.shipping_address1}
                          onChange={handleShippingFormChange}
                          className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                            formErrors.shipping_address1 ? 'border-red-300' : ''
                          }`}
                        />
                        {formErrors.shipping_address1 && (
                          <p className="mt-2 text-sm text-red-600">{formErrors.shipping_address1}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* 상세주소 */}
                    <div className="sm:col-span-2">
                      <label htmlFor="shipping_address2" className="block text-sm font-medium text-gray-700">
                        상세주소
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="shipping_address2"
                          name="shipping_address2"
                          value={shippingForm.shipping_address2}
                          onChange={handleShippingFormChange}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ) : selectedAddress && (
                  <div className="mt-6 bg-gray-50 p-4 rounded-md">
                    {addresses.find(addr => addr.id === selectedAddress) && (
                      <div>
                        <div className="font-medium text-gray-900">
                          {addresses.find(addr => addr.id === selectedAddress).name}
                        </div>
                        <div className="mt-2 text-gray-600">
                          <p>수령인: {addresses.find(addr => addr.id === selectedAddress).recipient}</p>
                          <p>연락처: {addresses.find(addr => addr.id === selectedAddress).phone}</p>
                          <p>
                            주소: ({addresses.find(addr => addr.id === selectedAddress).zip_code})
                            {addresses.find(addr => addr.id === selectedAddress).address1}
                            {addresses.find(addr => addr.id === selectedAddress).address2 && 
                              ` ${addresses.find(addr => addr.id === selectedAddress).address2}`}
                          </p>
                        </div>
                      </div>
                    )}
                    {formErrors.address && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.address}</p>
                    )}
                  </div>
                )}
                
                {/* 배송 메모 */}
                <div className="mt-6">
                  <label htmlFor="shipping_note" className="block text-sm font-medium text-gray-700">
                    배송 메모
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="shipping_note"
                      name="shipping_note"
                      rows="3"
                      value={shippingNote}
                      onChange={(e) => setShippingNote(e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="배송 시 요청사항을 입력해주세요."
                    />
                  </div>
                </div>
              </div>
              
              {/* 결제 방법 */}
              <div className="mt-10 border-t border-gray-200 pt-10">
                <h2 className="text-lg font-medium text-gray-900">결제 방법</h2>
                <div className="mt-6">
                  <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                    <div className="relative">
                      <input
                        id="payment-card"
                        name="payment-method"
                        type="radio"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="sr-only"
                      />
                      <label
                        htmlFor="payment-card"
                        className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none ${
                          paymentMethod === 'card'
                            ? 'border-indigo-500 ring-2 ring-indigo-500'
                            : 'border-gray-300'
                        }`}
                      >
                        <span className="flex flex-1">
                          <span className="flex flex-col">
                            <span className="block text-sm font-medium text-gray-900">신용카드</span>
                          </span>
                        </span>
                        {paymentMethod === 'card' && (
                          <svg
                            className="h-5 w-5 text-indigo-600"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </label>
                    </div>
                    
                    <div className="relative">
                      <input
                        id="payment-bank"
                        name="payment-method"
                        type="radio"
                        checked={paymentMethod === 'bank_transfer'}
                        onChange={() => setPaymentMethod('bank_transfer')}
                        className="sr-only"
                      />
                      <label
                        htmlFor="payment-bank"
                        className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none ${
                          paymentMethod === 'bank_transfer'
                            ? 'border-indigo-500 ring-2 ring-indigo-500'
                            : 'border-gray-300'
                        }`}
                      >
                        <span className="flex flex-1">
                          <span className="flex flex-col">
                            <span className="block text-sm font-medium text-gray-900">계좌이체</span>
                          </span>
                        </span>
                        {paymentMethod === 'bank_transfer' && (
                          <svg
                            className="h-5 w-5 text-indigo-600"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </label>
                    </div>
                    
                    <div className="relative">
                      <input
                        id="payment-mobile"
                        name="payment-method"
                        type="radio"
                        checked={paymentMethod === 'mobile'}
                        onChange={() => setPaymentMethod('mobile')}
                        className="sr-only"
                      />
                      <label
                        htmlFor="payment-mobile"
                        className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none ${
                          paymentMethod === 'mobile'
                            ? 'border-indigo-500 ring-2 ring-indigo-500'
                            : 'border-gray-300'
                        }`}
                      >
                        <span className="flex flex-1">
                          <span className="flex flex-col">
                            <span className="block text-sm font-medium text-gray-900">휴대폰 결제</span>
                          </span>
                        </span>
                        {paymentMethod === 'mobile' && (
                          <svg
                            className="h-5 w-5 text-indigo-600"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </label>
                    </div>
                    
                    <div className="relative">
                      <input
                        id="payment-virtual"
                        name="payment-method"
                        type="radio"
                        checked={paymentMethod === 'virtual_account'}
                        onChange={() => setPaymentMethod('virtual_account')}
                        className="sr-only"
                      />
                      <label
                        htmlFor="payment-virtual"
                        className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none ${
                          paymentMethod === 'virtual_account'
                            ? 'border-indigo-500 ring-2 ring-indigo-500'
                            : 'border-gray-300'
                        }`}
                      >
                        <span className="flex flex-1">
                          <span className="flex flex-col">
                            <span className="block text-sm font-medium text-gray-900">가상계좌</span>
                          </span>
                        </span>
                        {paymentMethod === 'virtual_account' && (
                          <svg
                            className="h-5 w-5 text-indigo-600"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </label>
                    </div>
                  </div>
                  {formErrors.paymentMethod && (
                    <p className="mt-2 text-sm text-red-600">{formErrors.paymentMethod}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* 주문 요약 */}
            <div className="mt-10 lg:mt-0 lg:col-span-5">
              <div className="bg-gray-50 rounded-lg px-6 py-8">
                <h2 className="text-lg font-medium text-gray-900">주문 요약</h2>
                
                {/* 주문 상품 목록 */}
                <div className="mt-6 flow-root">
                  <ul className="-my-4 divide-y divide-gray-200">
                    {cartItems.map((item) => (
                      <li key={item.id} className="flex items-center py-4">
                        <img
                          src={item.product_detail.main_image || '/assets/placeholder-product.jpg'}
                          alt={item.product_detail.name}
                          className="flex-none w-16 h-16 rounded-md border border-gray-200"
                        />
                        <div className="ml-4 flex-auto">
                          <h3 className="font-medium text-gray-900">
                            {item.product_detail.name}
                          </h3>
                          <p className="text-gray-500 text-sm">
                            {formatCurrency(item.product_detail.current_price)} x {item.quantity}
                          </p>
                        </div>
                        <p className="ml-4 flex-none font-medium text-gray-900">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* 주문 금액 */}
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">상품 수</p>
                    <p className="text-sm font-medium text-gray-900">{totalItems}개</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">상품 금액</p>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(totalPrice)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">배송비</p>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(0)}</p>
                  </div>
                  <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                    <p className="text-base font-medium text-gray-900">총 결제 금액</p>
                    <p className="text-base font-medium text-gray-900">{formatCurrency(totalPrice)}</p>
                  </div>
                </div>
                
                {/* 결제 버튼 */}
                <div className="mt-6">
                  <Button
                    type="submit"
                    variant="primary"
                    size="large"
                    fullWidth
                    isLoading={isSubmitting}
                  >
                    결제하기
                  </Button>
                </div>
                
                {/* 개인정보 동의 안내 */}
                <div className="mt-4 text-xs text-gray-500">
                  위 주문 내용을 확인하였으며, 결제 진행에 동의합니다.
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;