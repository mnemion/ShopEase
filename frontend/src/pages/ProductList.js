import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { getProducts, getCategories } from '../api/products';
import ProductList from '../components/product/ProductList';
import Loading from '../components/ui/Loading';
import Button from '../components/ui/Button';

const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('-created_at'); // 기본 정렬: 최신순
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [searchQuery, setSearchQuery] = useState('');
  
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  
  // URL 쿼리 파라미터 파싱
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    
    // 검색어
    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
    } else {
      setSearchQuery('');
    }
    
    // 정렬 옵션
    const ordering = searchParams.get('ordering');
    if (ordering) {
      setSortBy(ordering);
    } else {
      setSortBy('-created_at');
    }
    
    // 가격 범위
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    setPriceRange({
      min: minPrice || '',
      max: maxPrice || ''
    });
    
    // 페이지 번호
    const page = parseInt(searchParams.get('page')) || 1;
    setCurrentPage(page);
    
    // URL에서 카테고리 ID 가져오기 (URL path 파라미터)
    const categoryId = params.categoryId;
    if (categoryId) {
      setSelectedCategory(parseInt(categoryId));
    } else {
      setSelectedCategory(null);
    }
  }, [location.search, params.categoryId]);
  
  // 카테고리 데이터 가져오기
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        setCategories(response.results);
      } catch (error) {
        console.error('카테고리 로드 실패:', error);
      }
    };
    
    fetchCategories();
  }, []);
  
  // 상품 데이터 가져오기
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // API 요청 파라미터 구성
        const params = {
          page: currentPage,
          ordering: sortBy,
        };
        
        // 카테고리 필터링
        if (selectedCategory) {
          params.category = selectedCategory;
        }
        
        // 검색어
        if (searchQuery) {
          params.search = searchQuery;
        }
        
        // 가격 범위
        if (priceRange.min) {
          params.min_price = priceRange.min;
        }
        if (priceRange.max) {
          params.max_price = priceRange.max;
        }
        
        // API 호출
        const response = await getProducts(params);
        
        setProducts(response.results);
        
        // 페이지네이션 정보 설정
        setTotalPages(Math.ceil(response.count / 10)); // 한 페이지당 10개 상품 표시 가정
      } catch (error) {
        console.error('상품 로드 실패:', error);
        setError('상품 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, [currentPage, sortBy, selectedCategory, searchQuery, priceRange.min, priceRange.max]);
  
  // 정렬 옵션 변경 핸들러
  const handleSortChange = (e) => {
    const newSortBy = e.target.value;
    setSortBy(newSortBy);
    
    // URL 쿼리 파라미터 업데이트
    updateQueryParams({ ordering: newSortBy, page: 1 });
  };
  
  // 카테고리 변경 핸들러
  const handleCategoryChange = (categoryId) => {
    if (categoryId === 'all') {
      setSelectedCategory(null);
      navigate('/products');
    } else {
      setSelectedCategory(parseInt(categoryId));
      navigate(`/categories/${categoryId}`);
    }
    
    // 페이지 초기화
    updateQueryParams({ page: 1 });
  };
  
  // 가격 범위 입력 핸들러
  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setPriceRange(prev => ({ ...prev, [name]: value }));
  };
  
  // 가격 필터 적용 핸들러
  const handlePriceFilter = () => {
    updateQueryParams({
      min_price: priceRange.min || null,
      max_price: priceRange.max || null,
      page: 1
    });
  };
  
  // 검색 핸들러
  const handleSearch = (e) => {
    e.preventDefault();
    updateQueryParams({ search: searchQuery, page: 1 });
  };
  
  // 페이지 변경 핸들러
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    updateQueryParams({ page: pageNumber });
  };
  
  // URL 쿼리 파라미터 업데이트 함수
  const updateQueryParams = (params) => {
    const searchParams = new URLSearchParams(location.search);
    
    // 기존 파라미터 유지하면서 새 파라미터 업데이트/추가
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === '') {
        searchParams.delete(key);
      } else {
        searchParams.set(key, value);
      }
    });
    
    // URL 업데이트
    navigate({
      pathname: location.pathname,
      search: searchParams.toString()
    });
  };
  
  // 필터 초기화 핸들러
  const handleResetFilters = () => {
    navigate('/products');
    setSelectedCategory(null);
    setSortBy('-created_at');
    setPriceRange({ min: '', max: '' });
    setSearchQuery('');
    setCurrentPage(1);
  };
  
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {selectedCategory
              ? categories.find(cat => cat.id === selectedCategory)?.name || '상품 목록'
              : searchQuery
                ? `"${searchQuery}" 검색 결과`
                : '전체 상품'}
          </h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 사이드바 (필터) */}
          <div className="md:col-span-1">
            <div className="space-y-6">
              {/* 검색 폼 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">검색</h3>
                <form onSubmit={handleSearch} className="flex">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="상품명 검색..."
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                  <button
                    type="submit"
                    className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    검색
                  </button>
                </form>
              </div>
              
              {/* 카테고리 필터 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">카테고리</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      id="category-all"
                      name="category"
                      type="radio"
                      checked={!selectedCategory}
                      onChange={() => handleCategoryChange('all')}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                    />
                    <label htmlFor="category-all" className="ml-3 text-sm text-gray-700">
                      전체
                    </label>
                  </div>
                  
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center">
                      <input
                        id={`category-${category.id}`}
                        name="category"
                        type="radio"
                        checked={selectedCategory === category.id}
                        onChange={() => handleCategoryChange(category.id)}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                      />
                      <label htmlFor={`category-${category.id}`} className="ml-3 text-sm text-gray-700">
                        {category.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 가격 범위 필터 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">가격</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      name="min"
                      value={priceRange.min}
                      onChange={handlePriceChange}
                      placeholder="최소 가격"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                    <span>~</span>
                    <input
                      type="number"
                      name="max"
                      value={priceRange.max}
                      onChange={handlePriceChange}
                      placeholder="최대 가격"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  <button
                    onClick={handlePriceFilter}
                    className="mt-2 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    적용
                  </button>
                </div>
              </div>
              
              {/* 필터 초기화 버튼 */}
              <button
                onClick={handleResetFilters}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                필터 초기화
              </button>
            </div>
          </div>
          
          {/* 상품 목록 */}
          <div className="md:col-span-3">
            {/* 정렬 옵션 */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-gray-500">
                {isLoading ? '로딩 중...' : `총 ${products.length}개 상품`}
              </p>
              <div className="flex items-center">
                <label htmlFor="sort" className="sr-only">정렬</label>
                <select
                  id="sort"
                  name="sort"
                  value={sortBy}
                  onChange={handleSortChange}
                  className="focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-gray-500 sm:text-sm rounded-md"
                >
                  <option value="-created_at">최신순</option>
                  <option value="price">가격 낮은순</option>
                  <option value="-price">가격 높은순</option>
                </select>
              </div>
            </div>
            
            {/* 상품 그리드 */}
            <ProductList
              products={products}
              isLoading={isLoading}
              error={error}
            />
            
            {/* 페이지네이션 */}
            {!isLoading && totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  {/* 이전 페이지 버튼 */}
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">이전</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* 페이지 번호 버튼 */}
                  {[...Array(totalPages).keys()].map((page) => (
                    <button
                      key={page + 1}
                      onClick={() => handlePageChange(page + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border ${
                        currentPage === page + 1
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      } text-sm font-medium`}
                    >
                      {page + 1}
                    </button>
                  ))}
                  
                  {/* 다음 페이지 버튼 */}
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">다음</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;