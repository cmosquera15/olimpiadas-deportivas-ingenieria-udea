import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/Layout/AppLayout';
import { equiposService } from '@/services/equipos.service';
import { torneosService } from '@/services/torneos.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Users, Loader2, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { catalogoService } from '@/services/catalogo.service';
import type { Grupo, ProgramaAcademico } from '@/types';
import { toast } from 'sonner';
import type { EquipoCreateRequest } from '@/services/equipos.service';
import { hasPermission } from '@/lib/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function ListadoEquipos() {
  const [torneoId, setTorneoId] = useState<number | undefined>(undefined);
  const [creating, setCreating] = useState(false);
  const canCreateEquipo = hasPermission('Equipos_Crear');
  const queryClient = useQueryClient();

  const [createForm, setCreateForm] = useState<{
    nombre: string;
    id_torneo?: number;
    id_grupo?: number;
    id_programa_academico_1?: number;
    id_programa_academico_2?: number;
    id_usuario_capitan?: number;
  }>({ nombre: '', id_torneo: undefined, id_grupo: undefined, id_programa_academico_1: undefined, id_programa_academico_2: undefined, id_usuario_capitan: undefined });

  const { data: torneosPage } = useQuery({
    queryKey: ['torneos'],
    queryFn: () => torneosService.getTorneos({ size: 100 }),
  });
  
  const { data: equipos, isLoading } = useQuery({
    queryKey: ['equipos', torneoId],
    queryFn: () => equiposService.getEquipos(torneoId),
    enabled: true,
  });

  const torneos = torneosPage?.content;
  const selectedTorneo = torneos?.find(t => t.id === torneoId);

  // Prefill torneo in create form when filter changes (only if not set yet)
  useEffect(() => {
    if (torneoId && !createForm.id_torneo) {
      setCreateForm((f) => ({ ...f, id_torneo: torneoId }));
    }
  }, [torneoId, createForm.id_torneo]);

  const { data: programas } = useQuery<ProgramaAcademico[]>({
    queryKey: ['programas'],
    queryFn: catalogoService.getProgramas,
  });

  const { data: grupos } = useQuery<Grupo[]>({
    queryKey: ['grupos', createForm.id_torneo],
    queryFn: () => catalogoService.getGrupos(createForm.id_torneo!),
    enabled: !!createForm.id_torneo,
  });

  interface ApiError {
    response?: { data?: { message?: string } };
  }
  const createEquipoMutation = useMutation<unknown, ApiError, EquipoCreateRequest>({
    mutationFn: (payload) => equiposService.createEquipo(payload),
    onSuccess: () => {
      toast.success('Equipo creado exitosamente');
      setCreating(false);
      setCreateForm({ nombre: '', id_torneo: torneoId, id_grupo: undefined, id_programa_academico_1: undefined, id_programa_academico_2: undefined, id_usuario_capitan: undefined });
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || 'Error al crear el equipo';
      toast.error(msg);
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Equipos</h1>
            <p className="text-muted-foreground">Consulta y gestiona los equipos</p>
          </div>
          {canCreateEquipo && (
            <Dialog open={creating} onOpenChange={setCreating}>
              <DialogTrigger asChild>
                <Button variant="secondary">Nuevo equipo</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                  <DialogTitle>Crear equipo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nombre del equipo</label>
                      <Input
                        value={createForm.nombre}
                        onChange={(e) => setCreateForm((f) => ({ ...f, nombre: e.target.value }))}
                        placeholder="Ingresa el nombre"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Torneo</label>
                      <Select
                        value={createForm.id_torneo?.toString() || (torneoId ? torneoId.toString() : 'none')}
                        onValueChange={(v) =>
                          setCreateForm((f) => ({
                            ...f,
                            id_torneo: v === 'none' ? undefined : Number(v),
                            id_grupo: undefined,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un torneo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">(Sin seleccionar)</SelectItem>
                          {torneos?.map((t) => (
                            <SelectItem key={t.id} value={t.id.toString()}>
                              {t.nombre} - {t.olimpiadaNombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Grupo</label>
                      <Select
                        value={createForm.id_grupo?.toString() || 'none'}
                        onValueChange={(v) =>
                          setCreateForm((f) => ({ ...f, id_grupo: v === 'none' ? undefined : Number(v) }))
                        }
                        disabled={!createForm.id_torneo}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={createForm.id_torneo ? 'Selecciona un grupo' : 'Selecciona un torneo primero'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">(Sin seleccionar)</SelectItem>
                          {grupos?.map((g) => (
                            <SelectItem key={g.id} value={g.id.toString()}>
                              {g.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Programa Académico 1</label>
                      <Select
                        value={createForm.id_programa_academico_1?.toString() || 'none'}
                        onValueChange={(v) =>
                          setCreateForm((f) => ({
                            ...f,
                            id_programa_academico_1: v === 'none' ? undefined : Number(v),
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el programa principal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">(Sin seleccionar)</SelectItem>
                          {programas?.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()}>
                              {p.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Programa Académico 2 (opcional)</label>
                      <Select
                        value={createForm.id_programa_academico_2?.toString() || 'none'}
                        onValueChange={(v) =>
                          setCreateForm((f) => ({
                            ...f,
                            id_programa_academico_2: v === 'none' ? undefined : Number(v),
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Opcional" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">(Sin seleccionar)</SelectItem>
                          {programas?.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()}>
                              {p.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => {
                        if (!createForm.nombre || !createForm.id_torneo || !createForm.id_grupo || !createForm.id_programa_academico_1) return;
                        const payload: EquipoCreateRequest = {
                          nombre: createForm.nombre,
                          id_torneo: createForm.id_torneo,
                          id_grupo: createForm.id_grupo,
                          id_programa_academico_1: createForm.id_programa_academico_1,
                          ...(createForm.id_programa_academico_2 ? { id_programa_academico_2: createForm.id_programa_academico_2 } : {}),
                          ...(createForm.id_usuario_capitan ? { id_usuario_capitan: createForm.id_usuario_capitan } : {}),
                        };
                        createEquipoMutation.mutate(payload, {
                          onSuccess: () => setCreating(false),
                        });
                      }}
                      disabled={
                        !createForm.nombre ||
                        !createForm.id_torneo ||
                        !createForm.id_grupo ||
                        !createForm.id_programa_academico_1 ||
                        createEquipoMutation.isPending
                      }
                    >
                      {createEquipoMutation.isPending ? 'Creando...' : 'Crear equipo'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Torneo</label>
                <Select
                  value={torneoId === undefined ? 'all' : torneoId.toString()}
                  onValueChange={(value) => {
                    setTorneoId(value === 'all' ? undefined : Number(value));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un torneo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los torneos</SelectItem>
                    {torneos?.map((torneo) => (
                      <SelectItem key={torneo.id} value={torneo.id.toString()}>
                        {torneo.nombre} - {torneo.olimpiadaNombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-none">
                <Button
                  variant="outline"
                  className="hover:bg-transparent"
                  onClick={() => {
                    setTorneoId(undefined);
                  }}
                >
                  Limpiar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal de creación movido al header de Filtros para replicar UX de Partidos */}

        {selectedTorneo && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-base py-1 px-3">
              {selectedTorneo.nombre}
            </Badge>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {equipos?.map((equipo) => (
              <Link key={equipo.id} to={`/equipos/${equipo.id}`} className="group">
                <Card className="relative h-full transition-all duration-300 hover:shadow-xl hover:border-primary/50 hover:-translate-y-1 overflow-hidden">
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Decorative corner accent */}
                  <div className="absolute right-0 top-0 h-20 w-20 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
                  
                  <CardHeader className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 ring-2 ring-primary/20 ring-offset-2 ring-offset-background group-hover:scale-110 transition-transform duration-300">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {equipo.integrantesCount}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-bold leading-tight min-h-[3rem] group-hover:text-primary transition-colors">{equipo.nombre}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Ver Detalles →
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {equipos && equipos.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                {torneoId ? 'No se encontraron equipos para este torneo' : 'No se encontraron equipos'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
