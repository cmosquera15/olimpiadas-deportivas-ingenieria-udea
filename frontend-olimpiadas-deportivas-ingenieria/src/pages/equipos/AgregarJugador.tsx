import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Usuario } from '@/types';
import { equiposService } from '@/services/equipos.service';
import { equipoDetalleService } from '@/services/equipo-detalle.service';
import { useToast } from '@/hooks/use-toast';

interface AgregarJugadorProps {
  equipoId: number;
  torneoId: number;
  onSuccess: () => void;
}

export function AgregarJugador({ equipoId, torneoId, onSuccess }: AgregarJugadorProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('none');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jugadoresDisponibles = [] } = useQuery({
    queryKey: ['jugadores-disponibles', equipoId, torneoId],
    queryFn: () => equipoDetalleService.getJugadoresDisponibles(equipoId, torneoId),
  });

  const agregarJugadorMutation = useMutation({
    mutationFn: () => equiposService.addToPlantilla(equipoId, Number(selectedUserId), torneoId),
    onSuccess: () => {
      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['plantilla', equipoId, torneoId] });
      queryClient.invalidateQueries({ queryKey: ['jugadores-disponibles', equipoId, torneoId] });
      queryClient.invalidateQueries({ queryKey: ['equipos', torneoId] });
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      
      toast({
        title: 'Jugador agregado',
        description: 'El jugador ha sido agregado al equipo exitosamente.',
      });
      onSuccess();
      setSelectedUserId('none');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo agregar el jugador al equipo.',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Jugador</label>
        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar jugador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin jugador</SelectItem>
            {jugadoresDisponibles
              .filter((j) => typeof j.id === 'number')
              .map((j) => (
                <SelectItem key={j.id} value={String(j.id)}>
                  {j.nombre}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        className="w-full"
        onClick={() => {
          if (!selectedUserId || selectedUserId === 'none') return;
          agregarJugadorMutation.mutate();
        }}
        disabled={selectedUserId === 'none' || agregarJugadorMutation.isPending}
      >
        {agregarJugadorMutation.isPending
          ? 'Agregando...'
          : selectedUserId !== 'none'
          ? 'Agregar al Equipo'
          : 'Agregar al Equipo'}
      </Button>
    </div>
  );
}