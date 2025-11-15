import axiosInstance from '@/lib/axios';

export interface Goleador {
  usuarioId: number;
  nombreJugador: string;
  fotoUrl: string | null;
  equipoId: number;
  equipoNombre: string;
  totalGoles: number;
}

export const estadisticasService = {
  getGoleadores: async (torneoId: number): Promise<Goleador[]> => {
    const { data } = await axiosInstance.get<Goleador[]>('/estadisticas/goleadores', {
      params: { torneoId },
    });
    return data;
  },
};
