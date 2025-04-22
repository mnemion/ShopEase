import React from 'react';

/**
 * 페이지네이션 컴포넌트
 * 
 * @param {Object} props
 * @param {number} props.currentPage - 현재 페이지 번호
 * @param {number} props.totalPages - 전체 페이지 수
 * @param {function} props.onPageChange - 페이지 변경 핸들러
 * @param {number} props.siblingsCount - 현재 페이지 양쪽에 표시할 페이지 수 (기본값: 1)
 * @param {boolean} props.showFirstLast - 처음/마지막 페이지 버튼 표시 여부
 * @param {Object} props.labels - 버튼 레이블 객체 (prev, next, first, last)
 * @param {string} props.className - 추가 CSS 클래스
 */
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingsCount = 1,
  showFirstLast = true,
  labels = {
    prev: '이전',
    next: '다음',
    first: '처음',
    last: '마지막'
  },
  className = '',
}) => {
  // 페이지 번호가 1 미만이거나 전체 페이지 수가 1 이하면 렌더링하지 않음
  if (currentPage < 1 || totalPages <= 1) {
    return null;
  }

  // 페이지 버튼 생성 함수
  const generatePages = () => {
    // 표시할 페이지 범위 계산
    const leftSiblingIndex = Math.max(currentPage - siblingsCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingsCount, totalPages);

    // 처음/마지막 페이지 표시 여부
    const showLeftDots = leftSiblingIndex > 2;
    const showRightDots = rightSiblingIndex < totalPages - 1;

    // 페이지 번호 배열 생성
    const pages = [];

    // 첫 페이지 버튼
    if (showFirstLast) {
      pages.push(1);
    } else if (leftSiblingIndex > 1) {
      pages.push(1);
    }

    // 왼쪽 줄임표
    if (showLeftDots) {
      pages.push('...');
    }

    // 중간 페이지 번호들
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    // 오른쪽 줄임표
    if (showRightDots) {
      pages.push('...');
    }

    // 마지막 페이지 버튼
    if (showFirstLast && !pages.includes(totalPages)) {
      pages.push(totalPages);
    } else if (rightSiblingIndex < totalPages) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = generatePages();

  return (
    <nav className={`flex justify-center ${className}`} aria-label="페이지네이션">
      <ul className="inline-flex items-center -space-x-px">
        {/* 첫 페이지 버튼 */}
        {showFirstLast && (
          <li>
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className={`block px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 ${
                currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <span className="sr-only">{labels.first}</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M8.707 5.293a1 1 0 010 1.414L5.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </li>
        )}

        {/* 이전 페이지 버튼 */}
        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`block px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 ${!showFirstLast ? 'rounded-l-lg' : ''} hover:bg-gray-100 hover:text-gray-700 ${
              currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <span className="sr-only">{labels.prev}</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </li>

        {/* 페이지 번호 버튼 */}
        {pages.map((page, index) => {
          if (page === '...') {
            return (
              <li key={`dots-${index}`}>
                <span className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300">
                  ...
                </span>
              </li>
            );
          }

          return (
            <li key={page}>
              <button
                onClick={() => onPageChange(page)}
                className={`px-3 py-2 leading-tight border ${
                  currentPage === page
                    ? 'text-blue-600 border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700'
                    : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                {page}
              </button>
            </li>
          );
        })}

        {/* 다음 페이지 버튼 */}
        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`block px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 ${!showFirstLast ? 'rounded-r-lg' : ''} hover:bg-gray-100 hover:text-gray-700 ${
              currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <span className="sr-only">{labels.next}</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </li>

        {/* 마지막 페이지 버튼 */}
        {showFirstLast && (
          <li>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className={`block px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 ${
                currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <span className="sr-only">{labels.last}</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M11.293 14.707a1 1 0 010-1.414L14.586 10l-3.293-3.293a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Pagination;