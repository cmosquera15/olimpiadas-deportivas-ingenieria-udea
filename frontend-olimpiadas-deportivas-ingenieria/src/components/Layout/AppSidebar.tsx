import { Home, Trophy, Calendar, Users, BarChart3, Shield, Award, Target } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { getUserRole } from '@/lib/auth';

const menuItems = [
  {
    title: 'Inicio',
    url: '/dashboard',
    icon: Home,
    roles: ['Administrador', 'Árbitro', 'Jugador'],
  },
  {
    title: 'Olimpiadas',
    url: '/olimpiadas',
    icon: Award,
    // Visible para todos los roles; la UI interna controlará quién puede crear/editar
    roles: ['Administrador', 'Árbitro', 'Jugador'],
  },
  {
    title: 'Torneos',
    url: '/torneos',
    icon: Trophy,
    roles: ['Administrador', 'Árbitro', 'Jugador'],
  },
  {
    title: 'Partidos',
    url: '/partidos',
    icon: Calendar,
    roles: ['Administrador', 'Árbitro', 'Jugador'],
  },
  {
    title: 'Equipos',
    url: '/equipos',
    icon: Users,
    roles: ['Administrador', 'Árbitro', 'Jugador'],
  },
  {
    title: 'Posiciones',
    url: '/posiciones',
    icon: BarChart3,
    roles: ['Administrador', 'Árbitro', 'Jugador'],
  },
  {
    title: 'Goleadores',
    url: '/goleadores',
    icon: Target,
    roles: ['Administrador', 'Árbitro', 'Jugador'],
  },
  {
    title: 'Administración',
    url: '/admin/usuarios',
    icon: Shield,
    roles: ['Administrador'],
  },
];

export const AppSidebar = () => {
  const state = useSidebar();
  const userRole = getUserRole() ?? 'Jugador';

  const visibleItems = menuItems.filter((item) => item.roles.includes(userRole));

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
