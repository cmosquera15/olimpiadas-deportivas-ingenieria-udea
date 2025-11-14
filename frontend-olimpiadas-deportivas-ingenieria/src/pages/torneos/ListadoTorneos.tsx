import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/Layout/AppLayout';
import { torneosService } from '@/services/torneos.service';
import { olimpiadasService } from '@/services/olimpiadas.service';
import { useCatalogos } from '@/hooks/useCatalogos';
import { useOlimpiada } from '@/store/useOlimpiada';
import { Guard } from '@/components/ui/Guard';
import { CrearTorneoForm } from '@/components/Torneos/CrearTorneoForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function ListadoTorneos() {
  const { selectedOlimpiada, setSelectedOlimpiada } = useOlimpiada();
  const [deporteId, setDeporteId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(0);
  const navigate = useNavigate();

  const { deportes } = useCatalogos();
  
  const { data: olimpiadas, isLoading: loadingOlimpiadas } = useQuery({
    queryKey: ['olimpiadas'],
    queryFn: () => olimpiadasService.getOlimpiadas(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['torneos', { olimpiadaId: selectedOlimpiada?.id, deporteId, page }],
    queryFn: () => {
      if (import.meta.env.DEV) {
        console.log('🔍 Torneos filter:', { olimpiadaId: selectedOlimpiada?.id, deporteId, page });
      }
      return torneosService.getTorneos({ 
        olimpiadaId: selectedOlimpiada?.id, 
        deporteId, 
        page, 
        size: 12 
      });
    },
  });

  const handleClearFilters = () => {
    setSelectedOlimpiada(null);
    setDeporteId(undefined);
    setPage(0);
  };

  const hasActiveFilters = selectedOlimpiada !== null || deporteId !== undefined;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Torneos</h1>
            <p className="text-muted-foreground">Consulta y gestiona los torneos deportivos</p>
          </div>
          <div className="flex gap-2">
            <Guard permiso="Torneos_Crear">
              <Button variant="outline" onClick={() => navigate('/olimpiadas')}>
                Gestionar Olimpiadas
              </Button>
              <CrearTorneoForm />
            </Guard>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hover:bg-transparent"
                  onClick={handleClearFilters}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Olimpiada</label>
                <Select
                  value={selectedOlimpiada?.id.toString() ?? 'all'}
                  onValueChange={(value) => {
                    const olimpiada = value === 'all' 
                      ? null 
                      : olimpiadas?.find(o => o.id === Number(value)) ?? null;
                    setSelectedOlimpiada(olimpiada);
                    setPage(0);
                  }}
                  disabled={loadingOlimpiadas}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las olimpiadas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las olimpiadas</SelectItem>
                    {olimpiadas?.map((olimpiada) => (
                      <SelectItem key={olimpiada.id} value={olimpiada.id.toString()}>
                        {olimpiada.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Deporte</label>
                <Select
                  value={deporteId?.toString() ?? 'all'}
                  onValueChange={(value) => {
                    setDeporteId(value === 'all' ? undefined : Number(value));
                    setPage(0);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los deportes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los deportes</SelectItem>
                    {deportes.data?.map((deporte) => (
                      <SelectItem key={deporte.id} value={deporte.id.toString()}>
                        {deporte.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Torneos Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data?.content.map((torneo) => (
              <Link key={torneo.id} to={`/torneos/${torneo.id}`} className="block h-full">
                <Card className="group h-full min-h-[240px] flex flex-col transition-all hover:shadow-lg hover:border-primary/50">
                  <CardHeader className="flex-1 space-y-4">
                    <div className="flex items-start gap-4">
                      <img src="/Logo+Olimpiadas.png" alt="Logo" className="h-12 w-12 flex-shrink-0 rounded-md border" />
                      <div className="flex-1 min-w-0 space-y-1">
                        <Badge variant="secondary" className="mb-1 inline-block max-w-full truncate" title={torneo.olimpiadaNombre}>{torneo.olimpiadaNombre}</Badge>
                        <CardTitle className="text-lg leading-snug line-clamp-2 break-words hyphens-auto">
                          {torneo.nombre}
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground max-w-full truncate" title={torneo.deporteNombre}>
                          {torneo.deporteNombre}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {data && data.content.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <img src="/Logo+Olimpiadas.png" alt="Logo" className="mx-auto h-12 w-12 opacity-60" />
              <p className="mt-4 text-muted-foreground">No se encontraron torneos</p>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
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
