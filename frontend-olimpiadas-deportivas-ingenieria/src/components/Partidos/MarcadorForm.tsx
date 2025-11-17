import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { partidosService } from '@/services/partidos.service';
import { catalogoService } from '@/services/catalogo.service';
import { PartidoDetail } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import axios from 'axios';
import { hasPermission } from '@/lib/auth';

interface MarcadorFormProps {
  partido: PartidoDetail;
  onSuccess?: () => void;
}

export function MarcadorForm({ partido, onSuccess }: MarcadorFormProps) {
  const queryClient = useQueryClient();
  const canEdit = hasPermission('Partidos_Editar');
  const [puntosEquipo1, setPuntosEquipo1] = useState<string>(
   partido.equipoLocalPuntos?.toString() ?? ''
  );
  const [puntosEquipo2, setPuntosEquipo2] = useState<string>(
   partido.equipoVisitantePuntos?.toString() ?? ''
  );
  const [resultadoEquipo1Id, setResultadoEquipo1Id] = useState<string>(
    partido.resultadoEquipo1Id ? String(partido.resultadoEquipo1Id) : ''
  );
  const [resultadoEquipo2Id, setResultadoEquipo2Id] = useState<string>(
    partido.resultadoEquipo2Id ? String(partido.resultadoEquipo2Id) : ''
  );

  const { toast } = useToast();

  const { data: resultados } = useQuery({
    queryKey: ['resultados'],
    queryFn: catalogoService.getResultados,
  });

  const isBasketball = partido.torneoNombre.toLowerCase().includes('baloncesto');

  // Mantener sincronizado el formulario cuando el partido cambia (después de guardar o refetch)
  useEffect(() => {
    setPuntosEquipo1(partido.equipoLocalPuntos?.toString() ?? '');
    setPuntosEquipo2(partido.equipoVisitantePuntos?.toString() ?? '');
    setResultadoEquipo1Id(partido.resultadoEquipo1Id ? String(partido.resultadoEquipo1Id) : '');
    setResultadoEquipo2Id(partido.resultadoEquipo2Id ? String(partido.resultadoEquipo2Id) : '');
  }, [partido]);

  // Validación: en baloncesto no puede haber empate
  const isDraw =
    puntosEquipo1 !== '' &&
    puntosEquipo2 !== '' &&
    Number(puntosEquipo1) === Number(puntosEquipo2);

  const isInvalid = isBasketball && isDraw;

  // Validación de coherencia: marcador vs resultados
  const getValidationError = (): string | null => {
    const pts1 = puntosEquipo1 ? Number(puntosEquipo1) : null;
    const pts2 = puntosEquipo2 ? Number(puntosEquipo2) : null;
    
    // Si no hay marcador completo o resultados, no validamos
    if (pts1 === null || pts2 === null || !resultadoEquipo1Id || !resultadoEquipo2Id) {
      return null;
    }

    const res1 = resultados?.find(r => r.id.toString() === resultadoEquipo1Id);
    const res2 = resultados?.find(r => r.id.toString() === resultadoEquipo2Id);
    
    if (!res1 || !res2) return null;

    const nombre1 = res1.nombre.toUpperCase();
    const nombre2 = res2.nombre.toUpperCase();
    
    const esGanador1 = nombre1.includes('GANADOR');
    const esPerdedor1 = nombre1.includes('PERDEDOR');
    const esEmpate1 = nombre1.includes('EMPAT');
    
    const esGanador2 = nombre2.includes('GANADOR');
    const esPerdedor2 = nombre2.includes('PERDEDOR');
    const esEmpate2 = nombre2.includes('EMPAT');

    // Caso: empate
    if (pts1 === pts2) {
      if (!esEmpate1 || !esEmpate2) {
        return `Marcador empatado (${pts1}-${pts2}) pero los resultados no son ambos EMPATE`;
      }
      return null;
    }

    // Caso: equipo 1 ganó
    if (pts1 > pts2) {
      if (!esGanador1) {
        return `${partido.equipoLocalNombre} anotó más (${pts1} > ${pts2}) pero su resultado no es GANADOR`;
      }
      if (!esPerdedor2) {
        return `${partido.equipoVisitanteNombre} anotó menos (${pts2} < ${pts1}) pero su resultado no es PERDEDOR`;
      }
      return null;
    }

    // Caso: equipo 2 ganó
    if (pts2 > pts1) {
      if (!esGanador2) {
        return `${partido.equipoVisitanteNombre} anotó más (${pts2} > ${pts1}) pero su resultado no es GANADOR`;
      }
      if (!esPerdedor1) {
        return `${partido.equipoLocalNombre} anotó menos (${pts1} < ${pts2}) pero su resultado no es PERDEDOR`;
      }
    }

    return null;
  };

  const validationError = getValidationError();
  const hasError = isInvalid || validationError !== null;

  const mutation = useMutation({
    mutationFn: () =>
      partidosService.actualizarMarcador(partido.id, {
        equipo1Id: partido.equipoLocalId,
        equipo2Id: partido.equipoVisitanteId,
        puntosEquipo1: puntosEquipo1 ? Number(puntosEquipo1) : undefined,
        puntosEquipo2: puntosEquipo2 ? Number(puntosEquipo2) : undefined,
        resultadoEquipo1Id: resultadoEquipo1Id ? Number(resultadoEquipo1Id) : undefined,
        resultadoEquipo2Id: resultadoEquipo2Id ? Number(resultadoEquipo2Id) : undefined,
      }),
    onSuccess: () => {
      // Invalidate posiciones to update the standings table
      queryClient.invalidateQueries({ queryKey: ['posiciones'] });
      queryClient.invalidateQueries({ queryKey: ['partidos'] });
      toast({
        title: 'Marcador actualizado',
        description: 'El marcador se ha actualizado correctamente',
      });
      onSuccess?.();
    },
    onError: (error: unknown) => {
      let description = 'Ocurrió un error al actualizar el marcador';

      if (axios.isAxiosError(error)) {
        description = (error.response?.data as { message?: string })?.message || error.message || description;
      } else if (error instanceof Error) {
        description = error.message || description;
      }

      toast({
        variant: 'destructive',
        title: 'Error al actualizar marcador',
        description,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasError) {
      return;
    }
    mutation.mutate();
  };

  if (!canEdit) {
    return (
      <div className="text-sm text-muted-foreground border rounded-md p-4">
        No tienes permisos para editar el marcador de este partido.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Equipo 1 */}
        <div className="space-y-4">
          <div className="space-y-2">
              <label className="text-sm font-medium">Puntos {partido.equipoLocalNombre}</label>
            <Input
              type="number"
              min="0"
              value={puntosEquipo1}
              onChange={(e) => setPuntosEquipo1(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Resultado</label>
            <Select value={resultadoEquipo1Id || undefined} onValueChange={(val) => setResultadoEquipo1Id(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Sin resultado" />
              </SelectTrigger>
              <SelectContent>
                {resultados?.map((resultado) => (
                  <SelectItem key={resultado.id} value={resultado.id.toString()}>
                    {resultado.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Equipo 2 */}
        <div className="space-y-4">
          <div className="space-y-2">
              <label className="text-sm font-medium">Puntos {partido.equipoVisitanteNombre}</label>
            <Input
              type="number"
              min="0"
              value={puntosEquipo2}
              onChange={(e) => setPuntosEquipo2(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Resultado</label>
            <Select value={resultadoEquipo2Id || undefined} onValueChange={(val) => setResultadoEquipo2Id(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Sin resultado" />
              </SelectTrigger>
              <SelectContent>
                {resultados?.map((resultado) => (
                  <SelectItem key={resultado.id} value={resultado.id.toString()}>
                    {resultado.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <TooltipProvider>
        <Tooltip open={hasError ? undefined : false}>
          <TooltipTrigger asChild>
            <div className="inline-block">
              <Button type="submit" disabled={mutation.isPending || hasError}>
                {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Actualizar Marcador
              </Button>
            </div>
          </TooltipTrigger>
          {hasError && (
            <TooltipContent>
              <p>
                {validationError || 'En baloncesto no puede haber empate'}
              </p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </form>
  );
}
