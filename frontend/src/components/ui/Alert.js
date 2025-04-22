import React, { useState } from 'react';

/**
 * 알림 메시지 컴포넌트
 * 
 * @param {Object} props
 * @param {ReactNode} props.children - 알림 내용
 * @param {string} props.type - 알림 타입 (success, info, warning, error)
 * @param {string} props.title - 알림 제목
 * @param {boolean} props.dismissible - 닫기 버튼 표시 여부
 * @param {function} props.onDismiss - 닫기 버튼 클릭 핸들러
 * @param {string} props.className - 추가 CSS 클래스
 * @param {boolean} props.icon - 아이콘 표시 여부
 */
const Alert = ({
  children,
  type = 'info',
  title,
  dismissible = true,
  onDismiss,
  className = '',
  icon = true,
}) => {
  const [dismissed, setDismissed] = useState(false);
  
  // 이미 닫았으면 렌더링하지 않음
  if (dismissed) {
    return null;
  }
  
  // 알림 타입별 스타일 및 아이콘
  const alertStyles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-400',
      text: 'text-green-800',
      icon: (
        <svg className="w-5 h-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-400',
      text: 'text-blue-800',
      icon: (
        <svg className="w-5 h-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-400',
      text: 'text-yellow-800',
      icon: (
        <svg className="w-5 h-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-400',
      text: 'text-red-800',
      icon: (
        <svg className="w-5 h-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
    },
  };
  
  // 현재 타입에 맞는 스타일
  const currentStyle = alertStyles[type] || alertStyles.info;
  
  // 닫기 버튼 클릭 핸들러
  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };
  
  return (
    <div className={`p-4 mb-4 border-l-4 ${currentStyle.bg} ${currentStyle.border} ${className}`} role="alert">
      <div className="flex items-start">
        {/* 아이콘 */}
        {icon && (
          <div className="flex-shrink-0 mr-3">
            {currentStyle.icon}
          </div>
        )}
        
        {/* 내용 */}
        <div className={`${dismissible ? 'flex-grow' : 'flex-1'} ${currentStyle.text}`}>
          {/* 제목 */}
          {title && (
            <h3 className="text-lg font-medium">{title}</h3>
          )}
          
          {/* 메시지 */}
          <div className="text-sm">
            {children}
          </div>
        </div>
        
        {/* 닫기 버튼 */}
        {dismissible && (
          <div className="flex-shrink-0 ml-4">
            <button
              type="button"
              className={`${currentStyle.text} hover:opacity-75 focus:outline-none`}
              onClick={handleDismiss}
              aria-label="닫기"
            >
              <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;