import React from 'react';
import { Link } from 'react-router-dom';

/**
 * 브레드크럼 (이동 경로) 컴포넌트
 * 
 * @param {Object} props
 * @param {Array} props.items - 경로 아이템 배열 [{label: '홈', path: '/'}, ...]
 * @param {string} props.separator - 구분자 (기본값: '>')
 * @param {string} props.className - 추가 CSS 클래스
 * @param {boolean} props.showHomeIcon - 홈 아이콘 표시 여부
 */
const Breadcrumb = ({
  items = [],
  separator = '>',
  className = '',
  showHomeIcon = true,
}) => {
  // 아이템이 없으면 렌더링하지 않음
  if (items.length === 0) {
    return null;
  }

  // 홈 아이콘 SVG
  const HomeIcon = () => (
    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
  );

  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {items.map((item, index) => (
          <li key={index} className="inline-flex items-center">
            {index > 0 && (
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">{separator}</span>
              </div>
            )}
            
            {item.path ? (
              <Link
                to={item.path}
                className={`inline-flex items-center text-sm font-medium ${
                  index === items.length - 1
                    ? 'text-gray-500 hover:text-gray-700'
                    : 'text-gray-700 hover:text-indigo-600'
                }`}
              >
                {index === 0 && showHomeIcon && <HomeIcon />}
                {item.label}
              </Link>
            ) : (
              <span className="inline-flex items-center text-sm font-medium text-gray-500">
                {index === 0 && showHomeIcon && <HomeIcon />}
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;