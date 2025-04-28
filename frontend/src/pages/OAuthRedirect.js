import { useParams } from 'react-router-dom';

const OAuthRedirect = () => {
  const { provider } = useParams();
  // 환경변수 우선, 없으면 기본값
  const apiBase = import.meta.env.VITE_API || process.env.REACT_APP_API_URL || `http://${window.location.hostname}:8000/api`;
  window.location.href = `${apiBase}/auth/${provider}/?redirect_uri=${window.location.origin}/login/callback/${provider}`;
  return null;
};

export default OAuthRedirect; 