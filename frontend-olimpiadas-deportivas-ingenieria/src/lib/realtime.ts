import type { QueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';

function getBaseUrl() {
  // axios baseURL already points to backend API root (e.g., https://.../api)
  // We need the absolute origin + '/api'
  const base = (axiosInstance.defaults.baseURL || '').replace(/\/$/, '');
  return base; // expected like https://backend/api
}

export function startRealtime(queryClient: QueryClient) {
  const base = getBaseUrl();
  const url = `${base}/rt/stream`;

  let es: EventSource | null = null;

  const connect = () => {
    try {
      es = new EventSource(url, { withCredentials: false });

      es.addEventListener('ready', () => {
        // connection established
      });

      es.addEventListener('partido-updated', (ev: MessageEvent) => {
        try {
          const data = JSON.parse(ev.data) as { partidoId?: number; torneoId?: number };
          if (data.partidoId) {
            queryClient.invalidateQueries({ queryKey: ['partido', String(data.partidoId)] });
          }
          queryClient.invalidateQueries({ queryKey: ['partidos'] });
        } catch {}
      });

      es.addEventListener('partidos-updated', () => {
        queryClient.invalidateQueries({ queryKey: ['partidos'] });
      });

      es.addEventListener('partido-assign-updated', (ev: MessageEvent) => {
        try {
          const data = JSON.parse(ev.data) as { partidoId?: number };
          if (data.partidoId) {
            queryClient.invalidateQueries({ queryKey: ['partido', String(data.partidoId)] });
          }
          queryClient.invalidateQueries({ queryKey: ['partidos'] });
        } catch {}
      });

      es.addEventListener('posiciones-updated', (ev: MessageEvent) => {
        queryClient.invalidateQueries({ queryKey: ['posiciones'] });
      });

      es.addEventListener('eventos-updated', (ev: MessageEvent) => {
        try {
          const data = JSON.parse(ev.data) as { partidoId?: number };
          if (typeof data.partidoId === 'number') {
            queryClient.invalidateQueries({ queryKey: ['eventos', data.partidoId] });
          } else {
            // fallback if no partidoId provided
            queryClient.invalidateQueries({ queryKey: ['eventos'] });
          }
        } catch {
          queryClient.invalidateQueries({ queryKey: ['eventos'] });
        }
      });

      es.addEventListener('equipos-updated', () => {
        queryClient.invalidateQueries({ queryKey: ['equipos'] });
        queryClient.invalidateQueries({ queryKey: ['plantilla'] });
      });

      es.addEventListener('torneos-updated', () => {
        queryClient.invalidateQueries({ queryKey: ['torneos'] });
        queryClient.invalidateQueries({ queryKey: ['torneo-detalle'] });
      });

      es.addEventListener('bracket-updated', () => {
        // Invalidate any bracket-related queries
        queryClient.invalidateQueries({ predicate: (q) => {
          const k = q.queryKey as unknown[];
          return Array.isArray(k) && (
            k[0] === 'partidos-cuartos' || k[0] === 'partidos-semifinales' || k[0] === 'partidos-final'
          );
        }});
        queryClient.invalidateQueries({ queryKey: ['partidos'] });
      });

      es.onerror = () => {
        // Try to reconnect shortly after an error
        if (es) {
          es.close();
          es = null;
        }
        setTimeout(connect, 3000);
      };
    } catch {
      setTimeout(connect, 3000);
    }
  };

  connect();

  return () => {
    if (es) es.close();
    es = null;
  };
}
