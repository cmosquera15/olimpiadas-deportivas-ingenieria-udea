import axios from 'axios';
import { getToken, clearToken } from './auth';

// Compute API base URL. Prefer env, fallback to Render backend.
const apiRoot = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '')
  || 'https://olimpiadas-deportivas-ingenieria-udea.onrender.com';

const axiosInstance = axios.create({
  baseURL: `${apiRoot}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    const rawUrl = (config.url ?? '').toLowerCase();
    const method = (config.method ?? 'get').toLowerCase();

    if (import.meta.env.DEV) {
      console.log('🔍 Axios Request:', { method, url: config.url, hasToken: !!token });
    }

    const isGoogleLogin =
      rawUrl === '/auth/google-login' ||
      rawUrl.endsWith('/auth/google-login') ||
      rawUrl.includes('/auth/google-login?');

    // Detect public GET endpoints that match backend SecurityConfig permitAll patterns
    // Only these GETs are truly public and don't need authentication
    const isPublicGet = method === 'get' && (
      rawUrl.startsWith('/partidos') || rawUrl.startsWith('/api/partidos') || rawUrl.includes('/partidos?') ||
      rawUrl.startsWith('/torneos')  || rawUrl.startsWith('/api/torneos')  || rawUrl.includes('/torneos?')  ||
      rawUrl.startsWith('/fases')    || rawUrl.startsWith('/api/fases')    || rawUrl.includes('/fases?')    ||
      rawUrl.startsWith('/grupos')   || rawUrl.startsWith('/api/grupos')   || rawUrl.includes('/grupos?')   ||
      rawUrl.startsWith('/jornadas') || rawUrl.startsWith('/api/jornadas') || rawUrl.includes('/jornadas?') ||
      rawUrl.startsWith('/deportes') || rawUrl.startsWith('/api/deportes') || rawUrl.includes('/deportes?') ||
      rawUrl.startsWith('/lugares')  || rawUrl.startsWith('/api/lugares')  || rawUrl.includes('/lugares?')  ||
      rawUrl.startsWith('/programas')|| rawUrl.startsWith('/api/programas')|| rawUrl.includes('/programas?')||
      rawUrl.startsWith('/eps')      || rawUrl.startsWith('/api/eps')      || rawUrl.includes('/eps?')
    );

    if (import.meta.env.DEV) {
      console.log('🔍 Auth decision:', { isPublicGet, isGoogleLogin, willSendToken: !isPublicGet && !isGoogleLogin && !!token });
    }

    // Helper to remove Authorization for both AxiosHeaders and plain object headers (no any)
    const removeAuthHeader = () => {
      const h = config.headers as Record<string, unknown> & { set?: (k: string, v?: string) => void };
      if (h && typeof h.set === 'function') {
        h.set('Authorization', undefined);
      } else if (h) {
        delete (h as Record<string, unknown>)['Authorization'];
        delete (h as Record<string, unknown>)['authorization'];
      }
    };

    // Attach token logic:
    // 1. If it's Google login, never send auth
    // 2. If we have a token, always send it (even for public endpoints) - backend will ignore if not needed
    // 3. If no token, don't send auth header
    if (isGoogleLogin) {
      removeAuthHeader();
    } else if (token) {
      const h = config.headers as Record<string, unknown> & { set?: (k: string, v: string) => void };
      if (h && typeof h.set === 'function') {
        h.set('Authorization', `Bearer ${token}`);
      } else if (h) {
        (h as Record<string, unknown>)['Authorization'] = `Bearer ${token}`;
      }
    } else {
      // No token - remove auth header
      removeAuthHeader();
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
