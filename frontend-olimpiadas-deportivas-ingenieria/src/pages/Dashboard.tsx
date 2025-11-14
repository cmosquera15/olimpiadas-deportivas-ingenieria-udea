import { AppLayout } from '@/components/Layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, Users, BarChart3, Medal } from 'lucide-react';
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bienvenido</h1>
          <p className="text-muted-foreground">
            Sistema de gestión de Olimpiadas Deportivas - Ingeniería UdeA
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link key={link.href} to={link.href}>
              <Card className="transition-all hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <link.icon className={`h-8 w-8 ${link.color}`} />
                  </div>
                  <CardTitle className="text-lg">{link.title}</CardTitle>
                  <CardDescription>{link.description}</CardDescription>
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
