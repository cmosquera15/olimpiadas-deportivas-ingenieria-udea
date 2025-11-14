import axiosInstance from '@/lib/axios';
import { Equipo, UsuarioPorEquipo, PageResponse } from '@/types';

export interface EquipoCreateRequest {
  nombre: string;
  id_torneo: number;
  id_grupo: number;
  id_programa_academico_1: number;
  id_programa_academico_2?: number;
  id_usuario_capitan?: number;
}

export const equiposService = {
  getEquipos: async (torneoId?: number): Promise<Equipo[]> => {
    const { data } = await axiosInstance.get<PageResponse<Equipo>>('/equipos', {
      params: torneoId ? { torneoId } : undefined,
    });
    return data.content;
  },

  getEquipo: async (id: number): Promise<Equipo> => {
    const { data } = await axiosInstance.get<Equipo>(`/equipos/${id}`);
    return data;
  },

  createEquipo: async (request: EquipoCreateRequest): Promise<Equipo> => {
    const { data } = await axiosInstance.post<Equipo>('/equipos', request);
    return data;
  },

  updateEquipo: async (
    id: number,
    request: { nombre: string; torneoId: number }
  ): Promise<Equipo> => {
    const { data } = await axiosInstance.put<Equipo>(`/equipos/${id}`, request);
    return data;
  },

  deleteEquipo: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/equipos/${id}`);
  },

  getPlantilla: async (equipoId: number, torneoId: number): Promise<UsuarioPorEquipo[]> => {
    const { data } = await axiosInstance.get<UsuarioPorEquipo[]>(
      `/equipos/${equipoId}/plantilla`,
      {
        params: { torneoId },
      }
    );
    return data;
  },

  addToPlantilla: async (
    equipoId: number,
    usuarioId: number,
    torneoId: number
  ): Promise<UsuarioPorEquipo> => {
    const { data } = await axiosInstance.post<UsuarioPorEquipo>(
      `/equipos/${equipoId}/plantilla`,
      { usuarioId, torneoId }
    );
    return data;
  },

  removeFromPlantilla: async (usuariosPorEquipoId: number): Promise<void> => {
    await axiosInstance.delete(`/equipos/plantilla/${usuariosPorEquipoId}`);
  },
};
