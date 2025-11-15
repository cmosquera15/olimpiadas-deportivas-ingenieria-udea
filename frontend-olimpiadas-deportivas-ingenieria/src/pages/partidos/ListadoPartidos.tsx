import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/Layout/AppLayout';
import { partidosService } from '@/services/partidos.service';
import { useCatalogos } from '@/hooks/useCatalogos';
import { formatDateTime } from '@/lib/date';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, User, Loader2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Guard } from '@/components/ui/Guard';
import { torneosService } from '@/services/torneos.service';
import { CrearPartidoForm } from '@/components/Partidos/CrearPartidoForm';
import { Input } from '@/components/ui/input';

export default function ListadoPartidos() {
  const [faseId, setFaseId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(0);

  const { fases } = useCatalogos();
  const queryClient = useQueryClient();
  const [openCrear, setOpenCrear] = useState(false);
  const [torneoIdCrear, setTorneoIdCrear] = useState<number | undefined>(undefined);
  const { data: torneosSelect } = useQuery({
    queryKey: ['torneos-select'],
    queryFn: () => torneosService.getTorneos({ page: 0, size: 100 }),
  });
  const torneoSeleccionado = torneosSelect?.content.find(t => t.id === torneoIdCrear);

  const { data, isLoading, error } = useQuery({
    queryKey: ['partidos', { faseId, page }],
    queryFn: () => {
      if (import.meta.env.DEV) {
        console.log('🔍 Fetching partidos with:', { faseId, page, size: 10 });
      }
      return partidosService.getPartidos({ faseId, page, size: 10 });
    },
  });

  useEffect(() => {
    console.log('🎯 Data received:', { 
      hasData: !!data, 
      contentLength: data?.content?.length,
      totalElements: data?.totalElements,
      isLoading,
      error,
      firstMatch: data?.content?.[0]
    });
  }, [data, isLoading, error]);

  const limpiarFiltros = () => {
    setFaseId(undefined);
    setPage(0);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Partidos</h1>
            <p className="text-muted-foreground">Consulta los partidos programados</p>
          </div>
          <Guard permiso="Partidos_Crear">
            <Dialog open={openCrear} onOpenChange={setOpenCrear}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Crear Partido
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[640px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Crear Partido</DialogTitle>
                </DialogHeader>
                {/* Scrollable body to avoid cutting off the form on smaller screens */}
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Torneo</label>
                    <Select
                      value={torneoIdCrear?.toString() || 'none'}
                      onValueChange={(v) => setTorneoIdCrear(v === 'none' ? undefined : Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar torneo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">(Sin seleccionar)</SelectItem>
                        {torneosSelect?.content.map(t => (
                          <SelectItem key={t.id} value={t.id.toString()}>
                            {t.nombre} · {t.olimpiadaNombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {torneoSeleccionado && (
                    <div className="rounded-md bg-muted/40 p-2 text-xs space-y-1">
                      <p><span className="font-semibold">Olimpiada:</span> {torneoSeleccionado.olimpiadaNombre}</p>
                      <p><span className="font-semibold">Torneo:</span> {torneoSeleccionado.nombre}</p>
                    </div>
                  )}
                  {torneoIdCrear ? (
                    <CrearPartidoForm
                      torneoId={torneoIdCrear}
                      onCreated={() => {
                        queryClient.invalidateQueries({ queryKey: ['partidos'] });
                        setOpenCrear(false);
                      }}
                    />
                  ) : (
                    <div className="text-xs text-muted-foreground">Selecciona un torneo para habilitar el formulario.</div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </Guard>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Filtros</CardTitle>
            <Button variant="outline" size="sm" className="hover:bg-transparent" onClick={limpiarFiltros}>
              Limpiar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Fase</label>
                <Select
                  value={faseId !== undefined ? String(faseId) : undefined}
                  onValueChange={(value) => {
                    // value siempre viene con string válido de un item; si limpiamos, usamos undefined
                    setFaseId(value ? Number(value) : undefined);
                    setPage(0);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las fases" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* ¡OJO! No agregar un <SelectItem value="">. Solo items válidos. */}
                    {fases.data?.map((fase) =>
                      fase?.id != null ? (
                        <SelectItem key={fase.id} value={String(fase.id)}>
                          {fase.nombre}
                        </SelectItem>
                      ) : null
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listado de partidos */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : data && data.content.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.content.map((partido) => (
              <Link key={partido.id} to={`/partidos/${partido.id}`} className="block h-full group">
                <Card className="relative h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:border-primary/50 hover:-translate-y-1 overflow-hidden">
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <CardHeader className="pb-3 relative z-10">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg font-bold line-clamp-2 break-words hyphens-auto group-hover:text-primary transition-colors">{partido.torneo.nombre}</CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="font-normal text-xs">
                            {partido.fase?.nombre}
                          </Badge>
                          {partido.grupo && (
                            <Badge variant="outline" className="font-normal text-xs">
                              {partido.grupo.nombre}
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={
                          partido.estado === 'TERMINADO' ? 'default' :
                          partido.estado === 'APLAZADO' ? 'destructive' : 
                          'secondary'
                        }
                        className="shrink-0"
                      >
                        {partido.estado === 'TERMINADO' ? '✅ Terminado' :
                         partido.estado === 'APLAZADO' ? '⏸️ Aplazado' :
                         '📅 Programado'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 relative z-10">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{formatDateTime(new Date(partido.fecha + 'T' + partido.hora))}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10">
                          <MapPin className="h-4 w-4 text-secondary" />
                        </div>
                        <span>{partido.lugar.nombre}</span>
                      </div>
                      {partido.arbitro && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
                            <User className="h-4 w-4 text-accent" />
                          </div>
                          <span>{partido.arbitro.nombre}</span>
                        </div>
                      )}
                    </div>

                    {partido.equipoLocal && partido.equipoVisitante && (
                      <div className="flex items-center justify-between border-t pt-4">
                        <div className="flex-1 text-center">
                          <div className="font-semibold text-base mb-1">{partido.equipoLocal.nombre}</div>
                          {partido.equipoLocal.puntos !== null ? (
                            <div className="text-3xl font-bold text-primary">{partido.equipoLocal.puntos}</div>
                          ) : (
                            <div className="text-2xl text-muted-foreground">-</div>
                          )}
                        </div>
                        <div className="px-6 text-xl font-semibold text-muted-foreground">vs</div>
                        <div className="flex-1 text-center">
                          <div className="font-semibold text-base mb-1">{partido.equipoVisitante.nombre}</div>
                          {partido.equipoVisitante.puntos !== null ? (
                            <div className="text-3xl font-bold text-primary">{partido.equipoVisitante.puntos}</div>
                          ) : (
                            <div className="text-2xl text-muted-foreground">-</div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No se encontraron partidos</p>
            </CardContent>
          </Card>
        )}

        {/* Paginación */}
        {data && data.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
              Anterior
            </Button>
            <span className="flex items-center px-4">
              Página {page + 1} de {data.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= data.totalPages - 1}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
