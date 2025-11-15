import { AppLayout } from '@/components/Layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, Users, BarChart3, Medal, Sparkles } from 'lucide-react';
import { getUserRole } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/store/useAuth';
import { usuariosService } from '@/services/usuarios.service';

export default function Dashboard() {
  const role = getUserRole() ?? 'JUGADOR';
  const { user } = useAuth();
  const userId = user?.id;
  const { data: perfil } = useQuery({
    queryKey: ['usuario-detalle', userId],
    queryFn: () => usuariosService.getUsuarioCompleto(userId as number),
    enabled: !!userId,
  });

  const quickLinks = [
    {
      title: 'Olimpiadas',
      description: 'Crear y administrar olimpiadas',
      icon: Trophy,
      href: '/olimpiadas',
      color: 'text-primary',
    },
    {
      title: 'Torneos',
      description: 'Ver y gestionar torneos deportivos',
      icon: Medal,
      href: '/torneos',
      color: 'text-primary',
    },
    {
      title: 'Partidos',
      description: 'Programar y consultar partidos',
      icon: Calendar,
      href: '/partidos',
      color: 'text-secondary',
    },
    {
      title: 'Equipos',
      description: 'Administrar equipos y plantillas',
      icon: Users,
      href: '/equipos',
      color: 'text-contrast',
    },
    {
      title: 'Posiciones',
      description: 'Tabla de posiciones y estadísticas',
      icon: BarChart3,
      href: '/posiciones',
      color: 'text-accent',
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Hero section with gradient headline and subtle accent */}
        <div className="relative overflow-hidden rounded-xl border bg-card p-6 md:p-8">
          <div className="absolute right-[-10%] top-[-30%] h-64 w-64 rounded-full bg-primary/15 blur-2xl" />
          <div className="absolute left-[-8%] bottom-[-20%] h-56 w-56 rounded-full bg-secondary/15 blur-2xl" />

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="bg-gradient-to-r from-primary via-contrast to-secondary bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl md:text-4xl lg:text-5xl">
                ¡Bienvenido a las Olimpiadas de Ingeniería!
              </h1>
              <p className="mt-2 max-w-prose text-xs text-muted-foreground sm:text-sm md:text-base">
                Gestiona torneos, programa partidos, administra equipos y consulta posiciones en tiempo real.
              </p>
            </div>
            <Sparkles className="h-8 w-8 text-accent" />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/olimpiadas">
              <Button variant="default" size="sm" className="sm:h-10 sm:px-4">Crear/Ver Olimpiadas</Button>
            </Link>
            <Link to="/equipos">
              <Button variant="default" size="sm" className="sm:h-10 sm:px-4">Gestionar Equipos</Button>
            </Link>
            <Link to="/partidos">
              <Button variant="outline" size="sm" className="sm:h-10 sm:px-4">Programar Partidos</Button>
            </Link>
          </div>
        </div>

        <h2 className="sr-only">Accesos rápidos</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((link, index) => (
            <Link key={link.href} to={link.href} className="group">
              <Card className="relative h-full transition-all duration-300 hover:shadow-xl hover:border-primary/50 hover:-translate-y-1 overflow-hidden">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Decorative number badge */}
                <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary/50 group-hover:scale-110 transition-transform">
                  {index + 1}
                </div>
                
                <CardHeader className="relative z-10">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 ring-2 ring-primary/10 ring-offset-2 ring-offset-background group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <link.icon className={`h-7 w-7 ${link.color}`} />
                  </div>
                  <div className="text-lg font-bold group-hover:text-primary transition-colors">{link.title}</div>
                  <CardDescription className="text-sm">{link.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="relative overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent" />
          
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Información del Sistema</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 relative z-10">
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
              <Badge variant="outline" className="font-semibold">{role}</Badge>
              <span className="text-sm text-muted-foreground">Tu rol actual</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {perfil?.rolDescripcion || 'Este sistema permite gestionar torneos deportivos, programar partidos, administrar equipos y consultar posiciones en tiempo real.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
