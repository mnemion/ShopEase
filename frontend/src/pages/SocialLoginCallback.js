import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendCodeToBackend } from '../api/auth';
import Loading from '../components/ui/Loading';
import { toast } from 'react-toastify';

/**
 * 소셜 로그인 콜백 처리 컴포넌트
 * URL 파라미터로 전달된 토큰을 처리 (팝업 방식이 실패할 경우 대체 방안)
 */
const SocialLoginCallback = () => {
  const { provider } = useParams(); // 라우트에서 provider 추출 (예: /login/callback/:provider)
  const location = useLocation();
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      console.log(`[SocialLoginCallback] 콜백 처리 시작 - 제공자: ${provider || '알 수 없음'}`);
      console.log(`[SocialLoginCallback] 현재 URL: ${window.location.href}`);
      console.log(`[SocialLoginCallback] 쿼리 문자열: ${location.search}`);
      
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      console.log(`[SocialLoginCallback] 수신된 파라미터:`, {
        code: code ? `${code.substring(0, 10)}...` : '없음',
        state: state || '없음',
        error: errorParam || '없음',
        errorDescription: errorDescription || '없음'
      });

      // 에러 파라미터 확인 (사용자가 거부 등)
      if (errorParam) {
        console.error(`[SocialLoginCallback] 소셜 로그인 오류: ${errorParam} - ${errorDescription}`);
        setError(`로그인 중 오류 발생: ${errorDescription || errorParam}`);
        toast.error(`로그인 중 오류 발생: ${errorDescription || errorParam}`);
        setIsLoading(false);
        return;
      }

      // code 파라미터 확인
      if (!code) {
        console.error('[SocialLoginCallback] 인증 코드가 URL에 없음');
        setError('로그인 인증 코드를 받지 못했습니다.');
        toast.error('로그인 인증 코드를 받지 못했습니다.');
        setIsLoading(false);
        return;
      }

      // state 파라미터 검증 (CSRF 방지)
      const storedState = sessionStorage.getItem('oauth_state');
      console.log(`[SocialLoginCallback] State 검증: 받은 state=${state}, 저장된 state=${storedState}`);
      
      if (!state || state !== storedState) {
        console.error('[SocialLoginCallback] 유효하지 않은 state 파라미터');
        sessionStorage.removeItem('oauth_state'); // 사용된 state 제거
        setError('로그인 요청이 유효하지 않습니다 (state 불일치).');
        toast.error('로그인 요청이 유효하지 않습니다.');
        setIsLoading(false);
        return;
      }
      sessionStorage.removeItem('oauth_state'); // 사용된 state 제거

      // 백엔드로 code 전송
      try {
        console.log(`[SocialLoginCallback] 백엔드로 code 전송 시작`);
        // sendCodeToBackend 함수는 { access, refresh, user } 를 반환하도록 수정됨
        const { access, refresh, user } = await sendCodeToBackend(provider, code);
        console.log(`[SocialLoginCallback] 백엔드 응답 성공:`, {
          accessToken: access ? '존재함' : '없음',
          refreshToken: refresh ? '존재함' : '없음',
          user: user ? user.email : '없음'
        });

        if (access && refresh && user) {
          // 로그인 처리 (useAuth 훅 사용)
          console.log(`[SocialLoginCallback] 로그인 처리 시작`);
          authLogin(access, refresh, user);
          toast.success(`${user.name || user.email || '사용자'}님, 환영합니다!`);
          console.log(`[SocialLoginCallback] 홈으로 이동`);
          navigate('/', { replace: true }); // 성공 시 홈으로 이동
        } else {
          throw new Error('백엔드로부터 유효한 토큰 또는 사용자 정보를 받지 못했습니다.');
        }
      } catch (err) {
        console.error(`[SocialLoginCallback] 소셜 로그인 처리 실패:`, err);
        if (err.response) {
          console.error('[SocialLoginCallback] 백엔드 응답 오류:', err.response.data);
          console.error('[SocialLoginCallback] 상태 코드:', err.response.status);
        }
        setError('로그인 처리 중 오류가 발생했습니다.');
        toast.error('로그인 처리 중 오류가 발생했습니다.');
      } finally {
         setIsLoading(false);
      }
    };

    handleCallback();
  }, [provider, location.search, navigate, authLogin]);

  if (isLoading) {
    return <Loading text="로그인 처리 중..." fullScreen />;
  }

  if (error) {
     return (
       <div className="flex flex-col items-center justify-center h-screen">
         <p className="text-red-600 mb-4">{error}</p>
         <button onClick={() => navigate('/login')} className="text-indigo-600 hover:underline">
           로그인 페이지로 돌아가기
         </button>
       </div>
     );
  }

  // 일반적으로 로딩 후에는 리다이렉트되므로 이 부분은 보이지 않음
  return null;
};

export default SocialLoginCallback;