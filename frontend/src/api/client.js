import axios from 'axios';

// 기본 API 클라이언트 설정
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || `http://${window.location.hostname}:8000/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// 토큰 갱신 요청을 위한 별도 인스턴스 (무한 루프 방지)
const refreshClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || `http://${window.location.hostname}:8000/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// 토큰 갱신 함수
const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No refresh token available');
    
    const response = await refreshClient.post('/users/token/refresh/', { refresh: refreshToken });
    const { access } = response.data;
    
    localStorage.setItem('access_token', access);
    return access;
  } catch (error) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    throw error;
  }
};

// 토큰 갱신 중인지 추적
let isRefreshing = false;
// 토큰 갱신을 기다리는 요청 대기열
let refreshSubscribers = [];

// 토큰 갱신 완료 후 대기 중인 요청들 처리
const onRefreshed = (token) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

// 토큰 갱신 시 대기열에 요청 추가
const addSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

// 토큰이 있으면 요청 헤더에 추가하는 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 토큰 갱신, 에러 처리 등
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 401 에러이고, 이미 재시도를 하지 않았으며, 토큰이 있는 경우에만 시도
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 이미 다른 요청이 토큰을 갱신 중인 경우, 대기열에 추가하고 갱신 완료 대기
        try {
          const newToken = await new Promise((resolve, reject) => {
            addSubscriber(token => {
              resolve(token);
            });
          });
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }
      
      // 토큰 갱신 시작
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const newToken = await refreshAccessToken();
        
        // 갱신된 토큰으로 대기 중인 요청들 처리
        onRefreshed(newToken);
        
        // 원래 요청 다시 시도
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        isRefreshing = false;
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        
        // 로그인 페이지로 리다이렉트 - 필요하면 활성화
        // window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;