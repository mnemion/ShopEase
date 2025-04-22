import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import Navbar from './Navbar';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 검색 핸들러
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };
  
  // 로그아웃 핸들러
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  // 모바일 메뉴 토글
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  return (
    <header className="bg-white shadow-md">
      {/* 상단 네비게이션 바 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* 로고 및 메인 네비게이션 */}
          <div className="flex">
            {/* 로고 */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-indigo-600">
                ShopEase
              </Link>
            </div>
          </div>
          
          {/* 검색, 장바구니, 사용자 메뉴 */}
          <div className="flex items-center">
            {/* 검색 폼 */}
            <form onSubmit={handleSearch} className="hidden sm:flex sm:items-center">
              <div className="relative">
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="상품 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <button
                type="submit"
                className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                검색
              </button>
            </form>
            
            {/* 장바구니 링크 */}
            <Link to="/cart" className="ml-4 flex items-center">
              <span className="relative inline-block">
                <svg className="h-6 w-6 text-gray-500 hover:text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute top-0 right-0 -mt-1 -mr-1 px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                    {totalItems}
                  </span>
                )}
              </span>
            </Link>
            
            {/* 사용자 메뉴 */}
            <div className="ml-4 relative">
              {isAuthenticated ? (
                <div className="flex items-center">
                  <div className="hidden md:flex md:items-center">
                    <Link to="/profile" className="text-sm font-medium text-gray-700 hover:text-indigo-600">
                      {user?.name || (user?.email ? user.email.split('@')[0] : 'User')}
                    </Link>
                    <span className="mx-2 text-gray-300">|</span>
                    <button
                      onClick={handleLogout}
                      className="text-sm font-medium text-gray-700 hover:text-indigo-600"
                    >
                      로그아웃
                    </button>
                  </div>
                  
                  {/* 모바일에서는 아바타 아이콘으로 표시 */}
                  <div className="md:hidden flex items-center">
                    <Link to="/profile" className="text-gray-500 hover:text-gray-700">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-800 font-medium">
                          {user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U')}
                        </span>
                      </div>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-indigo-600">
                    로그인
                  </Link>
                  <span className="mx-2 text-gray-300">|</span>
                  <Link to="/register" className="text-sm font-medium text-gray-700 hover:text-indigo-600">
                    회원가입
                  </Link>
                </div>
              )}
            </div>
            
            {/* 모바일 메뉴 버튼 */}
            <div className="ml-4 flex items-center md:hidden">
              <button
                type="button"
                className="bg-white p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                onClick={toggleMobileMenu}
              >
                <span className="sr-only">메뉴 열기</span>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 메인 내비게이션 */}
      <Navbar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      
      {/* 모바일 메뉴 */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          {/* 모바일 검색 폼 */}
          <form onSubmit={handleSearch} className="px-3 py-2">
            <div className="relative">
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="상품 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <button
              type="submit"
              className="mt-2 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              검색
            </button>
          </form>
          
          {/* 모바일 사용자 메뉴 */}
          <div className="pt-4 pb-3 border-t border-gray-200">
            {isAuthenticated ? (
              <div>
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-800 font-bold">
                        {user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U')}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{user?.name || (user?.email ? user.email.split('@')[0] : 'User')}</div>
                    <div className="text-sm font-medium text-gray-500">{user?.email || ''}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    내 정보
                  </Link>
                  <Link
                    to="/orders"
                    className="block px-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    주문 내역
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <Link
                  to="/login"
                  className="block px-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  로그인
                </Link>
                <Link
                  to="/register"
                  className="block px-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;