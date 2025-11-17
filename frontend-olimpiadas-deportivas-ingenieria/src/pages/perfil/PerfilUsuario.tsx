import React from 'react';
import { useAuth } from '@/store/useAuth';
import { usuariosService, UsuarioUpdatePayload } from '@/services/usuarios.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useCatalogos } from '@/hooks/useCatalogos';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AppLayout } from '@/components/Layout/AppLayout';
import { useNavigate } from 'react-router-dom';

export function PerfilUsuario() {
  // Extend Auth store type locally without using any
  const { user, setAuth, token, profileComplete } = useAuth();
  const { toast } = useToast();
  const { programas, generos, eps, tiposVinculo } = useCatalogos();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Fetch full usuario from backend for richer profile details
  const { data: perfilCompleto } = useQuery({
    queryKey: ['perfil-completo', user?.id],
    queryFn: () => usuariosService.getUsuarioCompleto(user!.id!),
    enabled: !!user?.id,
  });
  const [form, setForm] = React.useState<UsuarioUpdatePayload>(() => ({
    nombre: user?.nombre ?? '',
    documento: undefined,
    id_programa_academico: user?.programaAcademico?.id,
    id_genero: user?.genero?.id,
    id_eps: user?.eps?.id,
    id_tipo_vinculo: user?.tipoVinculo?.id,
    fotoUrl: user?.fotoUrl ?? '',
  }));

  React.useEffect(() => {
    if (!perfilCompleto) return;
    setForm({
      nombre: perfilCompleto.nombre ?? '',
      documento: perfilCompleto.documento,
      id_programa_academico: perfilCompleto.programaAcademico?.id,
      id_genero: perfilCompleto.genero?.id,
      id_eps: perfilCompleto.eps?.id,
      id_tipo_vinculo: perfilCompleto.tipoVinculo?.id,
      fotoUrl: perfilCompleto.fotoUrl ?? user?.fotoUrl ?? '',
    });
  }, [perfilCompleto, user?.fotoUrl]);

  const mutation = useMutation({
    mutationFn: (payload: UsuarioUpdatePayload) => usuariosService.updatePerfilSelf(payload),
    onSuccess: (updated) => {
      toast({ title: 'Perfil actualizado' });
      // Actualizar auth store (mantener token y completo)
      // Mantener token actual
      setAuth(token, {
        id: updated.id,
        nombre: updated.nombre,
        correo: updated.correo,
        fotoUrl: updated.fotoUrl,
      }, profileComplete);

      // Refrescar datos detallados del perfil en caché y en el formulario
      if (updated?.id) {
        queryClient.invalidateQueries({ queryKey: ['perfil-completo', updated.id] });
      }
      setForm({
        nombre: updated.nombre ?? '',
        documento: updated.documento,
        id_programa_academico: updated.programaAcademico?.id,
        id_genero: updated.genero?.id,
        id_eps: updated.eps?.id,
        id_tipo_vinculo: updated.tipoVinculo?.id,
        fotoUrl: updated.fotoUrl ?? '',
      });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message = axiosErr?.response?.data?.message || 'No se pudo actualizar';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    },
  });

  const handleChange = (e: { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelect = (name: keyof UsuarioUpdatePayload, value: string) => {
    setForm(prev => ({ ...prev, [name]: value === 'none' ? undefined : Number(value) }));
  };

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  if (!user) return <div className="text-sm text-muted-foreground">No autenticado</div>;

  return (
    <AppLayout>
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>← Volver</Button>
      </div>
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-2 ring-primary/50 ring-offset-2 ring-offset-background">
                <AvatarImage
                  src={form.fotoUrl || user?.fotoUrl || undefined}
                  alt={user?.nombre || user?.correo || 'Usuario'}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  className="object-cover"
                  onLoad={() => console.log('✅ Foto perfil cargada')}
                  onError={(e) => console.error('❌ Error cargando foto perfil', e)}
                />
                <AvatarFallback className="text-xs font-medium bg-primary text-primary-foreground">
                  {(user?.nombre || user?.correo || 'U').slice(0,2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Mi Perfil</CardTitle>
              <CardDescription className="mt-1">Actualiza tu información personal y académica.</CardDescription>
              {user?.correo && <p className="mt-2 text-xs text-muted-foreground">Correo: {user.correo}</p>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
            <p>La imagen se actualiza al guardar. Usa una URL pública.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="perfil-nombre" className="text-xs font-medium">Nombre</label>
                <Input id="perfil-nombre" name="nombre" value={form.nombre || ''} onChange={handleChange} maxLength={100} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Documento {user?.documento ? '(no editable)' : '(si no existe)'} </label>
                <Input
                  name="documento"
                  disabled={!!(perfilCompleto?.documento || user?.documento)}
                  value={perfilCompleto?.documento || user?.documento || form.documento || ''}
                  onChange={handleChange}
                  placeholder={user?.documento ? 'Ya registrado' : 'Ingresa tu documento'}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Programa Académico</label>
                <Select
                  value={form.id_programa_academico?.toString() || 'none'}
                  onValueChange={(v) => handleSelect('id_programa_academico', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="(Sin asignar)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">(Sin asignar)</SelectItem>
                    {programas.data?.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Género</label>
                <Select
                  value={form.id_genero?.toString() || 'none'}
                  onValueChange={(v) => handleSelect('id_genero', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="(Sin asignar)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">(Sin asignar)</SelectItem>
                    {generos.data?.map(g => <SelectItem key={g.id} value={g.id.toString()}>{g.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">EPS</label>
                <Select
                  value={form.id_eps?.toString() || 'none'}
                  onValueChange={(v) => handleSelect('id_eps', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="(Sin asignar)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">(Sin asignar)</SelectItem>
                    {eps.data?.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Tipo Vínculo</label>
                <Select
                  value={form.id_tipo_vinculo?.toString() || 'none'}
                  onValueChange={(v) => handleSelect('id_tipo_vinculo', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="(Sin asignar)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">(Sin asignar)</SelectItem>
                    {tiposVinculo.data?.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-medium">Foto URL</label>
                <Input name="fotoUrl" value={form.fotoUrl || ''} onChange={handleChange} placeholder="https://..." />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Documento no se puede cambiar si ya existe.</p>
          </form>
        </CardContent>
      </Card>
    </div>
    </AppLayout>
  );
}

export default PerfilUsuario;