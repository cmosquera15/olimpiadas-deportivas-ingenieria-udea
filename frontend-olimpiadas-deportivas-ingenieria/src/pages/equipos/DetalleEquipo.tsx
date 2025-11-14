import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/Layout/AppLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { equipoDetalleService } from '@/services/equipo-detalle.service';
import { PlantillaEquipo } from './PlantillaEquipo';
import { hasPermission } from '@/lib/auth';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function DetalleEquipo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: equipo, isLoading, error } = useQuery({
    queryKey: ['equipo', id],
    queryFn: () => equipoDetalleService.getEquipoDetalle(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <Skeleton className="w-full h-48" />
        </div>
      </AppLayout>
    );
  }

  if (error || !equipo) {
    return (
      <AppLayout>
        <Alert variant="destructive">
          <AlertDescription>
            Error al cargar el detalle del equipo. Por favor, intente nuevamente.
          </AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  const canEditRoster = hasPermission('Equipos_Editar');

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/equipos')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">{equipo.nombre}</h1>
          </div>
          {(equipo.torneoNombre || equipo.torneo?.nombre) && (
            <Badge variant="outline">
              {equipo.torneoNombre || equipo.torneo?.nombre}
            </Badge>
          )}
        </div>

        <h2 className="sr-only">Detalles del equipo</h2>
        <Card>
          <CardHeader>
            <div className="text-lg font-semibold leading-none tracking-tight">Torneo</div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="plantilla">
              <TabsList>
                <TabsTrigger value="plantilla">Plantilla</TabsTrigger>
              </TabsList>

              <TabsContent value="plantilla">
                <PlantillaEquipo 
                  equipo={equipo} 
                  canEdit={canEditRoster}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}