import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Partido } from '@/types';

interface BracketMatch {
  id: number;
  equipo1?: string;
  equipo2?: string;
  puntos1?: number | null;
  puntos2?: number | null;
  ganador?: string;
  fecha?: string;
  hora?: string;
  lugar?: string;
}

interface TournamentBracketProps {
  cuartos?: Partido[];
  semifinales?: Partido[];
  final?: Partido[];
  deporteNombre?: string;
  highlightPhase?: 'cuartos' | 'semifinal' | 'final';
}

export const TournamentBracket = ({
  cuartos = [],
  semifinales = [],
  final = [],
  deporteNombre = '',
  highlightPhase,
}: TournamentBracketProps) => {
  const esFutbol = deporteNombre.toLowerCase().includes('futbol') || deporteNombre.toLowerCase().includes('fútbol');
  const esBaloncesto = deporteNombre.toLowerCase().includes('baloncesto');

  const convertirABracketMatch = (partido: Partido): BracketMatch => {
    const eq1 = partido.equipoLocal?.nombre || 'Por definir';
    const eq2 = partido.equipoVisitante?.nombre || 'Por definir';
    const pts1 = partido.puntosLocal;
    const pts2 = partido.puntosVisitante;
    
    let ganador: string | undefined = undefined;
    if (pts1 !== null && pts2 !== null && pts1 !== undefined && pts2 !== undefined) {
      ganador = pts1 > pts2 ? eq1 : pts2 > pts1 ? eq2 : undefined;
    }

    return {
      id: partido.id,
      equipo1: eq1,
      equipo2: eq2,
      puntos1: pts1,
      puntos2: pts2,
      ganador,
      fecha: partido.fecha,
      hora: partido.hora,
      lugar: partido.lugar?.nombre,
    };
  };

  const cuartosMatches = cuartos.map(convertirABracketMatch);
  const semifinalesMatches = semifinales.map(convertirABracketMatch);
  const finalMatch = final.length > 0 ? convertirABracketMatch(final[0]) : null;

  const dimClass = (section: 'cuartos' | 'semifinal' | 'final') =>
    highlightPhase && highlightPhase !== section
      ? 'opacity-40 saturate-50 pointer-events-none transition-opacity'
      : 'transition-opacity';

  const MatchCard = ({ match, size = 'md' }: { match: BracketMatch; size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
      sm: 'p-2 min-w-[160px]',
      md: 'p-3 min-w-[200px]',
      lg: 'p-4 min-w-[240px]',
    };

    const textSizes = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    };

    const esGanador = (equipo: string) => match.ganador === equipo;
    const hayResultado = match.puntos1 !== null && match.puntos2 !== null;

    return (
      <Card className={`${sizeClasses[size]} border-2 hover:shadow-md transition-shadow`}>
        <CardContent className="p-0 space-y-2">
          {/* Equipo 1 */}
          <div className={`flex items-center justify-between ${esGanador(match.equipo1!) ? 'font-bold text-primary' : ''}`}>
            <span className={`${textSizes[size]} truncate flex-1`}>{match.equipo1}</span>
            {hayResultado && (
              <Badge variant={esGanador(match.equipo1!) ? 'default' : 'outline'} className="ml-2">
                {match.puntos1}
              </Badge>
            )}
          </div>

          {/* Separador */}
          <div className="border-t" />

          {/* Equipo 2 */}
          <div className={`flex items-center justify-between ${esGanador(match.equipo2!) ? 'font-bold text-primary' : ''}`}>
            <span className={`${textSizes[size]} truncate flex-1`}>{match.equipo2}</span>
            {hayResultado && (
              <Badge variant={esGanador(match.equipo2!) ? 'default' : 'outline'} className="ml-2">
                {match.puntos2}
              </Badge>
            )}
          </div>

          {/* Info adicional */}
          {!hayResultado && match.fecha && (
            <div className="text-xs text-muted-foreground text-center pt-1">
              {new Date(match.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Vista para Fútbol (con cuartos)
  if (esFutbol && cuartosMatches.length > 0) {
    return (
      <div className="w-full overflow-x-auto py-8">
        <div className="min-w-[1200px] mx-auto">
          <div className="grid grid-cols-4 gap-8">
            {/* Cuartos de Final */}
            <div className={`space-y-4 ${dimClass('cuartos')}`}>
              <h3 className="text-center font-semibold text-lg mb-4">Cuartos de Final</h3>
              <div className="space-y-12">
                {cuartosMatches.map((match) => (
                  <div key={match.id} className="relative">
                    <MatchCard match={match} size="sm" />
                    {/* Línea conectora a la derecha */}
                    <div className="absolute top-1/2 -right-8 w-8 h-0.5 bg-border" />
                  </div>
                ))}
              </div>
            </div>

            {/* Semifinales */}
            <div className={`space-y-4 ${dimClass('semifinal')}`}>
              <h3 className="text-center font-semibold text-lg mb-4">Semifinal</h3>
              <div className="space-y-24 pt-16">
                {semifinalesMatches.slice(0, 2).map((match) => (
                  <div key={match.id} className="relative">
                    <MatchCard match={match} size="md" />
                    {/* Línea conectora a la derecha */}
                    <div className="absolute top-1/2 -right-8 w-8 h-0.5 bg-border" />
                  </div>
                ))}
              </div>
            </div>

            {/* Final */}
            <div className={`space-y-4 ${dimClass('final')}`}>
              <h3 className="text-center font-semibold text-lg mb-4">Final</h3>
              <div className="pt-44">
                {finalMatch && <MatchCard match={finalMatch} size="lg" />}
                {!finalMatch && (
                  <Card className="p-8 min-w-[240px]">
                    <CardContent className="text-center text-muted-foreground">
                      <p className="text-sm">Por definir</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Campeón */}
            <div className={`space-y-4 ${dimClass('final')}`}>
              <h3 className="text-center font-semibold text-lg mb-4">Campeón</h3>
              <div className="pt-44">
                <Card className="p-6 min-w-[200px] border-4 border-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
                  <CardContent className="text-center">
                    {finalMatch?.ganador ? (
                      <>
                        <div className="text-4xl mb-2">🏆</div>
                        <p className="font-bold text-lg">{finalMatch.ganador}</p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Por definir</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Conectores verticales para cuartos */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
            {/* Conectores de cuartos a semifinales */}
            {[0, 1].map((i) => (
              <g key={`cuarto-semi-${i}`}>
                <line
                  x1="25%"
                  y1={`${20 + i * 50}%`}
                  x2="37.5%"
                  y2={`${32.5 + i * 25}%`}
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-border"
                />
              </g>
            ))}
            {/* Conectores de semifinales a final */}
            {[0, 1].map((i) => (
              <g key={`semi-final-${i}`}>
                <line
                  x1="50%"
                  y1={`${32.5 + i * 25}%`}
                  x2="62.5%"
                  y2="50%"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-border"
                />
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  }

  // Vista para Baloncesto (solo semifinales y final)
  if (esBaloncesto && semifinalesMatches.length > 0) {
    return (
      <div className="w-full overflow-x-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-12">
            {/* Semifinales */}
            <div className={`space-y-4 ${dimClass('semifinal')}`}>
              <h3 className="text-center font-semibold text-lg mb-4">Semifinal</h3>
              <div className="space-y-16">
                {semifinalesMatches.map((match) => (
                  <div key={match.id} className="relative">
                    <MatchCard match={match} size="md" />
                    {/* Línea conectora a la derecha */}
                    <div className="absolute top-1/2 -right-12 w-12 h-0.5 bg-border" />
                  </div>
                ))}
              </div>
            </div>

            {/* Final */}
            <div className={`space-y-4 ${dimClass('final')}`}>
              <h3 className="text-center font-semibold text-lg mb-4">Final</h3>
              <div className="pt-24">
                {finalMatch && <MatchCard match={finalMatch} size="lg" />}
                {!finalMatch && (
                  <Card className="p-8 min-w-[240px]">
                    <CardContent className="text-center text-muted-foreground">
                      <p className="text-sm">Por definir</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Campeón */}
            <div className={`space-y-4 ${dimClass('final')}`}>
              <h3 className="text-center font-semibold text-lg mb-4">Campeón</h3>
              <div className="pt-24">
                <Card className="p-6 min-w-[200px] border-4 border-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
                  <CardContent className="text-center">
                    {finalMatch?.ganador ? (
                      <>
                        <div className="text-4xl mb-2">🏆</div>
                        <p className="font-bold text-lg">{finalMatch.ganador}</p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Por definir</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista genérica si no hay partidos
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">No hay partidos de eliminación directa programados aún</p>
    </div>
  );
};
