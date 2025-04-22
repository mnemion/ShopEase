import React from 'react';
import { Link } from 'react-router-dom';

/**
 * 기본 버튼 컴포넌트 - 일반 버튼 및 링크 버튼으로 사용 가능
 * 
 * @param {Object} props
 * @param {ReactNode} props.children - 버튼 내용
 * @param {string} props.type - 버튼 타입 (button, submit, reset)
 * @param {string} props.variant - 버튼 스타일 (primary, secondary, danger 등)
 * @param {string} props.size - 버튼 크기 (small, medium, large)
 * @param {boolean} props.fullWidth - 전체 너비 적용 여부
 * @param {boolean} props.disabled - 비활성화 여부
 * @param {boolean} props.isLoading - 로딩 상태 여부
 * @param {string} props.to - 링크 경로 (있을 경우 Link 컴포넌트로 렌더링)
 * @param {string} props.href - 외부 링크 URL (있을 경우 a 태그로 렌더링)
 * @param {function} props.onClick - 클릭 핸들러
 * @param {string} props.className - 추가 CSS 클래스
 */
const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  isLoading = false,
  to,
  href,
  onClick,
  className = '',
  icon,
  iconPosition = 'left',
  rounded = false,
  ...rest
}) => {
  // 버튼 크기 클래스
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base',
  };

  // 버튼 변형 클래스
  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500',
    info: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500',
    light: 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400',
    dark: 'bg-gray-800 text-white hover:bg-gray-900 focus:ring-gray-700',
    outline: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
    'outline-primary': 'bg-white text-indigo-600 border border-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500',
    'outline-danger': 'bg-white text-red-600 border border-red-600 hover:bg-red-50 focus:ring-red-500',
    link: 'bg-transparent text-indigo-600 hover:text-indigo-800 hover:underline p-0 shadow-none',
  };

  // 로딩 상태일 때의 버튼 내용
  const renderContent = () => {
    const content = (
      <>
        {isLoading && (
          <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {icon && iconPosition === 'left' && !isLoading && (
          <span className="mr-2">{icon}</span>
        )}
        <span>{children}</span>
        {icon && iconPosition === 'right' && (
          <span className="ml-2">{icon}</span>
        )}
      </>
    );

    return content;
  };

  // 공통 클래스
  const buttonClasses = `
    inline-flex items-center justify-center
    font-medium ${rounded ? 'rounded-full' : 'rounded-md'} 
    shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2
    transition-colors duration-200
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${fullWidth ? 'w-full' : ''}
    ${disabled || isLoading ? 'opacity-60 cursor-not-allowed' : ''}
    ${className}
  `;

  // Link 컴포넌트로 렌더링 (내부 라우팅)
  if (to && !disabled) {
    return (
      <Link to={to} className={buttonClasses} {...rest}>
        {renderContent()}
      </Link>
    );
  }

  // a 태그로 렌더링 (외부 링크)
  if (href && !disabled) {
    return (
      <a href={href} className={buttonClasses} target="_blank" rel="noopener noreferrer" {...rest}>
        {renderContent()}
      </a>
    );
  }

  // 기본 버튼으로 렌더링
  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...rest}
    >
      {renderContent()}
    </button>
  );
};

export default Button;