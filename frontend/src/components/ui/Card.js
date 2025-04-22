import React from 'react';

/**
 * 재사용 가능한 카드 컴포넌트
 * 
 * @param {Object} props
 * @param {ReactNode} props.children - 카드 내용
 * @param {ReactNode} props.header - 카드 헤더 (선택적)
 * @param {ReactNode} props.footer - 카드 푸터 (선택적)
 * @param {string} props.className - 추가 CSS 클래스 (선택적)
 * @param {boolean} props.hoverable - 호버 효과 적용 여부 (선택적)
 * @param {string} props.variant - 카드 색상 변형 (선택적: 'default', 'primary', 'secondary', 'outlined')
 * @param {boolean} props.noPadding - 내부 패딩 없애기 (선택적)
 * @param {string} props.width - 카드 너비 (선택적)
 * @param {function} props.onClick - 클릭 핸들러 (선택적)
 */
const Card = ({
  children,
  header,
  footer,
  className = '',
  hoverable = false,
  variant = 'default',
  noPadding = false,
  width = 'auto',
  onClick,
  ...rest
}) => {
  // 변형에 따른 스타일 클래스
  const variantClasses = {
    default: 'bg-white border border-gray-200',
    primary: 'bg-indigo-50 border border-indigo-200',
    secondary: 'bg-gray-50 border border-gray-200',
    outlined: 'bg-white border border-gray-300',
    success: 'bg-green-50 border border-green-200',
    danger: 'bg-red-50 border border-red-200',
    warning: 'bg-yellow-50 border border-yellow-200',
  };
  
  // 너비 스타일 생성
  const widthStyle = width !== 'auto' ? { width } : {};
  
  return (
    <div
      className={`
        overflow-hidden rounded-lg shadow-sm
        ${variantClasses[variant]}
        ${hoverable ? 'transition-shadow duration-300 hover:shadow-md' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={widthStyle}
      onClick={onClick}
      {...rest}
    >
      {/* 카드 헤더 */}
      {header && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          {header}
        </div>
      )}
      
      {/* 카드 내용 */}
      <div className={noPadding ? '' : 'p-4'}>
        {children}
      </div>
      
      {/* 카드 푸터 */}
      {footer && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
};

/**
 * 카드 헤더 컴포넌트
 */
Card.Header = ({ children, className = '', ...rest }) => (
  <div className={`font-medium text-gray-800 ${className}`} {...rest}>
    {children}
  </div>
);

/**
 * 카드 제목 컴포넌트
 */
Card.Title = ({ children, className = '', ...rest }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`} {...rest}>
    {children}
  </h3>
);

/**
 * 카드 부제목 컴포넌트
 */
Card.Subtitle = ({ children, className = '', ...rest }) => (
  <h4 className={`text-sm text-gray-600 mt-1 ${className}`} {...rest}>
    {children}
  </h4>
);

/**
 * 카드 텍스트 컴포넌트
 */
Card.Text = ({ children, className = '', ...rest }) => (
  <p className={`text-gray-700 ${className}`} {...rest}>
    {children}
  </p>
);

/**
 * 카드 이미지 컴포넌트
 */
Card.Image = ({ src, alt = '', className = '', ...rest }) => (
  <div className="w-full overflow-hidden">
    <img
      src={src}
      alt={alt}
      className={`w-full h-auto object-cover ${className}`}
      {...rest}
    />
  </div>
);

/**
 * 카드 액션 영역 컴포넌트
 */
Card.Actions = ({ children, className = '', ...rest }) => (
  <div className={`mt-4 flex items-center justify-end space-x-2 ${className}`} {...rest}>
    {children}
  </div>
);

/**
 * 카드 그룹 컴포넌트 - 여러 카드를 그리드로 배열
 */
Card.Group = ({ children, columns = 1, gap = 4, className = '', ...rest }) => {
  // 컬럼 수에 따른 그리드 클래스
  const columnsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };
  
  // 간격에 따른 클래스
  const gapClass = `gap-${gap}`;
  
  return (
    <div className={`grid ${columnsClass[columns]} ${gapClass} ${className}`} {...rest}>
      {children}
    </div>
  );
};

export default Card;