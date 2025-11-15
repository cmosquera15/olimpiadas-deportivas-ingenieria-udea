import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/store/useAuth';
import { toast } from 'sonner';
import { Trophy, Moon, Sun } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';
import { Usuario } from '@/types';
import { Button } from '@/components/ui/button';
import * as React from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const LOGO_UDEA_DARK = '/UdeA+simplificado-03.png';
const LOGO_UDEA_LIGHT = '/UdeA+simplificado-01.png';
const LOGO_OLIMPIADAS = '/Logo+Olimpiadas.png';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth, isAuthenticated, profileComplete  } = useAuth();

  // Theme state (same behavior as AppLayout)
  const [isDark, setIsDark] = React.useState<boolean>(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  React.useEffect(() => {
    const html = document.documentElement;
    if (isDark) html.classList.add('dark');
    else html.classList.remove('dark');
  }, [isDark]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(profileComplete ? '/dashboard' : '/auth/completar-perfil');
    }
  }, [isAuthenticated, profileComplete, navigate]);

  const loginMutation = useMutation({
    mutationFn: authService.googleLogin,
    onSuccess: (data) => {
      const userLike: Partial<Usuario> = {
        nombre: data.nombre ?? null,
        correo: data.correo ?? null,
        fotoUrl: data.fotoUrl ?? null,
      };

      setAuth(data.token, userLike, data.completo);

      if (!data.completo) {
        navigate('/auth/completar-perfil');
      } else {
        toast.success('Inicio de sesión exitoso');
        navigate('/dashboard');
      }
    },

    onError: (error: unknown) => {
      let description = 'Error al iniciar sesión';
      if (axios.isAxiosError(error)) {
        description = (error.response?.data as { message?: string })?.message || error.message || description;
      } else if (error instanceof Error) {
        description = error.message || description;
      }
      toast.error(description);
    },
  });

  const handleGoogleSuccess = (credentialResponse: CredentialResponse | null) => {
    const credential = credentialResponse?.credential;
    if (credential) {
      loginMutation.mutate(credential);
    }
  };

  const handleGoogleError = () => {
    toast.error('Error al autenticar con Google');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[-20%] top-[-20%] h-[60%] w-[60%] animate-gradient-spin rounded-full bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 blur-3xl" />
        <div className="absolute right-[-20%] bottom-[-20%] h-[50%] w-[50%] animate-gradient-spin rounded-full bg-gradient-to-l from-accent/20 via-contrast/20 to-primary/20 blur-3xl" style={{ animationDelay: '-7.5s' }} />
      </div>

      {/* Floating sports emojis */}
      <div className="pointer-events-none absolute inset-0 -z-5 select-none opacity-20">
        <div className="absolute left-[5%] top-[10%] animate-float-slow text-5xl">⚽</div>
        <div className="absolute right-[8%] top-[15%] animate-float-slower text-4xl">🏀</div>
        <div className="absolute left-[10%] bottom-[20%] animate-float-slow text-6xl">🏐</div>
        <div className="absolute right-[15%] bottom-[25%] animate-float-slower text-5xl">🏆</div>
        <div className="absolute left-[45%] top-[8%] animate-float-slow text-4xl">🥇</div>
      </div>

      {/* Theme Toggle */}
      <div className="absolute right-4 top-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Cambiar tema"
          className="backdrop-blur-sm"
          onClick={() => {
            setIsDark((prev) => {
              const next = !prev;
              localStorage.setItem('theme', next ? 'dark' : 'light');
              return next;
            });
          }}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      <Card className="w-full max-w-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Branding */}
          <div className="relative hidden md:flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-primary/5 via-muted/30 to-secondary/5 p-8">
            {/* Decorative gradient orb */}
            <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 animate-pulse-slow rounded-full bg-primary/10 blur-3xl" />
            
            {/* Logos */}
            <div className="relative z-10 flex items-center gap-4">
              {/* UdeA logo swaps with theme via CSS "dark" class */}
              <img
                src={LOGO_UDEA_LIGHT}
                className="h-12 w-auto dark:hidden"
                alt="Universidad de Antioquia"
              />
              <img
                src={LOGO_UDEA_DARK}
                className="hidden h-12 w-auto dark:block"
                alt="Universidad de Antioquia (modo oscuro)"
                onError={(e) => {
                  // Graceful fallback if encoded path fails in some CDNs
                  const t = e.currentTarget as HTMLImageElement;
                  t.src = LOGO_UDEA_LIGHT;
                  t.classList.add('dark:hidden');
                }}
              />
              <img src={LOGO_OLIMPIADAS} className="h-12 w-auto" alt="Olimpiadas de Ingeniería" />
            </div>

            <div className="relative z-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Olimpiadas Deportivas</h2>
              <p className="mt-2 text-sm text-muted-foreground">Facultad de Ingeniería · UdeA</p>
              <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                <p className="flex items-center justify-center gap-1">🏆 Competencias Universitarias</p>
                <p className="flex items-center justify-center gap-1">📊 Gestión en Tiempo Real</p>
                <p className="flex items-center justify-center gap-1">👥 Colaboración en Equipo</p>
              </div>
            </div>
          </div>

          {/* Right: Login */}
          <div className="p-8">
            <CardHeader className="space-y-3 text-center md:text-left p-0 mb-6">
              <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ¡Bienvenido!
              </CardTitle>
              <CardDescription className="text-base">
                Inicia sesión con tu cuenta de Google para acceder al sistema de gestión deportiva
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-6">
                <div className="rounded-lg border bg-muted/30 p-6">
                  <p className="mb-4 text-center text-sm font-medium text-muted-foreground">
                    Inicia sesión de forma segura
                  </p>
                  <div className="flex justify-center">
                    {GOOGLE_CLIENT_ID ? (
                      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={handleGoogleError}
                          text="signin_with"
                          locale="es"
                          shape="pill"
                          theme="outline"
                          size="large"
                        />
                      </GoogleOAuthProvider>
                    ) : (
                      <div className="text-sm text-destructive">
                        Error: No se ha configurado VITE_GOOGLE_CLIENT_ID
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <span className="text-base">🔒</span>
                    <span>
                      Al continuar, autorizas el uso de tu correo institucional para la participación
                      en las Olimpiadas Deportivas de Ingeniería. Tus datos están protegidos.
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    </div>
  );
}
