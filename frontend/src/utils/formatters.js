/**
 * 숫자를 한국 원화 형식으로 포맷
 * @param {number} amount - 포맷할 금액
 * @returns {string} 포맷된 금액 문자열
 */
export const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '₩0';
    
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  /**
   * ISO 날짜 문자열을 한국 형식으로 포맷
   * @param {string} dateString - ISO 형식의 날짜 문자열
   * @returns {string} 포맷된 날짜 문자열
   */
  export const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  /**
   * 문자열을 지정된 길이로 잘라서 반환 (긴 설명 등에 사용)
   * @param {string} text - 원본 문자열
   * @param {number} maxLength - 최대 길이
   * @returns {string} 잘린 문자열
   */
  export const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    return text.slice(0, maxLength) + '...';
  };
  
  /**
   * 주문 상태를 한글로 변환
   * @param {string} status - 주문 상태 코드
   * @returns {string} 한글 상태명
   */
  export const translateOrderStatus = (status) => {
    const statusMap = {
      'pending': '결제 대기',
      'paid': '결제 완료',
      'shipping': '배송 중',
      'delivered': '배송 완료',
      'cancelled': '주문 취소'
    };
    
    return statusMap[status] || status;
  };
  
  /**
   * 결제 방법을 한글로 변환
   * @param {string} method - 결제 방법 코드
   * @returns {string} 한글 결제 방법명
   */
  export const translatePaymentMethod = (method) => {
    const methodMap = {
      'card': '신용카드',
      'bank_transfer': '계좌이체',
      'mobile': '휴대폰 결제',
      'virtual_account': '가상계좌'
    };
    
    return methodMap[method] || method;
  };