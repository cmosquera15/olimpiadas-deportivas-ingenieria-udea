import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventosService } from '@/services/eventos.service';
import { catalogoService } from '@/services/catalogo.service';
import { torneosService } from '@/services/torneos.service';
import { equiposService } from '@/services/equipos.service';
import { PartidoDetail } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Plus } from 'lucide-react';
import axios from 'axios';
import { hasPermission } from '@/lib/auth';

interface EventosPanelProps {
  partido: PartidoDetail;
}

export function EventosPanel({ partido }: EventosPanelProps) {
  const canEdit = hasPermission('Partidos_Editar');
  const [tipoEventoId, setTipoEventoId] = useState<string | undefined>(undefined);
  const [usuarioId, setUsuarioId] = useState<string>('none');
  const [observaciones, setObservaciones] = useState<string>('');
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<'1' | '2'>('1');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: eventos, isLoading: loadingEventos } = useQuery({
    queryKey: ['eventos', partido.id],
    queryFn: () => eventosService.getEventos(partido.id),
  });

  // Load torneo detail to know its deporte and then load tipos de evento
  // Fallback for any legacy snake_case still lingering in cached objects (type guard)
  const partidoTorneoId: number | undefined =
    typeof (partido as { idTorneo?: number }).idTorneo === 'number'
      ? (partido as { idTorneo?: number }).idTorneo
      : (partido as { id_torneo?: number }).id_torneo;

  const { data: torneo, isLoading: loadingTorneo } = useQuery({
    queryKey: ['torneo-detalle', partidoTorneoId],
    queryFn: () => torneosService.getTorneo(partidoTorneoId),
    enabled: !!partidoTorneoId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: tiposEvento, isLoading: loadingTiposEvento } = useQuery({
    queryKey: ['tipos-evento', torneo?.idDeporte],
    queryFn: () => catalogoService.getTiposEvento(torneo!.idDeporte),
    enabled: !!torneo?.idDeporte,
    staleTime: 5 * 60 * 1000,
  });

  if (import.meta.env.DEV) {
    console.log('🔍 EventosPanel debug:', {
      partidoIdTorneo: partidoTorneoId,
      torneo,
      loadingTorneo,
      idDeporte: torneo?.idDeporte,
      tiposEvento,
      loadingTiposEvento,
      tiposEventoCount: tiposEvento?.length
    });
  }

  const equipoIdActual = equipoSeleccionado === '1' ? partido.equipoLocalId : partido.equipoVisitanteId;

  const { data: plantilla } = useQuery({
    queryKey: ['plantilla', equipoIdActual, partidoTorneoId],
    queryFn: () => equiposService.getPlantilla(equipoIdActual!, partidoTorneoId),
    enabled: !!equipoIdActual && !!partidoTorneoId,
    staleTime: 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: eventosService.createEvento,
    onSuccess: () => {
      toast({
        title: 'Evento registrado',
        description: 'El evento se ha registrado correctamente',
      });
      queryClient.invalidateQueries({ queryKey: ['eventos', partido.id] });
      // Invalidate posiciones to update Fair Play in standings table
      queryClient.invalidateQueries({ queryKey: ['posiciones'] });
      setTipoEventoId(undefined);
      setUsuarioId('none');
      setObservaciones('');
    },
    onError: (error: unknown) => {
      let description = 'Ocurrió un error al registrar el evento';

      if (axios.isAxiosError(error)) {
        description = (error.response?.data as { message?: string })?.message || error.message || description;
      } else if (error instanceof Error) {
        description = error.message || description;
      }

      toast({
        variant: 'destructive',
        title: 'Error al registrar evento',
        description,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: eventosService.deleteEvento,
    onSuccess: () => {
      toast({
        title: 'Evento eliminado',
        description: 'El evento se ha eliminado correctamente',
      });
      queryClient.invalidateQueries({ queryKey: ['eventos', partido.id] });
      // Invalidate posiciones to update Fair Play in standings table
      queryClient.invalidateQueries({ queryKey: ['posiciones'] });
    },
    onError: (error: unknown) => {
      let description = 'Ocurrió un error al eliminar el evento';

      if (axios.isAxiosError(error)) {
        description = (error.response?.data as { message?: string })?.message || error.message || description;
      } else if (error instanceof Error) {
        description = error.message || description;
      }

      toast({
        variant: 'destructive',
        title: 'Error al eliminar evento',
        description,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipoEventoId || !usuarioId || usuarioId === 'none') {
      toast({
        variant: 'destructive',
        title: 'Campos incompletos',
        description: 'Debes seleccionar el tipo de evento y el jugador',
      });
      return;
    }

    const equipoPorPartidoId = equipoSeleccionado === '1' 
      ? partido.idEquipoLocalPorPartido 
      : partido.idEquipoVisitantePorPartido;

    if (!equipoPorPartidoId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo identificar el equipo en este partido',
      });
      return;
    }

    createMutation.mutate({
      id_equipo_por_partido: equipoPorPartidoId,
      id_tipo_evento: Number(tipoEventoId),
      id_usuario_jugador: Number(usuarioId),
    });
  };

  if (loadingEventos) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lista de eventos */}
      <div className="space-y-3">
        {eventos && eventos.length > 0 ? (
          eventos.map((evento) => (
            <div
              key={evento.id}
              className="flex items-start justify-between p-3 border rounded-lg"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{evento.tipoEvento.nombre}</Badge>
                  <span className="text-sm font-medium">{evento.usuario.nombre}</span>
                </div>
                {evento.observaciones && (
                  <p className="text-sm text-muted-foreground">{evento.observaciones}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Puntos negativos: {evento.tipoEvento.puntosNegativos}
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar evento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. El evento será eliminado permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteMutation.mutate(evento.id)}>
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No hay eventos registrados para este partido
          </p>
        )}
      </div>

  <Separator />

      {/* Formulario para crear evento */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Registrar Evento</h3>
        {!canEdit ? (
          <div className="text-sm text-muted-foreground border rounded-md p-4">
            No tienes permisos para registrar eventos en este partido.
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Equipo</label>
              <Select value={equipoSeleccionado} onValueChange={(v) => {
                setEquipoSeleccionado(v as '1' | '2');
                setUsuarioId('none');
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1">{partido.equipoLocalNombre}</SelectItem>
                    <SelectItem value="2">{partido.equipoVisitanteNombre}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Evento</label>
              {loadingTiposEvento ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando tipos de evento...
                </div>
              ) : !tiposEvento || tiposEvento.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No hay tipos de evento disponibles para este deporte
                </div>
              ) : (
                <Select value={tipoEventoId} onValueChange={setTipoEventoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposEvento?.map((tipo) => (
                      <SelectItem key={tipo.id} value={String(tipo.id)}>
                        {tipo.nombre} ({tipo.puntosNegativos} pts. neg.)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Jugador</label>
              <Select value={usuarioId} onValueChange={setUsuarioId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar jugador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin jugador</SelectItem>
                  {plantilla
                    ?.filter((p) => typeof p?.usuario?.id === 'number')
                    .map((p) => (
                      <SelectItem key={p.usuario.id} value={String(p.usuario.id)}>
                        {p.usuario.nombre}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Observaciones (opcional)</label>
            <Textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Observaciones adicionales"
              rows={3}
            />
          </div>

          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Registrar Evento
          </Button>
        </form>
        )}
      </div>
    </div>
  );
}
