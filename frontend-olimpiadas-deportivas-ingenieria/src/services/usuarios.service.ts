import axiosInstance from '@/lib/axios';
import { PageResponse, PageRequest, Usuario } from '@/types';
// Adapted to backend UsuarioListDTO shape
export interface UsuarioListDTO {
  id: number;
  nombre: string | null;
  correo: string | null;
  rol: string | null;
  habilitado: boolean | null;
}

export interface UsuarioCreateRequest {
  nombre: string;
  correo: string;
  rolNombre: string; // ADMINISTRADOR | ARBITRO | JUGADOR
  documento?: string;
  id_programa_academico?: number;
  id_genero?: number;
  id_eps?: number;
  id_tipo_vinculo?: number;
}

interface UsuariosFilter extends PageRequest {
  search?: string;
}

export const usuariosService = {
  getUsuarioCompleto: async (id: number): Promise<Usuario> => {
    const { data } = await axiosInstance.get<Usuario>(`/usuarios/${id}`);
    return data;
  },

  getUsuario: async (id: number): Promise<UsuarioListDTO> => {
    const { data } = await axiosInstance.get<UsuarioListDTO>(`/usuarios/${id}`);
    return data;
  },

  getUsuarios: async (filters: UsuariosFilter = {}): Promise<PageResponse<UsuarioListDTO>> => {
    const { data } = await axiosInstance.get<PageResponse<UsuarioListDTO>>('/admin/usuarios', {
      params: filters,
    });
    return data;
  },

  createUsuario: async (req: UsuarioCreateRequest): Promise<UsuarioListDTO> => {
    const { data } = await axiosInstance.post<UsuarioListDTO>(`/admin/usuarios`, req);
    return data;
  },

  updateRol: async (id: number, rol: string): Promise<UsuarioListDTO> => {
    const { data } = await axiosInstance.put<UsuarioListDTO>(`/admin/usuarios/${id}/rol`, { rol });
    return data;
  },

  updateHabilitado: async (id: number, habilitado: boolean): Promise<UsuarioListDTO> => {
    const { data } = await axiosInstance.put<UsuarioListDTO>(`/admin/usuarios/${id}/habilitado`, {
      habilitado,
    });
    return data;
  },

  updatePerfilSelf: async (payload: UsuarioUpdatePayload): Promise<Usuario> => {
    const { data } = await axiosInstance.patch<Usuario>(`/usuarios/me`, payload);
    return data as Usuario;
  },

  updatePerfilAdmin: async (id: number, payload: UsuarioUpdatePayload): Promise<Usuario> => {
    const { data } = await axiosInstance.put<Usuario>(`/admin/usuarios/${id}/perfil`, payload);
    return data as Usuario;
  },
};

export interface UsuarioUpdatePayload {
  nombre?: string;
  documento?: string;
  id_programa_academico?: number;
  id_genero?: number;
  id_eps?: number;
  id_tipo_vinculo?: number;
  fotoUrl?: string;
}
