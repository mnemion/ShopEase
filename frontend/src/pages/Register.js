import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register } from '../api/auth';
import { validateEmail, validatePassword, validateRequired, validatePhone } from '../utils/validators';
import Button from '../components/ui/Button';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: '',
    name: '',
    phone: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  
  const { isAuthenticated, login: authLogin } = useAuth();
  const navigate = useNavigate();
  
  // 이미 로그인되어 있으면 홈으로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  // 입력 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // 에러 메시지 초기화
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };
  
  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = {};
    const { email, password, password2, name, phone } = formData;
    
    // 이메일 검사
    if (!validateRequired(email)) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!validateEmail(email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }
    
    // 비밀번호 검사
    if (!validateRequired(password)) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (!validatePassword(password)) {
      newErrors.password = '비밀번호는 최소 8자 이상이며, 문자와 숫자를 포함해야 합니다.';
    }
    
    // 비밀번호 확인 검사
    if (!validateRequired(password2)) {
      newErrors.password2 = '비밀번호 확인을 입력해주세요.';
    } else if (password !== password2) {
      newErrors.password2 = '비밀번호가 일치하지 않습니다.';
    }
    
    // 이름 검사
    if (!validateRequired(name)) {
      newErrors.name = '이름을 입력해주세요.';
    }
    
    // 전화번호 검사 (선택 사항이므로 입력된 경우에만 검사)
    if (phone && !validatePhone(phone)) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다.';
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
    setRegisterError('');
    
    try {
      // 회원가입 API 호출
      const response = await register(formData);
      const { access, refresh, user } = response;
      
      // Context에 로그인 상태 저장
      authLogin(access, refresh, user);
      
      // 홈으로 리다이렉트
      navigate('/');
    } catch (error) {
      console.error('회원가입 실패:', error);
      
      // 에러 메시지 표시
      if (error.response && error.response.data) {
        const data = error.response.data;
        
        // 필드별 에러 처리
        const fieldErrors = {};
        
        // 필드 에러 확인
        if (data.email) fieldErrors.email = data.email[0];
        if (data.password) fieldErrors.password = data.password[0];
        if (data.password2) fieldErrors.password2 = data.password2[0];
        if (data.name) fieldErrors.name = data.name[0];
        if (data.phone) fieldErrors.phone = data.phone[0];
        
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
        } else if (data.non_field_errors) {
          // 필드와 무관한 에러
          setRegisterError(data.non_field_errors[0]);
        } else {
          setRegisterError('회원가입에 실패했습니다. 다시 시도해주세요.');
        }
      } else {
        setRegisterError('서버 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          회원가입
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            로그인하기
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* 회원가입 에러 메시지 */}
          {registerError && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000-16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{registerError}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* 이메일 입력 필드 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일 주소 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
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
                비밀번호 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                비밀번호는 최소 8자 이상이며, 문자와 숫자를 포함해야 합니다.
              </p>
            </div>

            {/* 비밀번호 확인 입력 필드 */}
            <div>
              <label htmlFor="password2" className="block text-sm font-medium text-gray-700">
                비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="password2"
                  name="password2"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password2}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.password2 ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                />
                {errors.password2 && (
                  <p className="mt-2 text-sm text-red-600">{errors.password2}</p>
                )}
              </div>
            </div>

            {/* 이름 입력 필드 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                이름 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
            </div>

            {/* 전화번호 입력 필드 */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                전화번호
              </label>
              <div className="mt-1">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  placeholder="01012345678"
                />
                {errors.phone && (
                  <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                - 없이 숫자만 입력해주세요.
              </p>
            </div>

            {/* 회원가입 버튼 */}
            <div>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isLoading}
              >
                회원가입
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;