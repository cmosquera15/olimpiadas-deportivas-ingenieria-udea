import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/store/useAuth';
import { toast } from 'sonner';
import { Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';
import { Usuario } from '@/types';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const LOGO_UDEA_DARK = '/UdeA+simplificado+%C2%AE-03.png';
const LOGO_UDEA_LIGHT = '/UdeA+simplificado-01.png';
const LOGO_OLIMPIADAS = '/Logo+Olimpiadas.png';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth, isAuthenticated, profileComplete  } = useAuth();

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-2xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Branding */}
          <div className="relative hidden md:flex flex-col items-center justify-center gap-4 bg-muted/30 p-6">
            {/* Logos */}
            <div className="flex items-center gap-4">
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

            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Olimpiadas Deportivas</h2>
              <p className="text-sm text-muted-foreground">Facultad de Ingeniería · UdeA</p>
            </div>
          </div>

          {/* Right: Login */}
          <div className="p-6">
            <CardHeader className="space-y-2 text-center md:text-left p-0 mb-4">
              <CardTitle className="text-2xl">Bienvenido</CardTitle>
              <CardDescription>
                Inicia sesión con tu cuenta de Google para acceder al sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-5">
                <div className="flex justify-center md:justify-start">
                  {GOOGLE_CLIENT_ID ? (
                    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        text="signin_with"
                        locale="es"
                        shape="pill"
                        theme="outline"
                      />
                    </GoogleOAuthProvider>
                  ) : (
                    <div className="text-sm text-destructive">
                      Error: No se ha configurado VITE_GOOGLE_CLIENT_ID
                    </div>
                  )}
                </div>

                <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
                  <p>
                    Al continuar autorizas el uso de tu correo institucional para la participación
                    en las Olimpiadas Deportivas de Ingeniería.
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
