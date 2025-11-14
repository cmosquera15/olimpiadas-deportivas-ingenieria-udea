import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Equipo, UsuarioPorEquipo } from '@/types';
import { equiposService } from '@/services/equipos.service';
import { AgregarJugador } from './AgregarJugador';
import { useToast } from '@/hooks/use-toast';

interface PlantillaEquipoProps {
  equipo: Equipo;
  canEdit: boolean;
}

export function PlantillaEquipo({ equipo, canEdit }: PlantillaEquipoProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch plantilla separately
  const { data: plantilla = [], isLoading } = useQuery({
    queryKey: ['plantilla', equipo.id, equipo.torneoId],
    queryFn: () => equiposService.getPlantilla(equipo.id, equipo.torneoId!),
    enabled: !!equipo.torneoId,
  });

  const removerJugadorMutation = useMutation({
    mutationFn: (usuariosPorEquipoId: number) =>
      equiposService.removeFromPlantilla(usuariosPorEquipoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantilla', equipo.id] });
      // Refrescar listado de equipos para actualizar integrantesCount en tarjetas
      if (equipo.torneoId) {
        queryClient.invalidateQueries({ queryKey: ['equipos', equipo.torneoId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['equipos'] });
      }
      toast({
        title: 'Jugador removido',
        description: 'El jugador ha sido removido del equipo exitosamente.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo remover el jugador del equipo.',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Agregar Jugador</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Jugador al Equipo</DialogTitle>
              </DialogHeader>
              <AgregarJugador
                equipoId={equipo.id}
                torneoId={equipo.torneoId!}
                onSuccess={() => {
                  setDialogOpen(false);
                  queryClient.invalidateQueries({
                    queryKey: ['plantilla', equipo.id],
                  });
                  // Refrescar listado de equipos para actualizar integrantesCount en tarjetas
                  if (equipo.torneoId) {
                    queryClient.invalidateQueries({ queryKey: ['equipos', equipo.torneoId] });
                  } else {
                    queryClient.invalidateQueries({ queryKey: ['equipos'] });
                  }
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>Programa</TableHead>
            {canEdit && <TableHead>Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {plantilla.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canEdit ? 4 : 3} className="text-center text-muted-foreground">
                No hay jugadores en la plantilla
              </TableCell>
            </TableRow>
          ) : (
            plantilla.map((miembro) => (
              <TableRow key={miembro.id}>
                <TableCell>{miembro.usuario?.nombre || 'N/A'}</TableCell>
                <TableCell>{miembro.usuario?.documento || 'N/A'}</TableCell>
                <TableCell>{miembro.usuario?.programaAcademico?.nombre || 'N/A'}</TableCell>
                {canEdit && (
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removerJugadorMutation.mutate(miembro.id)}
                      disabled={removerJugadorMutation.isPending}
                    >
                      Remover
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}