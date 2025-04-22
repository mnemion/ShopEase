import apiClient from './client';

// 회원가입 API
export const register = async (userData) => {
  const response = await apiClient.post('/users/register/', userData);
  return response.data;
};

// 로그인 API
export const login = async (credentials) => {
  const response = await apiClient.post('/users/login/', credentials);
  return response.data;
};

// 로그아웃 API
export const logout = async (refreshToken) => {
  const response = await apiClient.post('/users/logout/', { refresh: refreshToken });
  return response.data;
};

// 내 정보 조회 API
export const getProfile = async () => {
  try {
    const response = await apiClient.get('/users/users/me/');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    throw error;
  }
};

// 내 정보 수정 API
export const updateProfile = async (profileData) => {
  const response = await apiClient.put('/users/me/', profileData);
  return response.data;
};

// 배송지 목록 조회 API
export const getAddresses = async () => {
  const response = await apiClient.get('/users/addresses/');
  return response.data;
};

// 배송지 추가 API
export const addAddress = async (addressData) => {
  const response = await apiClient.post('/users/addresses/', addressData);
  return response.data;
};

// 배송지 수정 API
export const updateAddress = async (id, addressData) => {
  const response = await apiClient.put(`/users/addresses/${id}/`, addressData);
  return response.data;
};

// 배송지 삭제 API
export const deleteAddress = async (id) => {
  const response = await apiClient.delete(`/users/addresses/${id}/`);
  return response.data;
};

// --- 소셜 로그인 관련 함수 (API 기반 접근 방식으로 수정) ---

// Naver 인증 페이지 URL 생성
const getNaverAuthUrl = () => {
  const NAVER_CLIENT_ID = process.env.REACT_APP_NAVER_CLIENT_ID; 
  const REDIRECT_URI = `${window.location.origin}/login/callback/naver`; 
  const STATE = Math.random().toString(36).substring(2); // CSRF 방지용 state

  // 세션 스토리지에 state 저장 (콜백에서 검증용)
  sessionStorage.setItem('oauth_state', STATE);

  // 디버깅 로그 추가
  console.log("[getNaverAuthUrl] 생성된 Naver Client ID:", NAVER_CLIENT_ID);
  console.log("[getNaverAuthUrl] 리다이렉트 URI:", REDIRECT_URI);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: NAVER_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    state: STATE,
  });
  return `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
};

// Kakao 인증 페이지 URL 생성
const getKakaoAuthUrl = () => {
  const KAKAO_CLIENT_ID = process.env.REACT_APP_KAKAO_CLIENT_ID;
  const REDIRECT_URI = `${window.location.origin}/login/callback/kakao`;
  const STATE = Math.random().toString(36).substring(2); // CSRF 방지용 state

  // 세션 스토리지에 state 저장 (콜백에서 검증용)
  sessionStorage.setItem('oauth_state', STATE);

  // 디버깅 로그 추가
  console.log("[getKakaoAuthUrl] 생성된 Kakao Client ID:", KAKAO_CLIENT_ID);
  console.log("[getKakaoAuthUrl] 리다이렉트 URI:", REDIRECT_URI);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: KAKAO_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    state: STATE,
  });
  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
};

// Google 인증 페이지 URL 생성
const getGoogleAuthUrl = () => {
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const REDIRECT_URI = `${window.location.origin}/login/callback/google`;
  const STATE = Math.random().toString(36).substring(2); // CSRF 방지용 state

  // 세션 스토리지에 state 저장 (콜백에서 검증용)
  sessionStorage.setItem('oauth_state', STATE);

  // 디버깅 로그 추가
  console.log("[getGoogleAuthUrl] 생성된 Google Client ID:", GOOGLE_CLIENT_ID);
  console.log("[getGoogleAuthUrl] 리다이렉트 URI:", REDIRECT_URI);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'email profile',
    state: STATE,
    access_type: 'online', // 기본값으로 변경, 필요시 'offline'으로 변경
    prompt: 'consent', // 사용자 동의 화면 항상 표시
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

// 소셜 로그인을 위한 팝업 열기 (API 기반 방식)
export const openSocialLoginPopup = (provider) => {
  try {
    console.log(`[openSocialLoginPopup] ${provider} 소셜 로그인 팝업 열기 시작`);
    
    let url;
    if (provider === 'naver') {
      url = getNaverAuthUrl();
    } else if (provider === 'google') {
      url = getGoogleAuthUrl();
    } else if (provider === 'kakao') {
      url = getKakaoAuthUrl();
    } else {
      console.error(`[openSocialLoginPopup] 지원하지 않는 제공자: ${provider}`);
      alert(`지원하지 않는 로그인 제공자입니다: ${provider}`);
      return null;
    }

    if (!url) {
      console.error(`[openSocialLoginPopup] ${provider} URL 생성 실패`);
      alert(`${provider} 로그인 URL 생성에 실패했습니다. 환경 설정을 확인해주세요.`);
      return null;
    }

    console.log(`[openSocialLoginPopup] ${provider} 팝업 URL: ${url}`);

    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const popupName = `${provider}Login_${new Date().getTime()}`;

    const popup = window.open(
      url,
      popupName,
      `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      console.error('[openSocialLoginPopup] 팝업이 차단되었습니다.');
      alert('팝업이 차단되었습니다. 팝업 차단을 해제한 후 다시 시도해주세요.');
      return null;
    }
    
    console.log(`[openSocialLoginPopup] ${provider} 팝업이 성공적으로 열렸습니다.`);
    popup.focus();
    return popup;
  } catch (error) {
    console.error(`[openSocialLoginPopup] ${provider} 팝업 열기 오류:`, error);
    alert(`소셜 로그인 팝업을 여는 중 오류가 발생했습니다: ${error.message}`);
    return null;
  }
};

// 프론트엔드 콜백에서 받은 code를 백엔드로 전송하는 함수
export const sendCodeToBackend = async (provider, code) => {
  try {
    console.log(`[sendCodeToBackend] ${provider} 제공자의 인증 코드 전송 시작`);
    console.log(`[sendCodeToBackend] 인증 코드: ${code.substring(0, 10)}...`);
    
    const apiEndpoint = `/auth/${provider}/`;
    console.log(`[sendCodeToBackend] 호출할 백엔드 API 엔드포인트: ${apiEndpoint}`);
    
    // 백엔드의 dj-rest-auth 엔드포인트 호출
    const response = await apiClient.post(apiEndpoint, { code });
    
    console.log(`[sendCodeToBackend] 백엔드 응답 상태: ${response.status}`);
    console.log(`[sendCodeToBackend] 백엔드 응답 데이터:`, {
      access: response.data.access ? '존재함' : '없음',
      refresh: response.data.refresh ? '존재함' : '없음',
      user: response.data.user ? JSON.stringify(response.data.user).substring(0, 100) + '...' : '없음'
    });
    
    return response.data; // { access, refresh, user } 객체 반환 예상
  } catch (error) {
    console.error(`[sendCodeToBackend] ${provider} 제공자의 인증 코드 처리 실패:`, error);
    
    if (error.response) {
      console.error(`[sendCodeToBackend] 백엔드 응답 상태 코드: ${error.response.status}`);
      console.error(`[sendCodeToBackend] 백엔드 오류 세부 정보:`, error.response.data);
      
      // 일반적인 오류 메시지 대신 서버에서 반환한 오류 메시지가 있으면 사용
      if (error.response.data && error.response.data.detail) {
        throw new Error(`백엔드 오류: ${error.response.data.detail}`);
      }
    } else if (error.request) {
      console.error(`[sendCodeToBackend] 백엔드 응답 없음:`, error.request);
      throw new Error('백엔드 서버가 응답하지 않습니다. 서버가 실행 중인지 확인하세요.');
    }
    
    throw error;
  }
};