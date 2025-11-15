import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/Layout/AppLayout';
import { posicionesService } from '@/services/posiciones.service';
import { torneosService } from '@/services/torneos.service';
import { partidosService } from '@/services/partidos.service';
import { useFases, useGrupos } from '@/hooks/useCatalogos';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Info } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PageResponse, TorneoListDTO, TablaPosiciones, EquipoPosicionDTO, Partido, ClasificacionDTO, EstadoFaseGruposDTO } from '@/types';
import { estadisticasService, type Goleador } from '@/services/estadisticas.service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { TournamentBracket } from '@/components/TournamentBracket';

export default function TablaPosiciones() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [torneoId, setTorneoId] = useState<number | undefined>(() => {
    const param = searchParams.get('torneoId');
    return param ? Number(param) : undefined;
  });
  const [grupoId, setGrupoId] = useState<number | undefined>(() => {
    const param = searchParams.get('grupoId');
    return param ? Number(param) : undefined;
  });
  const [fase, setFase] = useState<'grupos' | 'cuartos' | 'semifinal' | 'final'>('grupos');

  // Update URL when torneoId or grupoId changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (torneoId) params.set('torneoId', String(torneoId));
    if (grupoId) params.set('grupoId', String(grupoId));
    setSearchParams(params, { replace: true });
  }, [torneoId, grupoId, setSearchParams]);

  const { data: torneos, isLoading: isLoadingTorneos } = useQuery<PageResponse<TorneoListDTO>>({
    queryKey: ['torneos-activos'],
    queryFn: () => torneosService.getTorneos({ size: 100 }),
  });

  const { data: grupos } = useGrupos(torneoId);
  const { data: fases } = useFases();

  const { data: tabla, isLoading: isLoadingPosiciones } = useQuery<TablaPosiciones>({
    queryKey: ['posiciones', torneoId, grupoId],
    queryFn: async () => {
      if (!torneoId) throw new Error('Torneo ID is required');
      const result = await posicionesService.getTabla(torneoId, grupoId);
      if (import.meta.env.DEV) {
        console.log('🔍 Tabla data received:', result);
        console.log('🔍 First posicion:', result.posiciones?.[0]);
      }
      return result;
    },
    enabled: !!torneoId && fase === 'grupos',
  });

  const faseId = React.useMemo(() => {
    if (fase === 'grupos' || !fases) return undefined;
    const faseMap: Record<'cuartos' | 'semifinal' | 'final', string> = {
      cuartos: 'Cuartos de Final',
      semifinal: 'Semifinal',
      final: 'Final',
    };
    const faseNombre = faseMap[fase];
    return fases.find((f) => f.nombre === faseNombre)?.id;
  }, [fase, fases]);

  // Get IDs for all knockout phases
  const cuartosFaseId = React.useMemo(() => {
    if (!fases) return undefined;
    return fases.find((f) => f.nombre === 'Cuartos de Final')?.id;
  }, [fases]);

  const semifinalFaseId = React.useMemo(() => {
    if (!fases) return undefined;
    return fases.find((f) => f.nombre === 'Semifinal')?.id;
  }, [fases]);

  const finalFaseId = React.useMemo(() => {
    if (!fases) return undefined;
    return fases.find((f) => f.nombre === 'Final')?.id;
  }, [fases]);

  const { data: partidosData, isLoading: isLoadingPartidos } = useQuery<PageResponse<Partido>>({
    queryKey: ['partidos', torneoId, faseId],
    queryFn: () => partidosService.getPartidos({ torneoId: torneoId!, faseId, size: 50 }),
    enabled: !!torneoId && fase !== 'grupos' && !!faseId,
  });

  // Load all knockout phase matches for bracket view
  const { data: cuartosData } = useQuery<PageResponse<Partido>>({
    queryKey: ['partidos-cuartos', torneoId, cuartosFaseId],
    queryFn: () => partidosService.getPartidos({ torneoId: torneoId!, faseId: cuartosFaseId, size: 50 }),
    enabled: !!torneoId && fase !== 'grupos' && !!cuartosFaseId,
  });

  const { data: semifinalesData } = useQuery<PageResponse<Partido>>({
    queryKey: ['partidos-semifinales', torneoId, semifinalFaseId],
    queryFn: () => partidosService.getPartidos({ torneoId: torneoId!, faseId: semifinalFaseId, size: 50 }),
    enabled: !!torneoId && fase !== 'grupos' && !!semifinalFaseId,
  });

  const { data: finalData } = useQuery<PageResponse<Partido>>({
    queryKey: ['partidos-final', torneoId, finalFaseId],
    queryFn: () => partidosService.getPartidos({ torneoId: torneoId!, faseId: finalFaseId, size: 50 }),
    enabled: !!torneoId && fase !== 'grupos' && !!finalFaseId,
  });

  // Sort posiciones in the UI according to the displayed tie-breaker rules
  const sortedPosiciones = React.useMemo<EquipoPosicionDTO[]>(() => {
    const posiciones = tabla?.posiciones ?? [];
    return [...posiciones].sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return (a.fairPlay ?? 0) - (b.fairPlay ?? 0); // lower fairPlay is better
    });
  }, [tabla]);

  // Determine if selected torneo is fútbol (by nombre)
  const selectedTorneo = React.useMemo(() => {
    return torneos?.content.find((t) => t.id === torneoId);
  }, [torneos, torneoId]);
  const isFutbol = React.useMemo(() => {
    const nombre = selectedTorneo?.deporteNombre?.toLowerCase() ?? '';
    return nombre.includes('futbol') || nombre.includes('fútbol');
  }, [selectedTorneo]);

  // Goleadores query (only for fútbol)
  const { data: goleadores, isLoading: isLoadingGoleadores } = useQuery<Goleador[]>({
    queryKey: ['goleadores', torneoId],
    queryFn: () => estadisticasService.getGoleadores(torneoId!),
    enabled: !!torneoId && !!isFutbol,
  });

  // Estado de fase de grupos (para habilitar botón de generar llaves)
  const { data: estadoFaseGrupos } = useQuery<EstadoFaseGruposDTO>({
    queryKey: ['puede-generar-llaves', torneoId],
    queryFn: () => partidosService.puedeGenerarLlaves(torneoId!),
    enabled: !!torneoId && fase === 'grupos',
    refetchInterval: 30000, // refetch cada 30s
  });

  // Clasificación de equipos
  const { data: clasificacion } = useQuery<ClasificacionDTO[]>({
    queryKey: ['clasificacion', torneoId],
    queryFn: () => partidosService.obtenerClasificacion(torneoId!),
    enabled: !!torneoId && fase === 'grupos',
  });

  // Handler para generar llaves
  const handleGenerarLlaves = async () => {
    if (!torneoId) return;
    
    try {
      await partidosService.generarLlaves(torneoId);
      toast({
        title: "Llaves generadas",
        description: "Las llaves de eliminación directa han sido generadas exitosamente.",
      });
      // Refetch para actualizar estado
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "No se pudieron generar las llaves",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Selecciona un Torneo</CardTitle>
              <Button
                variant="outline"
                className="hover:bg-transparent"
                onClick={() => {
                  setTorneoId(undefined);
                  setGrupoId(undefined);
                }}
              >
                Limpiar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Torneo</label>
                <Select
                  value={torneoId?.toString()}
                  onValueChange={(value) => {
                    setTorneoId(value ? Number(value) : undefined);
                    setGrupoId(undefined);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un torneo" />
                  </SelectTrigger>
                  <SelectContent>
                    {torneos?.content.map((torneo) => (
                      <SelectItem key={torneo.id} value={torneo.id.toString()}>
                        {torneo.nombre} - {torneo.olimpiadaNombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {grupos && grupos.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Grupo (Opcional)</label>
                  <Select
                    value={grupoId?.toString() ?? 'all'}
                    onValueChange={(value) => setGrupoId(value === 'all' ? undefined : Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los grupos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los grupos</SelectItem>
                      {grupos.map((grupo) => (
                        <SelectItem key={grupo.id} value={grupo.id.toString()}>
                          {grupo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fases */}
        {torneoId && (
          <Card>
            <CardHeader>
              <CardTitle>Fases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <button
                  className={`px-3 py-1 rounded border ${fase === 'grupos' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                  onClick={() => setFase('grupos')}
                >
                  Fase de Grupos
                </button>
                <button
                  className={`px-3 py-1 rounded border ${fase === 'cuartos' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                  onClick={() => setFase('cuartos')}
                >
                  Cuartos de Final
                </button>
                <button
                  className={`px-3 py-1 rounded border ${fase === 'semifinal' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                  onClick={() => setFase('semifinal')}
                >
                  Semifinal
                </button>
                <button
                  className={`px-3 py-1 rounded border ${fase === 'final' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                  onClick={() => setFase('final')}
                >
                  Final
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabla de Posiciones (only for grupos phase) */}
        {!torneoId ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Selecciona un torneo para ver las posiciones</p>
            </CardContent>
          </Card>
        ) : fase === 'grupos' && isLoadingPosiciones ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : fase === 'grupos' && tabla && sortedPosiciones.length > 0 ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Posiciones {tabla?.grupoNombre ? `- ${tabla.grupoNombre}` : ''}</CardTitle>
                  <CardDescription>PJ=Partidos Jugados, PG=Ganados, PE=Empatados, PP=Perdidos, GF=Goles a Favor, GC=Goles en Contra, GD=Diferencia de Goles, PTS=Puntos</CardDescription>
                </div>
                {estadoFaseGrupos && (
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-sm text-muted-foreground">
                      {estadoFaseGrupos.partidosJugados}/{estadoFaseGrupos.partidosTotales} partidos finalizados
                    </p>
                    <Button
                      onClick={handleGenerarLlaves}
                      disabled={!estadoFaseGrupos.puedeGenerar}
                      size="sm"
                    >
                      {estadoFaseGrupos.puedeGenerar ? 'Generar Llaves' : 'Fase de grupos en curso'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border bg-card">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Equipo</TableHead>
                      <TableHead className="w-32">Estado</TableHead>
                      <TableHead className="text-center">PJ</TableHead>
                      <TableHead className="text-center">PG</TableHead>
                      <TableHead className="text-center">PE</TableHead>
                      <TableHead className="text-center">PP</TableHead>
                      <TableHead className="text-center">GF</TableHead>
                      <TableHead className="text-center">GC</TableHead>
                      <TableHead className="text-center">GD</TableHead>
                      <TableHead className="text-center font-bold">PTS</TableHead>
                      <TableHead className="text-center">Fair Play</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPosiciones.map((posicion, index) => {
                      const clasificacionInfo = clasificacion?.find(c => c.equipoId === posicion.equipoId);
                      return (
                        <TableRow key={`${posicion.equipoId}-${index}`} className={clasificacionInfo?.clasificado ? 'bg-green-50/50 dark:bg-green-950/20' : ''}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="font-medium">{posicion.equipoNombre || 'Sin nombre'}</TableCell>
                          <TableCell>
                            {clasificacionInfo?.clasificado ? (
                              <Badge variant="default" className="bg-green-600 text-white">
                                {clasificacionInfo.razonClasificacion}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">{posicion.pj}</TableCell>
                          <TableCell className="text-center">{posicion.pg}</TableCell>
                          <TableCell className="text-center">{posicion.pe}</TableCell>
                          <TableCell className="text-center">{posicion.pp}</TableCell>
                          <TableCell className="text-center">{posicion.gf}</TableCell>
                          <TableCell className="text-center">{posicion.gc}</TableCell>
                          <TableCell className="text-center">{posicion.gd > 0 ? '+' : ''}{posicion.gd}</TableCell>
                          <TableCell className="text-center font-bold text-primary">{posicion.pts}</TableCell>
                          <TableCell className="text-center">{(posicion.fairPlay ?? 0).toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : fase === 'grupos' && (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No hay datos de posiciones disponibles</p>
            </CardContent>
          </Card>
        )}

        {/* Goleadores (solo para fútbol) */}
        {torneoId && isFutbol && (
          <Card>
            <CardHeader>
              <CardTitle>Tabla de Goleadores</CardTitle>
              <CardDescription>Top anotadores del torneo seleccionado</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingGoleadores ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : goleadores && goleadores.length > 0 ? (
                <div className="space-y-3">
                  {goleadores.slice(0, 10).map((g, idx) => (
                    <div
                      key={`${g.usuarioId}-${idx}`}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center font-semibold">{idx + 1}</span>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={g.fotoUrl ?? undefined} alt={g.nombreJugador} />
                          <AvatarFallback>{g.nombreJugador?.charAt(0) ?? 'J'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium leading-none">{g.nombreJugador}</p>
                          <p className="text-xs text-muted-foreground">{g.equipoNombre}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-base font-bold">{g.totalGoles}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aún no hay goles registrados.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Criterios de Desempate */}
        {fase === 'grupos' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle asChild>
              <span>Criterios de Desempate</span>
            </AlertTitle>
            <AlertDescription>
              1. Mayor número de puntos (PTS)
              <br />
              2. Mayor diferencia de goles (GD)
              <br />
              3. Mayor número de goles a favor (GF)
              <br />
              4. Mejor promedio de Fair Play (valor menor = mejor comportamiento)
            </AlertDescription>
          </Alert>
        )}

        {/* Knockout Phase Bracket View */}
        {fase !== 'grupos' && torneoId && (
          <>
            {!faseId ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Fase no configurada</AlertTitle>
                <AlertDescription>
                  La fase seleccionada aún no ha sido definida.
                </AlertDescription>
              </Alert>
            ) : isLoadingPartidos ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Llaves de Eliminación Directa</CardTitle>
                  <CardDescription>
                    Visualización del cuadro de eliminación directa del torneo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TournamentBracket
                    cuartos={cuartosData?.content || []}
                    semifinales={semifinalesData?.content || []}
                    final={finalData?.content || []}
                    deporteNombre={selectedTorneo?.deporteNombre || ''}
                  />
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Fórmula de Fair Play */}
        {tabla && sortedPosiciones.length > 0 && fase === 'grupos' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle asChild>
              <span>Fórmula de Juego Limpio (Fair Play)</span>
            </AlertTitle>
            <AlertDescription>
              Fair Play = Suma de Puntos Negativos / Partidos Jugados
              <br />
              <span className="text-sm">Un valor menor indica mejor comportamiento deportivo</span>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </AppLayout>
  );
}
