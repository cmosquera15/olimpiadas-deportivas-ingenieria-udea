import React from 'react';
import { getAuthorities, getUserRole, getToken } from '@/lib/auth';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, LogOut, Moon, Sun, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/store/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { SportsBackground } from '@/components/decor/SportsBackground';

interface AppLayoutProps {
  children: JSX.Element | JSX.Element[];
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const reglamentoUrl = import.meta.env.VITE_REGLAMENTO_URL as string | undefined;
  const [isDark, setIsDark] = React.useState<boolean>(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  React.useEffect(() => {
    // Ensure html class matches state
    const html = document.documentElement;
    if (isDark) html.classList.add('dark');
    else html.classList.remove('dark');
  }, [isDark]);

  React.useEffect(() => {
    if (import.meta.env.DEV && user) {
      console.log('🔍 User data in AppLayout:', {
        nombre: user.nombre,
        correo: user.correo,
        fotoUrl: user.fotoUrl,
        hasFoto: !!user.fotoUrl,
      });

      const token = getToken();
      const authorities = getAuthorities();
      console.log('🔍 Auth summary:', {
        tokenPresent: !!token,
        authoritiesCount: authorities.length,
        role: getUserRole(),
      });
    }
  }, [user]);

  const handleLogout = () => {
    clearAuth();
    navigate('/auth/login');
  };

  const getInitials = (nameOrEmail?: string | null) => {
    const base = nameOrEmail?.trim();
    if (!base) return 'U';
    if (base.includes(' ')) {
      return base
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return base.slice(0, 2).toUpperCase();
  };

  const displayName = user?.nombre ?? user?.correo ?? 'Usuario';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b bg-background">
            <div className="flex h-16 items-center gap-4 px-4 md:px-6">
              {/* Desktop Sidebar Trigger */}
              <div className="hidden md:block">
                <SidebarTrigger />
              </div>

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0">
                  <AppSidebar />
                </SheetContent>
              </Sheet>

              {/* Logo swaps based on theme */}
              <Link to="/dashboard" className="flex items-center gap-2">
                {(() => {
                  const LOGO_LIGHT = '/UdeA+simplificado-01.png';
                  const LOGO_DARK = '/UdeA+simplificado-03.png';
                  const src = isDark ? LOGO_DARK : LOGO_LIGHT;
                  return (
                    <img
                      src={src}
                      alt="Logo Olimpiadas"
                      className="h-8 w-auto"
                      onError={(e) => {
                        // Fallback gracefully if dark asset fails (e.g., due to encoding on prod)
                        const target = e.currentTarget as HTMLImageElement;
                        if (target.src.endsWith(LOGO_DARK)) target.src = LOGO_LIGHT;
                      }}
                    />
                  );
                })()}
                <span className="hidden font-semibold sm:inline-block">Olimpiadas Ingeniería</span>
              </Link>

              {/* Reglamento link (if configured) */}
              {reglamentoUrl && (
                <a
                  href={reglamentoUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  <FileText className="h-4 w-4" />
                  Reglamento
                </a>
              )}

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle theme"
                onClick={() => {
                  setIsDark((prev) => {
                    const next = !prev;
                    localStorage.setItem('theme', next ? 'dark' : 'light');
                    return next;
                  });
                }}
              >
                {isDark ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>

              <div className="flex-1" />

              {/* User Menu */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9 ring-2 ring-primary ring-offset-2 ring-offset-background">
                        <AvatarImage 
                          src={user.fotoUrl || undefined} 
                          alt={displayName || 'User'}
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          onLoad={() => import.meta.env.DEV && console.log('✅ Avatar image loaded successfully')}
                          onError={(e) => import.meta.env.DEV && console.error('❌ Avatar image failed to load:', e)}
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{displayName}</p>
                        {user.correo && (
                          <p className="text-xs leading-none text-muted-foreground">{user.correo}</p>
                        )}
                        {user.rol && (
                          <p className="text-xs leading-none text-muted-foreground">{user.rol}</p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/perfil')}>
                      <User className="mr-2 h-4 w-4" />
                      Mi Perfil
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </header>

          {/* Main Content */}
          {/* Decorative background behind content */}
          <SportsBackground />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};
