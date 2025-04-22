import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { getCategories } from '../api/products';

const CategoryContext = createContext();

export const useCategories = () => useContext(CategoryContext);

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 3000; // 3초

  const fetchCategories = useCallback(async () => {
    console.log('카테고리 데이터 로딩 시작...');
    setIsLoading(true);
    setError(null);
    try {
      // 캐시 방지를 위한 타임스탬프 추가
      const timestamp = new Date().getTime();
      console.log(`API 호출: /products/categories/?_t=${timestamp}`);
      const response = await getCategories({ _t: timestamp });
      console.log('API 응답 전체:', JSON.stringify(response));
      
      // 응답 형식 검증 강화
      if (!response) {
        throw new Error('API 응답이 비어있습니다');
      }
      
      if (typeof response !== 'object') {
        throw new Error(`API 응답이 객체가 아닙니다: ${typeof response}`);
      }
      
      // REST framework의 일반적인 페이지네이션 응답 형식 확인
      if (!('results' in response)) {
        // results가 없는 경우 전체 응답을 결과로 사용 (API 형식이 다른 경우)
        console.log('API 응답에 results 필드가 없습니다. 전체 응답을 사용합니다.');
        
        if (Array.isArray(response)) {
          // 응답이 배열인 경우 그대로 사용
          const activeMainCategories = response
            .filter(cat => {
              if (!cat) return false; // null 체크
              console.log(`카테고리 ${cat.id}: ${cat.name} - 활성화: ${cat.is_active}, 부모: ${cat.parent}`);
              return cat.is_active === true && !cat.parent;
            })
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          
          console.log('필터링된 카테고리:', activeMainCategories);
          setCategories(activeMainCategories);
          
          // sessionStorage에 저장
          try {
            sessionStorage.setItem('categoryData', JSON.stringify(activeMainCategories));
            sessionStorage.setItem('categoryTimestamp', timestamp.toString());
          } catch (storageErr) {
            console.warn('세션 스토리지 저장 실패:', storageErr);
          }
          return;
        } else {
          throw new Error(`예상치 못한 API 응답 형식: ${JSON.stringify(response).substring(0, 100)}...`);
        }
      }
      
      if (!Array.isArray(response.results)) {
        throw new Error(`API 응답의 results가 배열이 아닙니다: ${typeof response.results}`);
      }
      
      // 활성화된 메인 카테고리만 필터링하고, 정렬 순서로 정렬
      const activeMainCategories = response.results
        .filter(cat => {
          if (!cat) return false; // null 체크
          console.log(`카테고리 ${cat.id}: ${cat.name} - 활성화: ${cat.is_active}, 부모: ${cat.parent}`);
          return cat.is_active === true && !cat.parent;
        })
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      console.log('필터링된 카테고리:', activeMainCategories);
      
      // 빈 배열이라도 상태 업데이트 진행 (삭제된 경우 반영)
      setCategories(activeMainCategories);
      
      // sessionStorage에 최신 데이터와 타임스탬프 저장
      try {
        sessionStorage.setItem('categoryData', JSON.stringify(activeMainCategories));
        sessionStorage.setItem('categoryTimestamp', timestamp.toString());
        console.log('세션 스토리지에 카테고리 데이터 저장됨');
      } catch (storageErr) {
        console.warn('세션 스토리지 저장 실패:', storageErr);
      }
    } catch (err) {
      const errorMessage = `카테고리 로드 실패: ${err.message}`;
      setError(errorMessage);
      console.error('카테고리 로드 중 오류 발생:', err);
      
      // 오류 발생 시 세션 스토리지의 백업 데이터 사용 시도
      try {
        const cachedData = sessionStorage.getItem('categoryData');
        if (cachedData) {
          console.log('세션 스토리지에서 백업 데이터 복원');
          setCategories(JSON.parse(cachedData));
        }
      } catch (storageErr) {
        console.warn('세션 스토리지 읽기 실패:', storageErr);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // WebSocket 연결 함수
  const connectWebSocket = useCallback(() => {
    // 이미 연결되어 있으면 중복 연결 방지
    if (wsRef.current && [WebSocket.OPEN, WebSocket.CONNECTING].includes(wsRef.current.readyState)) {
      console.log('WebSocket 이미 연결됨, 중복 연결 방지');
      return;
    }

    // 현재 프로토콜에 맞게 WebSocket 프로토콜 사용 (https -> wss, http -> ws)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:8000/ws/category-updates/`;
    console.log('WebSocket 연결 시도:', wsUrl);
    
    try {
      // 이전 연결 정리
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      // 새 WebSocket 연결 생성
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('카테고리 WebSocket 연결됨');
        setIsConnected(true);
        reconnectAttempts.current = 0; // 연결 성공 시 재시도 카운터 초기화
        
        // 정기적인 Ping 메시지 전송 설정 (연결 유지 목적)
        const pingInterval = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          } else {
            clearInterval(pingInterval);
          }
        }, 30000); // 30초마다 ping
        
        // 컴포넌트가 언마운트될 때 clearInterval이 실행되도록 wsRef에 저장
        wsRef.current.pingInterval = pingInterval;
        
        // 연결 후 즉시 카테고리 데이터 새로고침
        console.log('WebSocket 연결 성공 후 카테고리 데이터 갱신 시도');
        fetchCategories();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('카테고리 WebSocket 메시지:', data);

          if (data.type === 'category_update') {
            const { action, id, name } = data.payload;
            console.log(`카테고리 변경: ${action}, ID: ${id}, 이름: ${name || '알 수 없음'}`);
            
            // 카테고리 즉시 상태 업데이트 (더 효율적인 방식)
            if (action === 'delete') {
              // 삭제된 카테고리를 즉시 제거 (API 호출 없이)
              console.log(`ID ${id} 카테고리 즉시 상태에서 제거`);
              setCategories(prevCategories => 
                prevCategories.filter(category => category.id !== id)
              );
            } else {
              // 추가/수정 시에는 전체 목록 새로고침
              console.log('카테고리 변경 감지로 데이터 갱신 중...');
              fetchCategories();
            }
          } else if (data.type === 'connection_established') {
            console.log('서버에서 연결 확인 메시지 수신:', data.message);
            // 연결 후 즉시 카테고리 데이터 새로고침
            fetchCategories();
          } else if (data.type === 'pong') {
            console.log('서버에서 pong 수신');
          } else if (data.type === 'categories_list') {
            console.log('서버에서 현재 카테고리 목록 수신:', data.categories);
            if (Array.isArray(data.categories) && data.categories.length > 0) {
              // 서버에서 받은 카테고리 목록으로 완전히 대체 (신뢰할 수 있는 소스)
              const activeMainCategories = data.categories
                .filter(cat => {
                  console.log(`서버 카테고리 ${cat.id}: ${cat.name} - 활성화: ${cat.is_active}`);
                  return cat.is_active && !cat.parent;
                })
                .sort((a, b) => (a.order || 0) - (b.order || 0));
              
              console.log('서버 데이터로 필터링된 카테고리:', activeMainCategories);
              
              // 서버에서 받은 데이터로 항상 상태 갱신
              setCategories(activeMainCategories);
              console.log('카테고리 상태 갱신 완료 - 서버 데이터 기준');
            }
          }
        } catch (e) {
          console.error("WebSocket 메시지 파싱 실패:", e);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('카테고리 WebSocket 오류:', error);
        console.log('WebSocket 상태:', wsRef.current?.readyState);
        setIsConnected(false);
      };

      wsRef.current.onclose = (event) => {
        console.log('카테고리 WebSocket 연결 종료, 코드:', event.code, '이유:', event.reason);
        setIsConnected(false);
        
        // 정기적인 ping 타이머 정리
        if (wsRef.current && wsRef.current.pingInterval) {
          clearInterval(wsRef.current.pingInterval);
        }
        
        // 비정상적인 종료인 경우 재연결 시도 (1000은 정상 종료)
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(baseReconnectDelay * Math.pow(1.5, reconnectAttempts.current), 30000);
          console.log(`${delay}ms 후 WebSocket 재연결 시도... (${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          // 이전 타임아웃 정리
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectAttempts.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket(); // 재연결 시도
          }, delay);
        }
      };
    } catch (error) {
      console.error('WebSocket 인스턴스 생성 오류:', error);
      setIsConnected(false);
    }
  }, [fetchCategories]);

  // WebSocket 연결 및 정리
  useEffect(() => {
    // 초기 연결
    connectWebSocket();
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      // 재연결 타임아웃 정리
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // 웹소켓 정리
      if (wsRef.current) {
        // 정기적인 ping 타이머 정리
        if (wsRef.current.pingInterval) {
          clearInterval(wsRef.current.pingInterval);
        }
        
        // 연결 종료
        if (wsRef.current.readyState === WebSocket.OPEN) {
          console.log('WebSocket 연결 정리 중...');
          wsRef.current.close();
        }
      }
    };
  }, [connectWebSocket]);

  // 로컬 스토리지를 정리하는 함수 추가
  const clearLocalStorage = useCallback(() => {
    try {
      console.log('캐시 정리 시작...');
      
      // 카테고리 관련 로컬 스토리지 항목 삭제
      localStorage.removeItem('categories');
      localStorage.removeItem('categoriesLastFetched');
      
      // 세션 스토리지 항목 삭제
      sessionStorage.removeItem('categoryData');
      sessionStorage.removeItem('categoryTimestamp');
      
      // 캐시된 API 응답도 제거하기 위해 캐시 스토리지 정리 시도
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            if (cacheName.includes('category') || cacheName.includes('api')) {
              caches.delete(cacheName)
                .then(() => console.log(`캐시 ${cacheName} 삭제됨`))
                .catch(err => console.warn(`캐시 ${cacheName} 삭제 실패:`, err));
            }
          });
        }).catch(err => console.warn('캐시 정리 실패:', err));
      }
      
      console.log('캐시 항목 삭제 완료');
      
      // 카테고리 데이터 다시 로드
      console.log('카테고리 데이터 새로 로드 중...');
      setCategories([]); // 먼저 상태 비우기
      fetchCategories();
    } catch (error) {
      console.error('캐시 정리 중 오류:', error);
    }
  }, [fetchCategories]);

  return (
    <CategoryContext.Provider 
      value={{ 
        categories, 
        isLoading, 
        error, 
        fetchCategories, 
        isConnected, 
        reconnect: connectWebSocket,
        clearLocalStorage
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};