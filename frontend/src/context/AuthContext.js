import React, { createContext, useState, useContext, useEffect } from 'react';
import { getProfile } from '../api/auth';
import apiClient from '../api/client';

// 인증 컨텍스트 생성
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 로컬 스토리지에서 토큰 가져오기
  const getTokens = () => {
    const access = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');
    return { access, refresh };
  };

  // 토큰 저장하기
  const setTokens = (access, refresh) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  };

  // 토큰 제거하기
  const removeTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  // 액세스 토큰 갱신 함수
  const refreshAccessToken = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) throw new Error('No refresh token available');
      
      const response = await apiClient.post('/users/token/refresh/', { refresh });
      const { access } = response.data;
      
      // 새 액세스 토큰 저장
      localStorage.setItem('access_token', access);
      return access;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // 토큰 갱신 실패시 로그아웃 처리
      logout();
      throw error;
    }
  };

  // 로그인 처리
  const login = (access, refresh, userData) => {
    setTokens(access, refresh);
    setUser(userData);
    setIsAuthenticated(true);
    setError(null);
  };

  // 로그아웃 처리
  const logout = () => {
    removeTokens();
    setUser(null);
    setIsAuthenticated(false);
    // 세션/로컬스토리지 추가 정리
    sessionStorage.clear();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // 모든 쿠키 삭제 (간단 버전)
    document.cookie.split(';').forEach(function(c) {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
  };

  // 사용자 정보 갱신
  const updateUserInfo = (userData) => {
    setUser(userData);
  };

  // 로그인 상태 확인 (앱 초기화 시 호출)
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const { access, refresh } = getTokens();
      
      if (!access || !refresh) {
        setIsLoading(false);
        return;
      }
      
      try {
        // 먼저 현재 액세스 토큰으로 사용자 정보 요청 시도
        try {
          const userData = await getProfile();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (profileError) {
          // 액세스 토큰이 만료된 경우 갱신 시도
          if (profileError.response && (profileError.response.status === 401 || profileError.response.status === 403)) {
            await refreshAccessToken();
            
            // 갱신된 토큰으로 다시 사용자 정보 요청
            const userData = await getProfile();
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            throw profileError;
          }
        }
      } catch (err) {
        console.error('인증 확인 실패:', err);
        logout(); // 모든 오류 시 로그아웃
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 컨텍스트에 제공할 값
  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    updateUserInfo,
    setError,
    refreshAccessToken, // 필요할 때 토큰 갱신을 위해 노출
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 인증 컨텍스트 사용을 위한 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.');
  }
  return context;
};