import { create } from 'zustand';
import { AuthDTO, Usuario } from '@/types';
import { getToken, clearToken, setToken as saveToken, parseJWT, isTokenExpired } from '@/lib/auth';
import { authService } from '@/services/auth.service';

interface AuthState {
  user: Partial<Usuario> | null;
  token: string | null;
  isAuthenticated: boolean;
  profileComplete: boolean;
  authReady: boolean;
  setAuth: (token: string | null, user: Partial<Usuario> | null, profileComplete?: boolean) => void;
  clearAuth: () => void;
  initAuth: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  profileComplete: false,
  authReady: false,

  setAuth: (token, user, profileComplete) => {
    if (token) saveToken(token);
    try {
      if (user) localStorage.setItem('auth_user', JSON.stringify(user));
      if (typeof profileComplete === 'boolean') {
        localStorage.setItem('auth_profile_complete', JSON.stringify(profileComplete));
      }
    } catch {}
    set({
      user: user ?? null,
      token: token ?? null,
      isAuthenticated: !!token,
      profileComplete: profileComplete ?? get().profileComplete,
      authReady: true,
    });
  },

  clearAuth: () => {
    clearToken();
    try {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_profile_complete');
    } catch {}
    set({ user: null, token: null, isAuthenticated: false, profileComplete: false, authReady: true });
  },

  initAuth: () => {
    const token = getToken();
    if (!token) {
      set({ authReady: true });
      return;
    }

    const payload = parseJWT<{ exp?: number }>(token);
    const exp = payload?.exp;
    if (!exp || Date.now() >= exp * 1000) {
      clearToken();
      set({ authReady: true });
      return;
    }

    // Carga rápida desde caché para reducir la latencia percibida
    let cachedUser: Partial<Usuario> | null = null;
    let cachedComplete: boolean | undefined = undefined;
    try {
      const u = localStorage.getItem('auth_user');
      const pc = localStorage.getItem('auth_profile_complete');
      cachedUser = u ? (JSON.parse(u) as Partial<Usuario>) : null;
      cachedComplete = pc ? (JSON.parse(pc) as boolean) : undefined;
    } catch {}

    set({
      token,
      isAuthenticated: true,
      user: cachedUser,
      profileComplete: cachedComplete ?? false,
      authReady: true,
    });

    // Actualiza en background para garantizar frescura
    authService
      .getMe()
      .then((me: AuthDTO) => {
        try {
          localStorage.setItem('auth_user', JSON.stringify({
            id: me.id ?? undefined,
            nombre: me.nombre ?? null,
            correo: me.correo ?? null,
            fotoUrl: me.fotoUrl ?? null,
          }));
          localStorage.setItem('auth_profile_complete', JSON.stringify(!!me.completo));
        } catch {}

        set({
          user: {
            id: me.id ?? undefined,
            nombre: me.nombre ?? null,
            correo: me.correo ?? null,
            fotoUrl: me.fotoUrl ?? null,
          },
          profileComplete: !!me.completo,
        });
      })
      .catch(() => {
        // mantener estado rápido ya establecido
      });
  },
}));
