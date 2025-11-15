import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/Layout/AppLayout';
import { estadisticasService } from '@/services/estadisticas.service';
import { torneosService } from '@/services/torneos.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Loader2 } from 'lucide-react';

export default function TablaGoleadores() {
  const [torneoId, setTorneoId] = useState<number | undefined>(undefined);

  const { data: torneosPage } = useQuery({
    queryKey: ['torneos-select'],
    queryFn: () => torneosService.getTorneos({ page: 0, size: 100 }),
  });

  const { data: goleadores, isLoading } = useQuery({
    queryKey: ['goleadores', torneoId],
    queryFn: () => estadisticasService.getGoleadores(torneoId!),
    enabled: !!torneoId,
  });

  const torneos = torneosPage?.content || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-xl border bg-card p-6 md:p-8">
          <div className="absolute right-[-10%] top-[-30%] h-64 w-64 rounded-full bg-primary/15 blur-2xl" />
          <div className="absolute left-[-8%] bottom-[-20%] h-56 w-56 rounded-full bg-secondary/15 blur-2xl" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <h1 className="bg-gradient-to-r from-primary via-contrast to-secondary bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl md:text-4xl">
                🥅 Tabla de Goleadores
              </h1>
              <p className="mt-2 max-w-prose text-xs text-muted-foreground sm:text-sm md:text-base">
                Consulta los máximos goleadores por torneo
              </p>
            </div>
            <Target className="h-8 w-8 text-accent" />
          </div>
        </div>

        {/* Filtro de torneo */}
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Torneo</CardTitle>
            <CardDescription>Elige un torneo para ver sus goleadores</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={torneoId?.toString() || 'none'}
              onValueChange={(v) => setTorneoId(v === 'none' ? undefined : Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un torneo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin seleccionar</SelectItem>
                {torneos.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.nombre} · {t.olimpiadaNombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Tabla de goleadores */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !torneoId ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trophy className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                Selecciona un torneo para ver la tabla de goleadores
              </p>
            </CardContent>
          </Card>
        ) : goleadores && goleadores.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Goleadores
              </CardTitle>
              <CardDescription>{goleadores.length} jugadores con goles anotados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {goleadores.map((goleador, index) => (
                  <div
                    key={goleador.usuarioId}
                    className="group relative flex items-center gap-4 rounded-lg border bg-card p-4 transition-all duration-300 hover:shadow-lg hover:border-primary/50"
                  >
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Posición */}
                    <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 font-bold text-lg">
                      {index === 0 && <span className="text-2xl">🥇</span>}
                      {index === 1 && <span className="text-2xl">🥈</span>}
                      {index === 2 && <span className="text-2xl">🥉</span>}
                      {index > 2 && <span className="text-primary">{index + 1}</span>}
                    </div>

                    {/* Avatar */}
                    <Avatar className="relative z-10 h-12 w-12 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                      <AvatarImage 
                        src={goleador.fotoUrl || undefined} 
                        alt={goleador.nombreJugador}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {goleador.nombreJugador.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info del jugador */}
                    <div className="relative z-10 flex-1 min-w-0">
                      <p className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                        {goleador.nombreJugador}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {goleador.equipoNombre}
                      </p>
                    </div>

                    {/* Goles */}
                    <div className="relative z-10 flex items-center gap-2">
                      <Badge variant="secondary" className="text-base font-bold">
                        {goleador.totalGoles}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                No hay goles registrados en este torneo
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
