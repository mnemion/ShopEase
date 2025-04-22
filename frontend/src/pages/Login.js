import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login, openSocialLoginPopup } from '../api/auth';
import { validateEmail, validateRequired } from '../utils/validators';
import Button from '../components/ui/Button';

// 소셜 로그인 아이콘 경로 (public 폴더의 파일은 import하지 않고 URL로 직접 참조)
const googleLogoPath = '/assets/google-logo.svg';
const kakaoLogoPath = '/assets/kakao-logo.svg';
const naverLogoPath = '/assets/naver-logo.svg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const { isAuthenticated, login: authLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 리다이렉트 경로 설정 (이전 페이지 또는 기본값)
  const from = location.state?.from?.pathname || '/';
  
  // 이미 로그인되어 있으면 홈으로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);
  
  // 입력 변경 핸들러
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    // 에러 메시지 초기화
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: '' }));
    }
  };
  
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    // 에러 메시지 초기화
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: '' }));
    }
  };
  
  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = {};
    
    // 이메일 검사
    if (!validateRequired(email)) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!validateEmail(email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }
    
    // 비밀번호 검사
    if (!validateRequired(password)) {
      newErrors.password = '비밀번호를 입력해주세요.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 폼 유효성 검사
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setLoginError('');
    
    try {
      // 로그인 API 호출
      const response = await login({ email, password });
      const { access, refresh, user } = response;
      
      // Context에 로그인 상태 저장
      authLogin(access, refresh, user);
      
      // 리다이렉트
      navigate(from, { replace: true });
    } catch (error) {
      console.error('로그인 실패:', error);
      
      // 에러 메시지 표시
      if (error.response && error.response.data) {
        const data = error.response.data;
        if (data.detail) {
          setLoginError(data.detail);
        } else if (data.non_field_errors) {
          setLoginError(data.non_field_errors[0]);
        } else {
          setLoginError('로그인에 실패했습니다. 다시 시도해주세요.');
        }
      } else {
        setLoginError('서버 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // 소셜 로그인 핸들러 (수정됨 - 팝업 방식으로 처리)
  const handleSocialLogin = (provider) => {
    // 팝업 방식으로 소셜 로그인 시작 (auth.js의 함수 사용)
    console.log(`[Login] Initiating social login for: ${provider}`);
    const popup = openSocialLoginPopup(provider);
    // 팝업 닫힘 감지 후 처리 (선택)
    if (popup) {
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          // 팝업 자체에서 reload 처리했으므로 별도 로직 필요 없지만
          // 추가 후처리가 필요하다면 여기에 작성
        }
      }, 500);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          로그인
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          또는{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            회원가입하기
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* 로그인 에러 메시지 */}
          {loginError && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{loginError}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* 이메일 입력 필드 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일 주소
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            {/* 비밀번호 입력 필드 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            {/* 로그인 버튼 */}
            <div>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isLoading}
              >
                로그인
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  또는 다른 방법으로 계속하기
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              {/* Google Login Button */}
              <div>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <img src={googleLogoPath} alt="Google logo" className="h-5 w-5 mr-2" />
                  구글 로그인
                </button>
              </div>
              
              {/* Kakao Login Button */}
              <div>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('kakao')}
                  className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium hover:opacity-90"
                  style={{ backgroundColor: '#FEE500', color: '#000000' }} // 카카오 스타일
                >
                  <img src={kakaoLogoPath} alt="Kakao logo" className="h-5 w-5 mr-2" />
                  카카오 로그인
                </button>
              </div>
              
              {/* Naver Login Button */}
              <div>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('naver')}
                  className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium hover:opacity-90"
                  style={{ backgroundColor: '#03C75A', color: 'white' }} // 네이버 스타일
                >
                  <img src={naverLogoPath} alt="Naver logo" className="h-5 w-5 mr-2" />
                  네이버 로그인
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;