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
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Info } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PageResponse, TorneoListDTO, TablaPosiciones, EquipoPosicionDTO, Partido } from '@/types';

export default function TablaPosiciones() {
  const [searchParams, setSearchParams] = useSearchParams();
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

  const { data: partidosData, isLoading: isLoadingPartidos } = useQuery<PageResponse<Partido>>({
    queryKey: ['partidos', torneoId, faseId],
    queryFn: () => partidosService.getPartidos({ torneoId: torneoId!, faseId, size: 50 }),
    enabled: !!torneoId && fase !== 'grupos' && !!faseId,
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

  return (
    <AppLayout>
      <div>
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selecciona un Torneo</CardTitle>
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

        {/* Criterios de Desempate */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Criterios de Desempate</AlertTitle>
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

        {/* Knockout Phase Matches View */}
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
            ) : partidosData && partidosData.content.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Partidos de {fase === 'cuartos' ? 'Cuartos de Final' : fase === 'semifinal' ? 'Semifinal' : 'Final'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {partidosData.content.map((partido) => (
                      <div key={partido.id} className="rounded-lg border p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <div className="text-right">
                            <p className="font-semibold text-lg">{partido.equipoLocal?.nombre || 'Por definir'}</p>
                            {partido.puntosLocal !== null && partido.puntosLocal !== undefined && (
                              <Badge variant="outline" className="mt-1">{partido.puntosLocal} pts</Badge>
                            )}
                          </div>
                          <div className="text-center space-y-2">
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(partido.fecha), 'PPP', { locale: es })}
                            </p>
                            <p className="text-sm font-medium">{partido.hora}</p>
                            <p className="text-xs text-muted-foreground">{partido.lugar?.nombre}</p>
                            {partido.puntosLocal !== null && partido.puntosLocal !== undefined && 
                             partido.puntosVisitante !== null && partido.puntosVisitante !== undefined && (
                              <div className="font-bold text-xl">
                                {partido.puntosLocal} - {partido.puntosVisitante}
                              </div>
                            )}
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-lg">{partido.equipoVisitante?.nombre || 'Por definir'}</p>
                            {partido.puntosVisitante !== null && partido.puntosVisitante !== undefined && (
                              <Badge variant="outline" className="mt-1">{partido.puntosVisitante} pts</Badge>
                            )}
                          </div>
                        </div>
                        {partido.observaciones && (
                          <p className="mt-2 text-sm text-muted-foreground italic">{partido.observaciones}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">No hay partidos programados para esta fase</p>
                </CardContent>
              </Card>
            )}
          </>
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
              <CardTitle>Posiciones {tabla?.grupoNombre ? `- ${tabla.grupoNombre}` : ''}</CardTitle>
              <CardDescription>PJ=Partidos Jugados, PG=Ganados, PE=Empatados, PP=Perdidos, GF=Goles a Favor, GC=Goles en Contra, GD=Diferencia de Goles, PTS=Puntos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Equipo</TableHead>
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
                    {sortedPosiciones.map((posicion, index) => (
                      <TableRow key={`${posicion.equipoId}-${index}`}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-medium">{posicion.equipoNombre || 'Sin nombre'}</TableCell>
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
                    ))}
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

        {/* Fórmula de Fair Play */}
        {tabla && sortedPosiciones.length > 0 && fase === 'grupos' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Fórmula de Juego Limpio (Fair Play)</AlertTitle>
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
