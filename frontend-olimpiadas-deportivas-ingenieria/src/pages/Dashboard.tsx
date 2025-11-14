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
              <Button variant="secondary" size="sm" className="sm:h-10 sm:px-4">Gestionar Equipos</Button>
            </Link>
            <Link to="/partidos">
              <Button variant="outline" size="sm" className="sm:h-10 sm:px-4">Programar Partidos</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((link) => (
            <Link key={link.href} to={link.href}>
              <Card className="transition-all hover:shadow-lg hover:border-primary/40">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <link.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${link.color}`} />
                  </div>
                  <CardTitle className="text-base sm:text-lg">{link.title}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{link.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Rol:</strong> {role}
            </p>
            <p className="text-sm text-muted-foreground">
              {perfil?.rolDescripcion || 'Este sistema permite gestionar torneos deportivos, programar partidos, administrar equipos y consultar posiciones en tiempo real.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
