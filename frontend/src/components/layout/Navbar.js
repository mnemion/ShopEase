import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCategories } from '../../context/CategoryContext';

/**
 * 메인 내비게이션 바 컴포넌트
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - 모바일 메뉴 오픈 상태
 * @param {function} props.onClose - 모바일 메뉴 닫기 핸들러
 */
const Navbar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { categories, isLoading } = useCategories(); // Context에서 카테고리 데이터 가져오기
  const [dropdown, setDropdown] = useState(null);

  // 드롭다운 토글 함수
  const toggleDropdown = (id) => {
    if (dropdown === id) {
      setDropdown(null);
    } else {
      setDropdown(id);
    }
  };

  // 현재 경로에 따른 활성 상태 체크
  const isActive = (path) => {
    return location.pathname === path;
  };

  // 메뉴 아이템 구성 (카테고리 부분을 동적으로 변경)
  const menuItems = [
    { path: '/', label: '홈', hasDropdown: false },
    { path: '/products', label: '전체 상품', hasDropdown: false },
    {
      id: 'categories',
      label: '카테고리',
      hasDropdown: true,
      // Context에서 가져온 categories 배열을 사용하여 드롭다운 아이템 생성
      items: isLoading
        ? [{ path: '#', label: '로딩 중...' }] // 로딩 중 표시
        : categories.length > 0
          ? categories.map(cat => ({
              path: `/categories/${cat.id}`,
              label: cat.name
            }))
          : [{ path: '#', label: '카테고리 없음' }] // 카테고리 없을 때
    },
    {
      id: 'featured',
      label: '추천 상품',
      hasDropdown: true,
      items: [
        { path: '/products?is_featured=true', label: '추천 상품' },
        { path: '/products?is_on_sale=true', label: '할인 상품' },
        { path: '/products?ordering=-created_at', label: '신상품' }
      ]
    }
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          {/* 데스크톱 내비게이션 */}
          <div className="hidden md:flex md:space-x-8">
            {menuItems.map((item, index) => (
              <div key={item.id || index} className="relative">
                {item.hasDropdown ? (
                  <>
                    <button
                      onClick={() => toggleDropdown(item.id)}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                        dropdown === item.id
                          ? 'border-indigo-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } text-sm font-medium`}
                    >
                      {item.label}
                      <svg
                        className={`ml-1 h-5 w-5 transition-transform duration-200 ${
                          dropdown === item.id ? 'transform rotate-180' : ''
                        }`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {dropdown === item.id && (
                      <div className="absolute left-0 mt-1 z-10 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-1">
                        {item.items && item.items.map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            to={subItem.path}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setDropdown(null)}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                      isActive(item.path)
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } text-sm font-medium`}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 모바일 내비게이션 메뉴 */}
      {isOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {menuItems.map((item, index) => (
              <div key={item.id || index}>
                {item.hasDropdown ? (
                  <div>
                    <button
                      onClick={() => toggleDropdown(item.id)}
                      className={`w-full flex justify-between items-center pl-3 pr-4 py-2 border-l-4 ${
                        dropdown === item.id
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                      } text-base font-medium`}
                    >
                      {item.label}
                      <svg
                        className={`h-5 w-5 transition-transform duration-200 ${
                          dropdown === item.id ? 'transform rotate-180' : ''
                        }`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {dropdown === item.id && (
                      <div className="pl-6 pr-4 py-2 space-y-1">
                        {item.items && item.items.map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            to={subItem.path}
                            className="block py-2 pl-3 pr-4 text-base font-medium text-gray-600 hover:text-indigo-700 hover:bg-gray-50"
                            onClick={onClose}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    className={`block pl-3 pr-4 py-2 border-l-4 ${
                      isActive(item.path)
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                    } text-base font-medium`}
                    onClick={onClose}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;