import axiosInstance from '@/lib/axios';
import {
  Partido,
  PartidoDetail,
  PartidoCreateRequest,
  AsignarEquiposRequest,
  ActualizarMarcadorRequest,
  PageResponse,
  PageRequest,
  ClasificacionDTO,
  EstadoFaseGruposDTO,
} from '@/types';

interface PartidosFilter extends PageRequest {
  torneoId?: number;
  faseId?: number;
  grupoId?: number;
  arbitroId?: number;
}

function buildParams(filters: PartidosFilter = {}) {
  const params: Record<string, unknown> = {};
  if (typeof filters.page === 'number') params.page = filters.page;
  if (typeof filters.size === 'number') params.size = filters.size;
  if (typeof filters.torneoId === 'number') params.torneoId = filters.torneoId;
  if (typeof filters.faseId === 'number') params.faseId = filters.faseId;
  if (typeof filters.grupoId === 'number') params.grupoId = filters.grupoId;
  if (typeof filters.arbitroId === 'number') params.arbitroId = filters.arbitroId;
  return params;
}

export const partidosService = {
  getPartidos: async (filters: PartidosFilter = {}): Promise<PageResponse<Partido>> => {
    const params = buildParams({ size: 10, ...filters });
    console.log('📡 API call params:', params);
    try {
      const { data } = await axiosInstance.get<PageResponse<Partido>>('/partidos', { params });
      console.log('📦 API response:', { totalElements: data.totalElements, contentLength: data.content.length, data });
      return data;
    } catch (error) {
      console.error('❌ API error:', error);
      throw error;
    }
  },

  getPartido: async (id: number): Promise<PartidoDetail> => {
    const { data } = await axiosInstance.get<PartidoDetail>(`/partidos/${id}`);
    return data;
  },

  createPartido: async (request: PartidoCreateRequest): Promise<PartidoDetail> => {
    const { data } = await axiosInstance.post<PartidoDetail>('/partidos', request);
    return data;
  },

  updatePartido: async (id: number, request: PartidoCreateRequest): Promise<PartidoDetail> => {
    const { data } = await axiosInstance.put<PartidoDetail>(`/partidos/${id}`, request);
    return data;
  },

  deletePartido: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/partidos/${id}`);
  },

  asignarEquipos: async (id: number, request: AsignarEquiposRequest): Promise<PartidoDetail> => {
    const { data } = await axiosInstance.post<PartidoDetail>(`/partidos/${id}/asignar-equipos`, request);
    return data;
  },

  actualizarMarcador: async (id: number, request: ActualizarMarcadorRequest): Promise<PartidoDetail> => {
    const { data } = await axiosInstance.put<PartidoDetail>(`/partidos/${id}/marcador`, request);
    return data;
  },

  actualizarEstado: async (id: number, estado: string): Promise<PartidoDetail> => {
    const { data } = await axiosInstance.put<PartidoDetail>(`/partidos/${id}/estado`, { estado });
    return data;
  },

  // Gestión de llaves y clasificación
  puedeGenerarLlaves: async (torneoId: number): Promise<EstadoFaseGruposDTO> => {
    const { data } = await axiosInstance.get<EstadoFaseGruposDTO>(`/partidos/torneo/${torneoId}/puede-generar-llaves`);
    return data;
  },

  obtenerClasificacion: async (torneoId: number): Promise<ClasificacionDTO[]> => {
    const { data } = await axiosInstance.get<ClasificacionDTO[]>(`/partidos/torneo/${torneoId}/clasificacion`);
    return data;
  },

  generarLlaves: async (torneoId: number): Promise<{ mensaje: string }> => {
    const { data} = await axiosInstance.post<{ mensaje: string }>(`/partidos/torneo/${torneoId}/generar-llaves`);
    return data;
  },
};
