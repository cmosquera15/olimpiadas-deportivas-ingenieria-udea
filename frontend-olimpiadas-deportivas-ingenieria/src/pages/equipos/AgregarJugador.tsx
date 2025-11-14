import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  const [open, setOpen] = useState(false);
  // Usamos un tipo local con id obligatorio para evitar casos donde Usuario.id es opcional
  interface JugadorSeleccionado extends Usuario { id: number }
  const [selectedUser, setSelectedUser] = useState<JugadorSeleccionado | null>(null);
  const [searchText, setSearchText] = useState('');
  const { toast } = useToast();

  const { data: jugadoresDisponibles = [] } = useQuery({
    queryKey: ['jugadores-disponibles', equipoId, torneoId, searchText],
    queryFn: () => equipoDetalleService.getJugadoresDisponibles(equipoId, torneoId, searchText || undefined),
  });

  const agregarJugadorMutation = useMutation({
    mutationFn: () =>
      equiposService.addToPlantilla(equipoId, selectedUser!.id!, torneoId),
    onSuccess: () => {
      toast({
        title: 'Jugador agregado',
        description: 'El jugador ha sido agregado al equipo exitosamente.',
      });
      onSuccess();
      setSelectedUser(null);
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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedUser ? selectedUser.nombre : 'Seleccionar jugador...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput
              placeholder="Buscar jugador..."
              value={searchText}
              onValueChange={setSearchText}
            />
            <CommandEmpty>No se encontraron jugadores.</CommandEmpty>
            <CommandGroup>
              {jugadoresDisponibles.map((jugador) => (
                <CommandItem
                  key={jugador.id}
                  value={`${jugador.id}-${jugador.nombre}`}
                  onSelect={() => {
                    if (jugador.id == null) {
                      // Seguridad extra: no debería pasar
                      console.warn('[AgregarJugador] Jugador sin id', jugador);
                      return;
                    }
                    setSelectedUser(jugador as JugadorSeleccionado);
                    setOpen(false);
                    setSearchText('');
                    console.log('[AgregarJugador] seleccionado', jugador.id, jugador.nombre);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedUser?.id === jugador.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="truncate">{jugador.nombre}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <Button
        className="w-full"
        onClick={() => {
          if (!selectedUser) return;
          if (selectedUser.id == null) {
            console.warn('[AgregarJugador] id indefinido, abortando');
            return;
          }
          agregarJugadorMutation.mutate();
        }}
        disabled={!selectedUser || agregarJugadorMutation.isPending}
      >
        {agregarJugadorMutation.isPending ? 'Agregando...' : selectedUser ? `Agregar a ${selectedUser.nombre}` : 'Agregar al Equipo'}
      </Button>
    </div>
  );
}