import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProduct, createReview } from '../api/products';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import { toast } from 'react-toastify';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addItemToCart, isLoading: isCartLoading } = useCart();
  
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({
    title: '',
    content: '',
    rating: 5
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  // 상품 데이터 가져오기
  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getProduct(id);
        setProduct(data);
        setActiveImageIndex(0); // 이미지 인덱스 초기화
      } catch (error) {
        console.error('상품 로드 실패:', error);
        setError('상품 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);
  
  // 수량 변경 핸들러
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= product.stock) {
      setQuantity(value);
    }
  };
  
  // 수량 증가 핸들러
  const increaseQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };
  
  // 수량 감소 핸들러
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  // 장바구니에 추가 핸들러
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.warning('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    
    const success = await addItemToCart(product.id, quantity);
    if (success) {
      setQuantity(1); // 수량 초기화
    }
  };
  
  // 리뷰 폼 입력 핸들러
  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewFormData({
      ...reviewFormData,
      [name]: name === 'rating' ? parseInt(value) : value
    });
  };
  
  // 리뷰 작성 핸들러
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.warning('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    
    setIsSubmittingReview(true);
    
    try {
      await createReview(product.id, reviewFormData);
      toast.success('리뷰가 등록되었습니다.');
      
      // 리뷰 폼 초기화 및 숨기기
      setReviewFormData({
        title: '',
        content: '',
        rating: 5
      });
      setIsReviewFormOpen(false);
      
      // 상품 정보 새로고침 (리뷰 포함)
      const updatedProduct = await getProduct(id);
      setProduct(updatedProduct);
    } catch (error) {
      console.error('리뷰 작성 실패:', error);
      
      if (error.response && error.response.data) {
        if (error.response.data.detail) {
          toast.error(error.response.data.detail);
        } else {
          toast.error('리뷰 작성에 실패했습니다.');
        }
      } else {
        toast.error('서버 연결에 문제가 있습니다.');
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };
  
  // 로딩 중
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <Loading text="상품 정보를 불러오는 중입니다..." />
      </div>
    );
  }
  
  // 에러 발생 시
  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate(-1)}>이전 페이지로 돌아가기</Button>
        </div>
      </div>
    );
  }
  
  // 상품이 없는 경우
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">상품을 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-6">요청하신 상품 정보가 존재하지 않습니다.</p>
          <Link to="/products">
            <Button>상품 목록으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // 리뷰 별점 표시 컴포넌트
  const StarRating = ({ rating }) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? 'text-yellow-500' : 'text-gray-300'
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };
  
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        {/* 상품 정보 */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
          {/* 상품 이미지 */}
          <div className="lg:max-w-lg lg:self-start">
            <div className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden">
              <img
                src={product.images[activeImageIndex]?.image || '/assets/placeholder-product.jpg'}
                alt={product.name}
                className="w-full h-full object-center object-cover"
              />
            </div>
            
            {/* 이미지 썸네일 */}
            {product.images.length > 1 && (
              <div className="mt-4 grid grid-cols-6 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative rounded-md overflow-hidden ${
                      activeImageIndex === index ? 'ring-2 ring-indigo-500' : 'ring-1 ring-gray-200'
                    }`}
                  >
                    <img
                      src={image.image}
                      alt={image.alt_text || `${product.name} 이미지 ${index + 1}`}
                      className="w-full h-full object-center object-cover"
                    />
                    <span
                      className={`absolute inset-0 ${
                        activeImageIndex === index ? 'ring-2 ring-inset ring-indigo-500' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* 상품 정보 */}
          <div className="mt-10 lg:mt-0">
            {/* 카테고리 */}
            <div className="mb-4">
              <Link to={`/categories/${product.category}`} className="text-sm text-indigo-600 hover:text-indigo-500">
                {product.category_name}
              </Link>
            </div>
            
            {/* 상품명 */}
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{product.name}</h1>
            
            {/* 상품 평점 */}
            <div className="mt-3">
              <div className="flex items-center">
                <StarRating rating={product.rating_avg} />
                <span className="ml-2 text-sm text-gray-500">
                  {product.rating_avg}/5 ({product.review_count}개 리뷰)
                </span>
              </div>
            </div>
            
            {/* 상품 가격 */}
            <div className="mt-6">
              {product.is_on_sale ? (
                <div className="flex items-end">
                  <p className="text-xl line-through text-gray-400">
                    {formatCurrency(product.price)}
                  </p>
                  <p className="text-3xl text-red-600 font-bold ml-3">
                    {formatCurrency(product.current_price)}
                  </p>
                </div>
              ) : (
                <p className="text-3xl text-gray-900 font-bold">
                  {formatCurrency(product.price)}
                </p>
              )}
            </div>
            
            {/* 상품 재고 */}
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                {product.stock > 0 ? `재고: ${product.stock}개` : '품절'}
              </p>
            </div>
            
            {/* 상품 설명 */}
            <div className="mt-6">
              <h2 className="text-lg font-medium text-gray-900">상품 설명</h2>
              <div
                className="mt-3 prose prose-sm text-gray-500"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
            
            {/* 수량 선택 및 장바구니 추가 */}
            {product.stock > 0 ? (
              <div className="mt-8">
                <div className="flex items-center mb-4">
                  <span className="mr-3 text-gray-700">수량</span>
                  <div className="flex items-center">
                    <button
                      onClick={decreaseQuantity}
                      className="text-gray-500 focus:outline-none focus:text-gray-600"
                    >
                      <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M20 12H4"></path>
                      </svg>
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={product.stock}
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="mx-2 border text-center w-16 rounded-md"
                    />
                    <button
                      onClick={increaseQuantity}
                      className="text-gray-500 focus:outline-none focus:text-gray-600"
                    >
                      <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M12 4v16m8-8H4"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                
                <Button
                  onClick={handleAddToCart}
                  variant="primary"
                  size="large"
                  isLoading={isCartLoading}
                  className="w-full"
                >
                  장바구니에 담기
                </Button>
              </div>
            ) : (
              <div className="mt-8">
                <Button
                  variant="secondary"
                  size="large"
                  disabled
                  className="w-full"
                >
                  품절
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* 상품 리뷰 */}
        <div className="mt-16 pt-10 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">리뷰</h2>
          
          {/* 리뷰 작성 버튼 */}
          <div className="mt-6 flex justify-between items-center">
            <div className="flex items-center">
              <StarRating rating={product.rating_avg} />
              <span className="ml-2 text-gray-600">
                {product.review_count}개의 리뷰
              </span>
            </div>
            
            <Button
              onClick={() => {
                if (isAuthenticated) {
                  setIsReviewFormOpen(!isReviewFormOpen);
                } else {
                  toast.warning('로그인이 필요합니다.');
                  navigate('/login');
                }
              }}
              variant={isReviewFormOpen ? 'secondary' : 'primary'}
            >
              {isReviewFormOpen ? '취소' : '리뷰 작성'}
            </Button>
          </div>
          
          {/* 리뷰 작성 폼 */}
          {isReviewFormOpen && (
            <div className="mt-6 bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">리뷰 작성</h3>
              <form onSubmit={handleSubmitReview}>
                {/* 별점 선택 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">평점</label>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setReviewFormData({ ...reviewFormData, rating })}
                        className="p-1 focus:outline-none"
                      >
                        <svg
                          className={`h-8 w-8 ${
                            rating <= reviewFormData.rating ? 'text-yellow-500' : 'text-gray-300'
                          }`}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-500">
                      {reviewFormData.rating}점
                    </span>
                  </div>
                </div>
                
                {/* 리뷰 제목 */}
                <div className="mb-4">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={reviewFormData.title}
                    onChange={handleReviewChange}
                    required
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                {/* 리뷰 내용 */}
                <div className="mb-4">
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">내용</label>
                  <textarea
                    id="content"
                    name="content"
                    value={reviewFormData.content}
                    onChange={handleReviewChange}
                    required
                    rows={4}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                {/* 제출 버튼 */}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmittingReview}
                  >
                    리뷰 등록
                  </Button>
                </div>
              </form>
            </div>
          )}
          
          {/* 리뷰 목록 */}
          <div className="mt-8 space-y-8">
            {product.reviews.length === 0 ? (
              <p className="text-gray-500 text-center py-8">아직 리뷰가 없습니다. 첫 리뷰를 작성해보세요!</p>
            ) : (
              product.reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-8">
                  <div className="flex items-center mb-2">
                    <span className="font-medium text-gray-900">{review.user_name}</span>
                    <span className="ml-4 text-sm text-gray-500">{formatDate(review.created_at)}</span>
                  </div>
                  <div className="flex items-center mb-2">
                    <StarRating rating={review.rating} />
                    <span className="ml-2 text-sm text-gray-500">{review.rating}점</span>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mt-4 mb-2">{review.title}</h4>
                  <p className="text-gray-600">{review.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;