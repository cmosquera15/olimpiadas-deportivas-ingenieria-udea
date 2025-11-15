import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/Layout/AppLayout';
import { partidosService } from '@/services/partidos.service';
import { formatDateTime } from '@/lib/date';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Guard } from '@/components/ui/Guard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AsignarEquiposForm } from '@/components/Partidos/AsignarEquiposForm';
import { MarcadorForm } from '@/components/Partidos/MarcadorForm';
import { EventosPanel } from '@/components/Partidos/EventosPanel';
import { Calendar, MapPin, User, ArrowLeft, Users, Trophy, Flag } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { hasPermission } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export default function DetallePartido() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: partido, isLoading, refetch } = useQuery({
    queryKey: ['partido', id],
    queryFn: () => partidosService.getPartido(Number(id)),
    enabled: !!id,
  });

  const estadoMutation = useMutation({
    mutationFn: (nuevoEstado: string) => partidosService.actualizarEstado(Number(id), nuevoEstado),
    onSuccess: () => {
      toast({
        title: 'Estado actualizado',
        description: 'El estado del partido se actualizó correctamente',
      });
      queryClient.invalidateQueries({ queryKey: ['partido', id] });
      queryClient.invalidateQueries({ queryKey: ['partidos'] });
      queryClient.invalidateQueries({ queryKey: ['posiciones'] });
    },
    onError: (error: unknown) => {
      let description = 'No se pudo actualizar el estado';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        description = axiosError.response?.data?.message || description;
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description,
      });
    },
  });

  const canEdit = hasPermission('Partidos_Editar');

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!partido) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Partido no encontrado</p>
        </div>
      </AppLayout>
    );
  }

  const isFinished = partido?.equipoLocalPuntos !== null && partido?.equipoVisitantePuntos !== null;
  const hasEquipos = partido?.equipoLocalId && partido?.equipoVisitanteId;

  const getEstadoBadgeVariant = (estado?: string) => {
    switch (estado) {
      case 'TERMINADO':
        return 'default';
      case 'APLAZADO':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getEstadoLabel = (estado?: string) => {
    switch (estado) {
      case 'TERMINADO':
        return 'Terminado';
      case 'APLAZADO':
        return 'Aplazado';
      default:
        return 'Programado';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Volver a la lista de partidos" onClick={() => navigate('/partidos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Detalle del Partido</h1>
            <p className="text-muted-foreground">{partido.torneoNombre}</p>
          </div>
          <Badge variant={getEstadoBadgeVariant(partido.estado)}>{getEstadoLabel(partido.estado)}</Badge>
        </div>

        {/* Selector de Estado - solo para admin/árbitro */}
        {canEdit && (
          <Card>
            <CardHeader>
              <CardTitle>Estado del Partido</CardTitle>
              <CardDescription>
                Cambia el estado del partido. Solo los partidos terminados se consideran en la tabla de posiciones.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={partido.estado || 'PROGRAMADO'} 
                onValueChange={(value) => estadoMutation.mutate(value)}
                disabled={estadoMutation.isPending}
              >
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROGRAMADO">Programado</SelectItem>
                  <SelectItem value="TERMINADO">Terminado</SelectItem>
                  <SelectItem value="APLAZADO">Aplazado</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Información General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Fecha y Hora</p>
                <p className="font-medium">
                  {formatDateTime(new Date(partido.fecha + 'T' + partido.hora))}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lugar</p>
                <p className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {partido.lugarNombre}
                </p>
              </div>
              {partido.faseNombre && (
                <div>
                  <p className="text-sm text-muted-foreground">Fase</p>
                  <p className="font-medium">{partido.faseNombre}</p>
                </div>
              )}
              {partido.grupoNombre && (
                <div>
                  <p className="text-sm text-muted-foreground">Grupo</p>
                  <p className="font-medium">{partido.grupoNombre}</p>
                </div>
              )}
              {partido.numeroJornada && (
                <div>
                  <p className="text-sm text-muted-foreground">Jornada</p>
                  <p className="font-medium">Jornada {partido.numeroJornada}</p>
                </div>
              )}
              {partido.arbitroNombre && (
                <div>
                  <p className="text-sm text-muted-foreground">Árbitro</p>
                  <p className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {partido.arbitroNombre}
                  </p>
                </div>
              )}
            </div>
            {partido.observaciones && (
              <div>
                <p className="text-sm text-muted-foreground">Observaciones</p>
                <p className="font-medium">{partido.observaciones}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Asignar Equipos */}
        {!hasEquipos && (
          <Guard permiso="Partidos_Editar">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Asignar Equipos
                </CardTitle>
                <CardDescription>
                  Selecciona los dos equipos que participarán en este partido
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AsignarEquiposForm partidoId={partido.id} torneoId={partido.idTorneo} onSuccess={refetch} />
              </CardContent>
            </Card>
          </Guard>
        )}

        {/* Marcador */}
        {hasEquipos && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Marcador
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex-1 text-center">
                    <p className="text-lg font-semibold mb-2">{partido.equipoLocalNombre}</p>
                    <p className="text-4xl font-bold text-primary">
                      {partido.equipoLocalPuntos ?? '-'}
                    </p>
                  </div>
                  <div className="px-8 text-muted-foreground text-2xl">vs</div>
                  <div className="flex-1 text-center">
                    <p className="text-lg font-semibold mb-2">{partido.equipoVisitanteNombre}</p>
                    <p className="text-4xl font-bold text-primary">
                      {partido.equipoVisitantePuntos ?? '-'}
                    </p>
                  </div>
                </div>

                <Guard permiso="Partidos_Editar">
                  <Separator className="my-6" />
                  <MarcadorForm partido={partido} onSuccess={refetch} />
                </Guard>
              </CardContent>
            </Card>

            {/* Eventos */}
            <Guard permiso="Partidos_Editar">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flag className="h-5 w-5" />
                    Eventos del Partido
                  </CardTitle>
                  <CardDescription>
                    Registra eventos como tarjetas, goles, faltas, etc.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EventosPanel partido={partido} />
                </CardContent>
              </Card>
            </Guard>
          </>
        )}
      </div>
    </AppLayout>
  );
}
