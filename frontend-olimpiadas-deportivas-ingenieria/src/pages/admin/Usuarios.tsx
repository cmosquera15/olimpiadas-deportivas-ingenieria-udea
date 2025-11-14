import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/Layout/AppLayout';
import { usuariosService, UsuarioListDTO, UsuarioCreateRequest, UsuarioUpdatePayload } from '@/services/usuarios.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, Loader2, UserX } from 'lucide-react';
import { PageResponse, ProgramaAcademico, Genero, EPS, TipoVinculo, Usuario } from '@/types';
import { catalogoService } from '@/services/catalogo.service';

interface UpdateRolMutation {
  id: number;
  rol: string;
}

interface UpdateHabilitadoMutation {
  id: number;
  habilitado: boolean;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export default function Usuarios() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ nombre?: string; documento?: string; id_programa_academico?: number; id_genero?: number; id_eps?: number; id_tipo_vinculo?: number; fotoUrl?: string }>({});
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PageResponse<UsuarioListDTO>>({
    queryKey: ['usuarios-admin', { search, page }],
    queryFn: () => usuariosService.getUsuarios({ search, page, size: 10 }),
  });

  // Catalogos para creación
  const { data: programas } = useQuery({ queryKey: ['programas'], queryFn: catalogoService.getProgramas });
  const { data: generos } = useQuery({ queryKey: ['generos'], queryFn: catalogoService.getGeneros });
  const { data: epsList } = useQuery({ queryKey: ['eps'], queryFn: catalogoService.getEPS });
  const { data: tiposVinculo } = useQuery({ queryKey: ['tipos-vinculo'], queryFn: catalogoService.getTiposVinculo });

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<UsuarioCreateRequest>({ nombre: '', correo: '', rolNombre: 'JUGADOR' });

  // Load full user details when editing to prefill fields from DB
  const { data: detalle, isLoading: detalleLoading } = useQuery<Usuario>({
    queryKey: ['usuario-admin-detalle', editUserId],
    queryFn: () => usuariosService.getUsuarioCompleto(editUserId!),
    enabled: !!editUserId && editOpen,
  });

  useEffect(() => {
    if (detalle) {
      setEditForm({
        nombre: detalle.nombre || undefined,
        documento: detalle.documento || undefined,
        id_programa_academico: detalle.programaAcademico?.id,
        id_genero: detalle.genero?.id,
        id_eps: detalle.eps?.id,
        id_tipo_vinculo: detalle.tipoVinculo?.id,
        fotoUrl: detalle.fotoUrl || undefined,
      });
    }
  }, [detalle]);

  if (import.meta.env.DEV) {
    console.log('🔍 Usuarios data:', data);
  }

  const updateRolMutation = useMutation<UsuarioListDTO, ApiError, UpdateRolMutation>({
    mutationFn: ({ id, rol }) => usuariosService.updateRol(id, rol),
    onSuccess: () => {
      toast.success('Rol actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['usuarios-admin'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al actualizar el rol');
    },
  });

  const createUsuarioMutation = useMutation<UsuarioListDTO, ApiError, UsuarioCreateRequest>({
    mutationFn: (payload) => usuariosService.createUsuario(payload),
    onSuccess: () => {
      toast.success('Usuario creado');
      setCreating(false);
      setForm({ nombre: '', correo: '', rolNombre: 'JUGADOR' });
      queryClient.invalidateQueries({ queryKey: ['usuarios-admin'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al crear usuario');
    }
  });
  const updateHabilitadoMutation = useMutation<UsuarioListDTO, ApiError, UpdateHabilitadoMutation>({
    mutationFn: ({ id, habilitado }) => usuariosService.updateHabilitado(id, habilitado),
    onSuccess: () => {
      toast.success('Estado actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['usuarios-admin'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al actualizar el estado');
    },
  });

  const roles = ['ADMINISTRADOR', 'ARBITRO', 'JUGADOR'];

  const updatePerfilAdminMutation = useMutation({
    mutationFn: async () => {
      if (editUserId == null) return Promise.reject(new Error('Usuario no seleccionado'));
      // Construir payload sólo con campos definidos
      const payload: UsuarioUpdatePayload = {};
      if (editForm.nombre) payload.nombre = editForm.nombre;
      // Documento: sólo permitir enviarlo si no existe aún en backend
      if (!detalle?.documento && editForm.documento) payload.documento = editForm.documento;
      if (editForm.id_programa_academico) payload.id_programa_academico = editForm.id_programa_academico;
      if (editForm.id_genero) payload.id_genero = editForm.id_genero;
      if (editForm.id_eps) payload.id_eps = editForm.id_eps;
      if (editForm.id_tipo_vinculo) payload.id_tipo_vinculo = editForm.id_tipo_vinculo;
      if (editForm.fotoUrl) payload.fotoUrl = editForm.fotoUrl;
      return usuariosService.updatePerfilAdmin(editUserId, payload);
    },
    onSuccess: () => {
      toast.success('Perfil actualizado');
      setEditOpen(false);
      setEditUserId(null);
      setEditForm({});
      queryClient.invalidateQueries({ queryKey: ['usuarios-admin'] });
    },
    onError: (error: ApiError | unknown) => {
      const message = (error as ApiError)?.response?.data?.message || 'Error al actualizar el perfil';
      toast.error(message);
    }
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">Administra roles y permisos de usuarios</p>
          </div>
          <Button variant="secondary" onClick={() => setCreating(v => !v)}>
            {creating ? 'Cancelar' : 'Crear Usuario'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Usuarios
            </CardTitle>
            <CardDescription>Filtra por nombre o correo</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {/* Botón de crear usuario movido al header principal */}
            {creating && (
              <div className="mt-6 space-y-4 border-t pt-4">
                <h3 className="font-semibold text-sm">Nuevo Usuario</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Nombre</label>
                    <Input value={form.nombre} onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Correo</label>
                    <Input type="email" value={form.correo} onChange={(e) => setForm(f => ({ ...f, correo: e.target.value }))} placeholder="correo@udea.edu.co" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Documento</label>
                    <Input value={form.documento || ''} onChange={(e) => setForm(f => ({ ...f, documento: e.target.value || undefined }))} placeholder="Documento" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Rol</label>
                    <Select value={form.rolNombre} onValueChange={(v) => setForm(f => ({ ...f, rolNombre: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Programa Académico</label>
                    <Select value={form.id_programa_academico?.toString() || 'none'} onValueChange={(v) => setForm(f => ({ ...f, id_programa_academico: v === 'none' ? undefined : Number(v) }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Opcional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">(Sin asignar)</SelectItem>
                        {programas?.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Género</label>
                    <Select value={form.id_genero?.toString() || 'none'} onValueChange={(v) => setForm(f => ({ ...f, id_genero: v === 'none' ? undefined : Number(v) }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Opcional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">(Sin asignar)</SelectItem>
                        {generos?.map(g => <SelectItem key={g.id} value={g.id.toString()}>{g.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">EPS</label>
                    <Select value={form.id_eps?.toString() || 'none'} onValueChange={(v) => setForm(f => ({ ...f, id_eps: v === 'none' ? undefined : Number(v) }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Opcional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">(Sin asignar)</SelectItem>
                        {epsList?.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Tipo Vínculo</label>
                    <Select value={form.id_tipo_vinculo?.toString() || 'none'} onValueChange={(v) => setForm(f => ({ ...f, id_tipo_vinculo: v === 'none' ? undefined : Number(v) }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Opcional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">(Sin asignar)</SelectItem>
                        {tiposVinculo?.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  disabled={!form.nombre || !form.correo || createUsuarioMutation.isPending}
                  onClick={() => createUsuarioMutation.mutate(form)}
                >
                  {createUsuarioMutation.isPending ? 'Creando...' : 'Registrar Usuario'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !data?.content || data.content.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <UserX className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No se encontraron usuarios</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Usuarios</CardTitle>
              <CardDescription>Lista de usuarios registrados en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.content.map((usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell className="font-medium">{usuario.nombre}</TableCell>
                        <TableCell>{usuario.correo}</TableCell>
                        <TableCell>
                          <Select
                            value={usuario.rol}
                            onValueChange={(value) =>
                              updateRolMutation.mutate({ id: usuario.id!, rol: value })
                            }
                          >
                            <SelectTrigger className="w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map((rol) => (
                                <SelectItem key={rol} value={rol}>
                                  {rol}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {usuario.habilitado ? (
                            <Badge className="bg-success">Habilitado</Badge>
                          ) : (
                            <Badge variant="destructive">Deshabilitado</Badge>
                          )}
                        </TableCell>
                        <TableCell className="space-y-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                {usuario.habilitado ? 'Deshabilitar' : 'Habilitar'}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {usuario.habilitado ? 'Deshabilitar' : 'Habilitar'} Usuario
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  ¿Estás seguro de que deseas{' '}
                                  {usuario.habilitado ? 'deshabilitar' : 'habilitar'} a{' '}
                                  {usuario.nombre}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    updateHabilitadoMutation.mutate({
                                      id: usuario.id!,
                                      habilitado: !usuario.habilitado,
                                    })
                                  }
                                >
                                  Confirmar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <Dialog open={editOpen && editUserId === usuario.id} onOpenChange={(o) => {
                            if (!o) {
                              setEditOpen(false);
                              setEditUserId(null);
                              setEditForm({});
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setEditUserId(usuario.id!);
                                  setEditOpen(true);
                                  // Pre-cargar campos conocidos (otros quedan vacíos)
                                  setEditForm({ nombre: usuario.nombre || undefined });
                                }}
                              >
                                Editar Perfil
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[520px]">
                              <DialogHeader>
                                <DialogTitle>Editar Perfil de {usuario.nombre}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-2">
                                {detalleLoading && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Cargando información del usuario...
                                  </div>
                                )}
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div className="space-y-2">
                                    <label className="text-xs font-medium">Nombre</label>
                                    <Input value={editForm.nombre || ''} onChange={(e) => setEditForm(f => ({ ...f, nombre: e.target.value || undefined }))} placeholder="Nombre" />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-medium">Documento</label>
                                    <Input
                                      value={editForm.documento || ''}
                                      onChange={(e) => setEditForm(f => ({ ...f, documento: e.target.value || undefined }))}
                                      placeholder={detalle?.documento ? 'Documento ya registrado' : 'Documento'}
                                      disabled={!!detalle?.documento}
                                    />
                                    {detalle?.documento && (
                                      <p className="text-[11px] text-muted-foreground">Campo bloqueado: el documento ya existe y no puede modificarse.</p>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-medium">Programa Académico</label>
                                    <Select value={editForm.id_programa_academico?.toString() || 'none'} onValueChange={(v) => setEditForm(f => ({ ...f, id_programa_academico: v === 'none' ? undefined : Number(v) }))}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="(Sin cambios)" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">(Sin cambios)</SelectItem>
                                        {programas?.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-medium">Género</label>
                                    <Select value={editForm.id_genero?.toString() || 'none'} onValueChange={(v) => setEditForm(f => ({ ...f, id_genero: v === 'none' ? undefined : Number(v) }))}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="(Sin cambios)" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">(Sin cambios)</SelectItem>
                                        {generos?.map(g => <SelectItem key={g.id} value={g.id.toString()}>{g.nombre}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-medium">EPS</label>
                                    <Select value={editForm.id_eps?.toString() || 'none'} onValueChange={(v) => setEditForm(f => ({ ...f, id_eps: v === 'none' ? undefined : Number(v) }))}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="(Sin cambios)" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">(Sin cambios)</SelectItem>
                                        {epsList?.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.nombre}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-medium">Tipo Vínculo</label>
                                    <Select value={editForm.id_tipo_vinculo?.toString() || 'none'} onValueChange={(v) => setEditForm(f => ({ ...f, id_tipo_vinculo: v === 'none' ? undefined : Number(v) }))}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="(Sin cambios)" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">(Sin cambios)</SelectItem>
                                        {tiposVinculo?.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.nombre}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-medium">Foto URL</label>
                                    <Input value={editForm.fotoUrl || ''} onChange={(e) => setEditForm(f => ({ ...f, fotoUrl: e.target.value || undefined }))} placeholder="https://..." />
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                  <Button variant="outline" onClick={() => { setEditOpen(false); setEditUserId(null); setEditForm({}); }}>Cancelar</Button>
                                  <Button disabled={updatePerfilAdminMutation.isPending || detalleLoading} onClick={() => updatePerfilAdminMutation.mutate()}>
                                    {updatePerfilAdminMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">Sólo se envían los campos modificados. Documento no se puede cambiar si ya existe.</p>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

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
