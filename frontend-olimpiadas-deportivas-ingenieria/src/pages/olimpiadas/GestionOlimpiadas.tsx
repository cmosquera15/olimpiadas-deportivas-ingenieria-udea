import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/Layout/AppLayout';
import { olimpiadasService, OlimpiadaCreateRequest, OlimpiadaDetailResponse, OlimpiadaUpdateRequest } from '@/services/olimpiadas.service';
import { Guard } from '@/components/ui/Guard';
import { getUserRole, hasPermission } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Pencil, Calendar, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ApiError {
  response?: { data?: { message?: string } };
}

export default function GestionOlimpiadas() {
  const role = getUserRole();
  const canCreateOrEdit = role === 'Administrador';
  const [creatingOlimpiada, setCreatingOlimpiada] = useState(false);
  const [editingOlimpiada, setEditingOlimpiada] = useState<OlimpiadaDetailResponse | null>(null);
  const currentYear = new Date().getFullYear();
  
  const [olimpiadaForm, setOlimpiadaForm] = useState({
    nombre: '',
    edicion: currentYear - 2023,
    anio: currentYear,
    activo: true,
  });

  const queryClient = useQueryClient();

  const { data: olimpiadas, isLoading } = useQuery({
    queryKey: ['olimpiadas-todas'],
    queryFn: () => olimpiadasService.getOlimpiadasTodas(),
  });

  const createOlimpiadaMutation = useMutation<OlimpiadaDetailResponse, ApiError, OlimpiadaCreateRequest>({
    mutationFn: (payload) => olimpiadasService.createOlimpiada(payload),
    onSuccess: (data) => {
      toast.success(`Olimpiada creada: ${data.torneos.length} torneos generados`);
      setCreatingOlimpiada(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['olimpiadas-todas'] });
      queryClient.invalidateQueries({ queryKey: ['olimpiadas'] });
      queryClient.invalidateQueries({ queryKey: ['torneos'] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || 'Error al crear la olimpiada';
      toast.error(msg);
    },
  });

  const updateOlimpiadaMutation = useMutation<OlimpiadaDetailResponse, ApiError, { id: number; data: OlimpiadaUpdateRequest }>({
    mutationFn: ({ id, data }) => olimpiadasService.updateOlimpiada(id, data),
    onSuccess: (data) => {
      toast.success(`Olimpiada "${data.nombre}" actualizada`);
      setEditingOlimpiada(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['olimpiadas-todas'] });
      queryClient.invalidateQueries({ queryKey: ['olimpiadas'] });
      queryClient.invalidateQueries({ queryKey: ['torneos'] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || 'Error al actualizar la olimpiada';
      toast.error(msg);
    },
  });

  const resetForm = () => {
    setOlimpiadaForm({
      nombre: '',
      edicion: currentYear - 2023,
      anio: currentYear,
      activo: true,
    });
  };

  const handleEdit = (olimpiada: OlimpiadaDetailResponse) => {
    setOlimpiadaForm({
      nombre: olimpiada.nombre,
      edicion: olimpiada.edicion,
      anio: olimpiada.anio,
      activo: olimpiada.activo,
    });
    setEditingOlimpiada(olimpiada);
  };

  const handleCloseEdit = () => {
    setEditingOlimpiada(null);
    resetForm();
  };

  const handleCloseCreate = () => {
    setCreatingOlimpiada(false);
    resetForm();
  };

  const nombreTrim = olimpiadaForm.nombre.trim();
  const nombreDuplicado = olimpiadas?.some(
    (o) =>
      o.nombre.toLowerCase() === nombreTrim.toLowerCase() &&
      (!editingOlimpiada || o.id !== editingOlimpiada.id)
  ) ?? false;

  const edicionValida = olimpiadaForm.edicion >= 1 && olimpiadaForm.edicion <= 50;
  const anioValido = olimpiadaForm.anio >= 2020 && olimpiadaForm.anio <= currentYear + 2;
  const formValido = nombreTrim.length > 0 && edicionValida && anioValido && !nombreDuplicado;

  const torneosPreview = formValido && !editingOlimpiada
    ? [
        { nombre: `Fútbol ${olimpiadaForm.anio}`, deporte: 'Fútbol' },
        { nombre: `Baloncesto ${olimpiadaForm.anio}`, deporte: 'Baloncesto' },
      ]
    : [];

  const handleSubmit = () => {
    if (!formValido) return;

    if (editingOlimpiada) {
      updateOlimpiadaMutation.mutate({
        id: editingOlimpiada.id,
        data: {
          nombre: olimpiadaForm.nombre,
          edicion: olimpiadaForm.edicion,
          anio: olimpiadaForm.anio,
          activo: olimpiadaForm.activo,
        },
      });
    } else {
      createOlimpiadaMutation.mutate({
        nombre: olimpiadaForm.nombre,
        edicion: olimpiadaForm.edicion,
        anio: olimpiadaForm.anio,
        activo: olimpiadaForm.activo,
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Olimpiadas</h1>
            <p className="text-muted-foreground">Crea y administra las olimpiadas deportivas</p>
          </div>
          {canCreateOrEdit && (
            <Button className="flex items-center gap-2" onClick={() => setCreatingOlimpiada(true)}>
              <Plus className="h-4 w-4" />
              Crear Olimpiada
            </Button>
          )}
        </div>

        {/* Create Dialog */}
  {canCreateOrEdit && (
  <Dialog open={creatingOlimpiada} onOpenChange={setCreatingOlimpiada}>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nueva Olimpiada</DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nombre</label>
                    <Input
                      value={olimpiadaForm.nombre}
                      onChange={(e) => setOlimpiadaForm((f) => ({ ...f, nombre: e.target.value }))}
                      placeholder="Ej: Olimpiadas Primavera 2025"
                      className={nombreDuplicado ? 'border-destructive' : ''}
                    />
                    {nombreDuplicado && (
                      <p className="text-xs text-destructive">Ya existe una olimpiada con este nombre</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Edición</label>
                      <Input
                        type="number"
                        value={olimpiadaForm.edicion}
                        onChange={(e) => setOlimpiadaForm((f) => ({ ...f, edicion: Number(e.target.value) }))}
                        className={!edicionValida ? 'border-destructive' : ''}
                      />
                      {!edicionValida && (
                        <p className="text-xs text-destructive">Edición debe ser &gt;= 1 y razonable</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Año</label>
                      <Input
                        type="number"
                        value={olimpiadaForm.anio}
                        onChange={(e) => setOlimpiadaForm((f) => ({ ...f, anio: Number(e.target.value) }))}
                        className={!anioValido ? 'border-destructive' : ''}
                      />
                      {!anioValido && <p className="text-xs text-destructive">Año fuera de rango permitido</p>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="activo-create"
                      checked={olimpiadaForm.activo}
                      onCheckedChange={(checked) => setOlimpiadaForm((f) => ({ ...f, activo: checked }))}
                    />
                    <Label htmlFor="activo-create">Activa</Label>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Se crearán automáticamente torneos para Fútbol y Baloncesto.
                    </p>
                    {torneosPreview.length > 0 ? (
                      <div className="rounded-md border p-3 bg-muted/40">
                        <p className="text-xs font-medium mb-2">Vista previa de torneos:</p>
                        <ul className="space-y-1 text-xs">
                          {torneosPreview.map((t) => (
                            <li key={t.deporte} className="flex items-center justify-between">
                              <span>{t.nombre}</span>
                              <Badge variant="secondary" className="text-[10px]">
                                {t.deporte}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="rounded-md border p-3 bg-muted/20 text-xs text-muted-foreground">
                        Complete los campos válidos para ver la vista previa.
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formValido ? 'Listo para crear' : 'Corrige los campos marcados para habilitar la creación'}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCloseCreate} variant="outline" className="flex-1">
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!formValido || createOlimpiadaMutation.isPending}
                      className="flex-1"
                    >
                      {createOlimpiadaMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        'Crear Olimpiada'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
  </Dialog>
  )}

        {/* Edit Dialog */}
  {canCreateOrEdit && (
  <Dialog open={!!editingOlimpiada} onOpenChange={() => handleCloseEdit()}>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Olimpiada</DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <Input
                  value={olimpiadaForm.nombre}
                  onChange={(e) => setOlimpiadaForm((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: Olimpiadas Primavera 2025"
                  className={nombreDuplicado ? 'border-destructive' : ''}
                />
                {nombreDuplicado && (
                  <p className="text-xs text-destructive">Ya existe una olimpiada con este nombre</p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Edición</label>
                  <Input
                    type="number"
                    value={olimpiadaForm.edicion}
                    onChange={(e) => setOlimpiadaForm((f) => ({ ...f, edicion: Number(e.target.value) }))}
                    className={!edicionValida ? 'border-destructive' : ''}
                  />
                  {!edicionValida && (
                    <p className="text-xs text-destructive">Edición debe ser &gt;= 1 y razonable</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Año</label>
                  <Input
                    type="number"
                    value={olimpiadaForm.anio}
                    onChange={(e) => setOlimpiadaForm((f) => ({ ...f, anio: Number(e.target.value) }))}
                    className={!anioValido ? 'border-destructive' : ''}
                  />
                  {!anioValido && <p className="text-xs text-destructive">Año fuera de rango permitido</p>}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="activo-edit"
                  checked={olimpiadaForm.activo}
                  onCheckedChange={(checked) => setOlimpiadaForm((f) => ({ ...f, activo: checked }))}
                />
                <Label htmlFor="activo-edit">Activa</Label>
              </div>
              {editingOlimpiada && (
                <div className="rounded-md border p-3 bg-muted/40">
                  <p className="text-xs font-medium mb-2">Torneos asociados:</p>
                  <ul className="space-y-1 text-xs">
                    {editingOlimpiada.torneos.map((t) => (
                      <li key={t.id} className="flex items-center justify-between">
                        <span>{t.nombre}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {t.deporteNombre}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {formValido ? 'Listo para actualizar' : 'Corrige los campos marcados para habilitar la actualización'}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCloseEdit} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!formValido || updateOlimpiadaMutation.isPending}
                  className="flex-1"
                >
                  {updateOlimpiadaMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    'Actualizar Olimpiada'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
  </Dialog>
  )}

        {/* Olimpiadas List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {olimpiadas?.map((olimpiada) => (
              <Card key={olimpiada.id} className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base sm:text-lg md:text-xl truncate">{olimpiada.nombre}</CardTitle>
                        {olimpiada.activo ? (
                          <Badge variant="default" className="text-xs">
                            Activa
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Inactiva
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          Edición {olimpiada.edicion}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {olimpiada.anio}
                        </span>
                      </CardDescription>
                    </div>
                    {canCreateOrEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(olimpiada)}
                        className="flex-shrink-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Torneos ({olimpiada.torneos.length})</p>
                    <div className="space-y-1">
                      {olimpiada.torneos.map((torneo) => (
                        <div
                          key={torneo.id}
                          className="flex items-center justify-between text-xs p-2 rounded-md bg-muted/40"
                        >
                          <span className="truncate">{torneo.nombre}</span>
                          <Badge variant="outline" className="text-[10px] ml-2">
                            {torneo.deporteNombre}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {olimpiadas && olimpiadas.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="mx-auto h-12 w-12 opacity-60" />
              <p className="mt-4 text-muted-foreground">No hay olimpiadas creadas aún</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
