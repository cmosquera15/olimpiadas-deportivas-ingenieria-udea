import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { partidosService } from '@/services/partidos.service';
import { equiposService } from '@/services/equipos.service';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

interface AsignarEquiposFormProps {
  partidoId: number;
  torneoId: number;
  onSuccess?: () => void;
  /** Permite forzar el grupo si ya lo tienes fuera; si se omite se toma del partido */
  grupoId?: number;
}

export function AsignarEquiposForm({ partidoId, torneoId, onSuccess, grupoId }: AsignarEquiposFormProps) {
  const [equipoId1, setEquipoId1] = useState<string | undefined>(undefined);
  const [equipoId2, setEquipoId2] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  const { data: equipos, isLoading: loadingEquipos } = useQuery({
    queryKey: ['equipos', torneoId],
    queryFn: () => equiposService.getEquipos(torneoId),
  });

  // Si no recibimos grupoId, obtenemos el partido para extraer su grupo asignado.
  const { data: partido } = useQuery({
    enabled: typeof grupoId === 'undefined',
    queryKey: ['partido', partidoId],
    queryFn: () => partidosService.getPartido(partidoId),
  });

  const grupoFiltradoId = typeof grupoId === 'number' ? grupoId : partido?.idGrupo;
  const equiposFiltrados = (equipos || []).filter(e => !grupoFiltradoId || e.grupoId === grupoFiltradoId);

  const mutation = useMutation({
    mutationFn: () =>
      partidosService.asignarEquipos(partidoId, {
        equipoId1: Number(equipoId1),
        equipoId2: Number(equipoId2),
      }),
    onSuccess: () => {
      toast({
        title: 'Equipos asignados',
        description: 'Los equipos han sido asignados correctamente al partido',
      });
      onSuccess?.();
    },
    onError: (error: unknown) => {
      let description = 'Ocurrió un error al asignar los equipos';

      if (axios.isAxiosError(error)) {
        description = (error.response?.data as { message?: string })?.message || error.message || description;
      } else if (error instanceof Error) {
        description = error.message || description;
      }

      toast({
        variant: 'destructive',
        title: 'Error al asignar equipos',
        description,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipoId1 || !equipoId2) {
      toast({
        variant: 'destructive',
        title: 'Campos incompletos',
        description: 'Debes seleccionar ambos equipos',
      });
      return;
    }
    if (equipoId1 === equipoId2) {
      toast({
        variant: 'destructive',
        title: 'Equipos inválidos',
        description: 'No puedes seleccionar el mismo equipo dos veces',
      });
      return;
    }
    mutation.mutate();
  };

  if (loadingEquipos) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Equipo 1</label>
          <Select value={equipoId1} onValueChange={setEquipoId1}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar equipo" />
            </SelectTrigger>
            <SelectContent>
              {equiposFiltrados.map((equipo) => (
                <SelectItem
                  key={equipo.id}
                  value={equipo.id.toString()}
                  disabled={equipoId2 === equipo.id.toString()}
                >
                  {equipo.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Equipo 2</label>
          <Select value={equipoId2} onValueChange={setEquipoId2}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar equipo" />
            </SelectTrigger>
            <SelectContent>
              {equiposFiltrados.map((equipo) => (
                <SelectItem
                  key={equipo.id}
                  value={equipo.id.toString()}
                  disabled={equipoId1 === equipo.id.toString()}
                >
                  {equipo.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={mutation.isPending || !equipoId1 || !equipoId2}>
        {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Asignar Equipos
      </Button>
    </form>
  );
}
