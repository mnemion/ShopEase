import React from 'react';

/**
 * 로딩 인디케이터 컴포넌트
 */
const Loading = ({ fullScreen = false, size = 'medium', text = '로딩 중...' }) => {
  // 크기별 스타일 클래스
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-10 w-10',
    large: 'h-16 w-16'
  };

  // 전체 화면일 경우와 아닐 경우 컨테이너 스타일
  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50'
    : 'flex items-center justify-center p-4';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center">
        <svg
          className={`animate-spin text-indigo-600 ${sizeClasses[size]}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        {text && <p className="mt-3 text-indigo-600 font-medium">{text}</p>}
      </div>
    </div>
  );
};

export default Loading;