import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../api/products';
import ProductList from '../components/product/ProductList';
import Loading from '../components/ui/Loading';
import Button from '../components/ui/Button';
import { useCategories } from '../context/CategoryContext';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [error, setError] = useState(null);
  
  // CategoryContext에서 카테고리 데이터 가져오기
  const { categories: homeCategories, isLoading: isLoadingCategories, error: categoryError, isConnected, reconnect, fetchCategories, clearLocalStorage } = useCategories();

  // 상품 데이터 가져오기
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      setError(null);

      try {
        // 병렬로 API 호출
        const [featuredResponse, newResponse] = await Promise.all([
          getProducts({ is_featured: true, limit: 4 }),
          getProducts({ ordering: '-created_at', limit: 8 })
        ]);

        setFeaturedProducts(featuredResponse.results);
        setNewProducts(newResponse.results);
      } catch (error) {
        console.error('상품 데이터 로드 실패:', error);
        setError('상품 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // 메인 배너 섹션
  const MainBanner = () => (
    <div className="relative bg-gray-900 text-white">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-400 opacity-90"></div>
      <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">ShopEase와 함께하는 쇼핑</h1>
        <p className="mt-6 text-xl max-w-3xl">
          쉽고 간편한 쇼핑 경험, 다양한 상품과 특별한 혜택을 만나보세요.
        </p>
        <div className="mt-10">
          <Link to="/products">
            <Button variant="primary" size="large">
              쇼핑하러 가기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );

  // 추천 상품 섹션
  const FeaturedProducts = () => (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">추천 상품</h2>
          <Link to="/products?is_featured=true" className="text-indigo-600 hover:text-indigo-800">
            모두 보기 &rarr;
          </Link>
        </div>
        {isLoadingProducts ? (
          <Loading />
        ) : error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : (
          <ProductList products={featuredProducts} />
        )}
      </div>
    </section>
  );

  // 카테고리 섹션 (수정됨)
  const Categories = () => {
    // 카테고리 로딩 중이거나 에러 발생 시
    if (isLoadingCategories) return <Loading text="카테고리 로딩 중..." />;
    if (categoryError) return <p className="text-red-500 text-center">{categoryError}</p>;
    if (!homeCategories || homeCategories.length === 0) return <p className="text-gray-500 text-center">표시할 카테고리가 없습니다.</p>;

    // 현재 카테고리 ID 목록 (디버깅용)
    console.log('현재 표시 중인 카테고리 ID 목록:', homeCategories.map(c => `${c.id}: ${c.name}`).join(', '));

    return (
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">카테고리</h2>
            {/* 연결 상태 아이콘 추가 */}
            <div className="flex items-center">
              <div className={`h-2 w-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">{isConnected ? '실시간 연결됨' : '연결 안됨'}</span>
              {!isConnected && (
                <button 
                  onClick={reconnect}
                  className="ml-2 text-sm text-indigo-600 hover:text-indigo-800 underline" 
                >
                  재연결
                </button>
              )}
              <button 
                onClick={() => {
                  console.log('카테고리 강제 새로고침');
                  fetchCategories();
                }}
                className="ml-4 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600" 
              >
                새로고침
              </button>
              <button 
                onClick={() => {
                  console.log('로컬 스토리지 정리');
                  clearLocalStorage();
                }}
                className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600" 
              >
                캐시 정리
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Context에서 가져온 카테고리 데이터 사용 */}
            {homeCategories.slice(0, 4).map((category) => (
              <Link 
                to={`/categories/${category.id}`} 
                key={category.id} 
                className="group"
                data-testid={`category-${category.id}`}
              >
                <div className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden border border-gray-300">
                  <img
                    src={category.image_url || category.image || '/assets/placeholder-category.jpg'}
                    alt={category.name}
                    className="w-full h-full object-center object-cover group-hover:opacity-75"
                    onError={(e) => { 
                      console.log(`이미지 로드 실패: ${category.name}`); 
                      e.target.onerror = null; 
                      e.target.src='/assets/placeholder-category.jpg'; 
                    }}
                  />
                </div>
                <h3 className="mt-4 text-base font-medium text-gray-900 text-center">
                  {category.name}
                  <span className="ml-2 text-xs text-gray-500">#{category.id}</span>
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // 신상품 섹션
  const NewProducts = () => (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">신상품</h2>
          <Link to="/products?ordering=-created_at" className="text-indigo-600 hover:text-indigo-800">
            모두 보기 &rarr;
          </Link>
        </div>
        {isLoadingProducts ? (
          <Loading />
        ) : error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : (
          <ProductList products={newProducts} />
        )}
      </div>
    </section>
  );

  // 프로모션 섹션
  const Promotion = () => (
    <section className="py-12 bg-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-indigo-600 rounded-lg shadow-xl overflow-hidden">
          <div className="pt-10 pb-12 px-6 sm:pt-16 sm:px-16 lg:py-16 lg:pr-0 xl:py-20 xl:px-20">
            <div className="lg:flex">
              <div className="lg:w-1/2">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                  <span className="block">새로운 회원가입 혜택</span>
                </h2>
                <p className="mt-4 text-lg leading-6 text-indigo-100">
                  지금 회원가입하고 3,000원 할인 쿠폰과 무료 배송 혜택을 받아보세요.
                </p>
                <Link
                  to="/register"
                  className="mt-8 bg-white border border-transparent rounded-md shadow px-5 py-3 inline-flex items-center text-base font-medium text-indigo-600 hover:bg-indigo-50"
                >
                  지금 가입하기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <main>
      <MainBanner />
      <FeaturedProducts />
      <Categories />
      <Promotion />
      <NewProducts />
    </main>
  );
};

export default Home;