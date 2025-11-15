import axiosInstance from '@/lib/axios';
import { Evento, EventoCreateRequest, TipoEvento, Usuario } from '@/types';

function normalizeEvento(raw: any, partidoId?: number): Evento {
  const tipoId: number | undefined = raw?.id_tipo_evento ?? raw?.tipoEventoId ?? raw?.tipoEvento?.id;
  const tipoNombre: string | undefined = raw?.nombreTipoEvento ?? raw?.tipoEvento?.nombre;
  const puntosNeg: number | undefined = raw?.puntosNegativos ?? raw?.tipoEvento?.puntosNegativos;

  const usuarioId: number | undefined = raw?.id_usuario_jugador ?? raw?.usuarioId ?? raw?.usuario?.id;
  const usuarioNombre: string | null = (raw?.nombreJugador ?? raw?.usuario?.nombre) ?? null;

  const tipoEvento: TipoEvento = {
    id: Number(tipoId ?? 0),
    nombre: String(tipoNombre ?? ''),
    deporteId: (raw?.tipoEvento?.deporteId ?? 0) as number,
    puntosNegativos: Number(puntosNeg ?? 0),
  };

  const usuario: Usuario = {
    id: usuarioId ?? 0,
    nombre: usuarioNombre,
    correo: null,
    rol: 'JUGADOR',
  } as Usuario;

  return {
    id: raw?.id,
    partidoId: partidoId ?? raw?.partidoId ?? 0,
    tipoEventoId: tipoId ?? 0,
    usuarioId: usuarioId ?? 0,
    observaciones: raw?.observaciones,
    tipoEvento,
    usuario,
    // Preserve backend fields if present (harmless for consumers)
    id_equipo_por_partido: raw?.id_equipo_por_partido,
    id_usuario_jugador: raw?.id_usuario_jugador,
    nombreJugador: raw?.nombreJugador,
    id_tipo_evento: raw?.id_tipo_evento,
    nombreTipoEvento: raw?.nombreTipoEvento,
    puntosNegativos: raw?.puntosNegativos,
  } as Evento;
}

export const eventosService = {
  getEventos: async (partidoId: number): Promise<Evento[]> => {
    const { data } = await axiosInstance.get<any[]>('/eventos', {
      params: { partidoId },
    });
    return Array.isArray(data) ? data.map((e) => normalizeEvento(e, partidoId)) : [];
  },

  createEvento: async (request: EventoCreateRequest): Promise<Evento> => {
    const { data } = await axiosInstance.post<any>('/eventos', request);
    return normalizeEvento(data);
  },

  deleteEvento: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/eventos/${id}`);
  },
};
