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
    return { access };
  };

  // 토큰 저장하기
  const setTokens = (access) => {
    localStorage.setItem('access_token', access);
  };

  // 토큰 제거하기
  const removeTokens = () => {
    localStorage.removeItem('access_token');
  };

  // 액세스 토큰 갱신 함수
  const refreshAccessToken = async () => {
    try {
      // refresh token은 쿠키에서 자동 전송됨
      const response = await apiClient.post('/users/token/refresh/');
      const { access } = response.data;
      localStorage.setItem('access_token', access);
      return access;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logout();
      throw error;
    }
  };

  // 로그인 처리
  const login = (access, _refresh, userData) => {
    setTokens(access);
    setUser(userData);
    setIsAuthenticated(true);
    setError(null);
  };

  // 로그아웃 처리
  const logout = () => {
    removeTokens();
    setUser(null);
    setIsAuthenticated(false);
    sessionStorage.clear();
    localStorage.removeItem('access_token');
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
      const { access } = getTokens();
      try {
        if (access) {
          // access 토큰이 있으면 바로 프로필 조회
          const userData = await getProfile();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // access 토큰이 없으면 refresh 토큰(쿠키)로 재발급 시도
          await refreshAccessToken();
          const userData = await getProfile();
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('인증 확인 실패:', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await apiClient.post('/users/token/refresh/');
      } catch (e) {
        logout();
      }
    }, 14 * 60 * 1000);
    return () => clearInterval(interval);
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