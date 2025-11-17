import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/Layout/AppLayout';
import { torneosService } from '@/services/torneos.service';
import { partidosService } from '@/services/partidos.service';
import { useGrupos, useJornadas } from '@/hooks/useCatalogos';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Guard } from '@/components/ui/Guard';
import { toast } from 'sonner';
import { ArrowLeft, Trophy, Calendar, Users, Zap, ExternalLink, Award } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

interface EstadoFaseGruposDTO {
  puedeGenerar: boolean;
  partidosTotales: number;
  partidosJugados: number;
  mensaje?: string;
}

export default function DetalleTorneo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: torneo, isLoading } = useQuery({
    queryKey: ['torneo', id],
    queryFn: () => torneosService.getTorneo(Number(id)),
    enabled: !!id,
  });

  const { data: grupos } = useGrupos(torneo?.id);
  const { data: jornadas } = useJornadas(torneo?.id);

  // Estado de fase de grupos (para habilitar botón de generar llaves)
  const { data: estadoFaseGrupos } = useQuery<EstadoFaseGruposDTO>({
    queryKey: ['puede-generar-llaves', id],
    queryFn: () => partidosService.puedeGenerarLlaves(Number(id)),
    enabled: !!id,
    refetchInterval: 30000, // refetch cada 30s
  });

  const generarLlavesMutation = useMutation({
    mutationFn: () => torneosService.generarLlaves(Number(id)),
    onSuccess: () => {
      toast.success('Llaves generadas exitosamente');
      queryClient.invalidateQueries({ queryKey: ['partidos'] });
    },
    onError: (error: unknown) => {
      let description = 'Error al generar llaves';

      if (axios.isAxiosError(error)) {
        description = (error.response?.data as { message?: string })?.message || error.message || description;
      } else if (error instanceof Error) {
        description = error.message || description;
      }

      toast.error(description);
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!torneo) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Torneo no encontrado</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <Button variant="ghost" onClick={() => navigate('/torneos')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Torneos
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{torneo.nombre}</h1>
              <p className="text-muted-foreground">
                {torneo.deporteNombre}
              </p>
            </div>
            <Badge variant="outline">{torneo.olimpiadaNombre}</Badge>
          </div>
        </div>

        <h2 className="sr-only">Resumen del torneo</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <Award className="h-8 w-8 text-primary" />
              <div className="text-lg font-semibold leading-none tracking-tight">Olimpiada</div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{torneo.olimpiadaNombre}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Trophy className="h-8 w-8 text-secondary" />
              <div className="text-lg font-semibold leading-none tracking-tight">Deporte</div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{torneo.deporteNombre}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-contrast" />
              <div className="text-lg font-semibold leading-none tracking-tight">Grupos</div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{grupos?.length || 0}</p>
            </CardContent>
          </Card>
        </div>

        {torneo.reglamentoUrl && (
          <Card>
            <CardHeader>
              <div className="text-lg font-semibold leading-none tracking-tight">Reglamento</div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <a href={torneo.reglamentoUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver Reglamento Oficial
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {grupos && grupos.length > 0 && (
          <Card>
            <CardHeader>
              <div className="text-lg font-semibold leading-none tracking-tight">Grupos del Torneo</div>
              <CardDescription>Haz clic en un grupo para ver su tabla de posiciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {grupos.map((grupo) => (
                  <button
                    key={grupo.id}
                    onClick={() => navigate(`/posiciones?torneoId=${torneo.id}&grupoId=${grupo.id}`)}
                    className="rounded-lg border p-3 text-left transition-all hover:bg-accent hover:border-primary cursor-pointer"
                  >
                    <p className="font-medium">{grupo.nombre}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Guard
          permiso="Partidos_Crear"
          tooltipMessage="Solo usuarios con permisos pueden generar llaves"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight">
                <Zap className="h-5 w-5 text-accent" />
                Generar Llaves
              </div>
              <CardDescription>
                Genera automáticamente los partidos de eliminación según el reglamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {estadoFaseGrupos && (
                  <p className="text-sm text-muted-foreground">
                    {estadoFaseGrupos.partidosJugados}/{estadoFaseGrupos.partidosTotales} partidos de fase de grupos finalizados
                  </p>
                )}
                <Button
                  onClick={() => generarLlavesMutation.mutate()}
                  disabled={generarLlavesMutation.isPending || !estadoFaseGrupos?.puedeGenerar}
                >
                  {generarLlavesMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {estadoFaseGrupos?.puedeGenerar ? 'Generar Llaves del Torneo' : 'Fase de grupos en curso'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </Guard>
      </div>
    </AppLayout>
  );
}
