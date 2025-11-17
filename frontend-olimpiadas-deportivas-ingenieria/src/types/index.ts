// Auth types
export interface AuthDTO {
  token: string | null;
  id: number | null;
  nombre: string | null;
  correo: string | null;
  completo: boolean;
  fotoUrl: string | null;
}

export interface CompletarPerfilRequest {
  documento: string;
  id_eps: number;
  id_programa_academico: number;
  id_genero: number;
  id_tipo_vinculo: number;
}

// Usuario types
export interface Usuario {
  id?: number;
  nombre: string | null;
  correo: string | null;
  fotoUrl?: string | null;
  documento?: string;
  rol: string;
  rolDescripcion?: string;
  habilitado?: boolean;
  completo?: boolean;
  genero?: Genero;
  eps?: EPS;
  programaAcademico?: ProgramaAcademico;
  tipoVinculo?: TipoVinculo;
}

// Catálogo types
export interface ProgramaAcademico {
  id: number;
  nombre: string;
}

export interface EPS {
  id: number;
  nombre: string;
}

export interface Genero {
  id: number;
  nombre: string;
}

export interface Deporte {
  id: number;
  nombre: string;
}

export interface Lugar {
  id: number;
  nombre: string;
  capacidad?: number;
}

export interface Fase {
  id: number;
  nombre: string;
  orden: number;
}

export interface Jornada {
  id: number;
  nombre: string;
  torneoId: number;
}

export interface Grupo {
  id: number;
  nombre: string;
  torneoId: number;
}

export interface Resultado {
  id: number;
  nombre: string;
  codigo: string;
}

export interface TipoVinculo {
  id: number;
  nombre: string;
}

export interface TipoEvento {
  id: number;
  nombre: string;
  deporteId: number;
  puntosNegativos: number;
}

// Olimpiada types
export interface Olimpiada {
  id: number;
  nombre: string;
  slug: string;
  edicion: string;
  anio: number;
  activo: boolean;
}

export interface IdNombreDTO {
  id: number;
  nombre: string;
}

// Torneo types
export interface TorneoListDTO {
  id: number;
  nombre: string;
  idDeporte: number;
  deporteNombre: string;
  idOlimpiada: number;
  olimpiadaNombre: string;
}

export interface TorneoDetailDTO {
  id: number;
  nombre: string;
  idDeporte: number;
  deporteNombre: string;
  idOlimpiada: number;
  olimpiadaNombre: string;
  reglamentoUrl?: string;
}

export interface TorneoCreateRequest {
  nombre: string;
  idDeporte: number;
  idOlimpiada: number;
}

// Legacy support - mantener por compatibilidad
export interface Torneo {
  id: number;
  nombre: string;
  anio?: number;
  activo?: boolean;
  deporte?: Deporte;
  id_deporte?: number;
  deporte_nombre?: string;
  idDeporte?: number;
  deporteNombre?: string;
  idOlimpiada?: number;
  olimpiadaNombre?: string;
  reglamentoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Equipo types
export interface Equipo {
  id: number;
  nombre: string;
  torneoId?: number;
  torneoNombre?: string;
  programaAcademico1: ProgramaAcademico;
  programaAcademico2?: ProgramaAcademico;
  capitanId?: number;
  capitan?: Usuario;
  integrantesCount: number;
  torneo?: Torneo;
  grupoId?: number;
  grupo?: Grupo;
  createdAt: string;
  updatedAt: string;
}

export interface UsuarioPorEquipo {
  id: number;
  usuario: {
    id: number;
    nombre: string;
    correo?: string;
    documento?: string;
    fotoUrl?: string;
    programaAcademico?: ProgramaAcademico; // may be ignored in equipo detail list
    epsNombre?: string;
  };
  equipo: {
    id: number;
    nombre: string;
  };
  torneo: {
    id: number;
    nombre: string;
  };
}

// Partido types
export interface Partido {
  id: number;
  torneoId: number;
  faseId?: number;
  grupoId?: number;
  jornadaId?: number;
  lugarId: number;
  arbitroId?: number;
  fecha: string;
  hora: string;
  observaciones?: string;
  resultadoEquipo1Id?: number;
  resultadoEquipo2Id?: number;
  estado?: 'PROGRAMADO' | 'TERMINADO' | 'APLAZADO';
  torneo: Torneo;
  fase?: Fase;
  grupo?: Grupo;
  jornada?: Jornada;
  lugar: Lugar;
  arbitro?: Usuario;
  equipoLocal?: {
    id: number;
    nombre: string;
    puntos: number | null;
  };
  equipoVisitante?: {
    id: number;
    nombre: string;
    puntos: number | null;
  };
  puntosLocal?: number | null;
  puntosVisitante?: number | null;
  resultadoEquipo1?: Resultado;
  resultadoEquipo2?: Resultado;
}

export interface PartidoDetail {
  id: number;
  fecha: string;
  hora: string;
  idTorneo: number;
  torneoNombre: string;
  idLugar: number;
  lugarNombre: string;
  idFase?: number;
  faseNombre?: string;
  idGrupo?: number;
  grupoNombre?: string;
  idJornada?: number;
  numeroJornada?: number;
  idUsuarioArbitro?: number;
  arbitroNombre?: string;
  equipoLocalId?: number;
  equipoLocalNombre?: string;
  equipoLocalPuntos?: number | null;
  idEquipoLocalPorPartido?: number;
  equipoVisitanteId?: number;
  equipoVisitanteNombre?: string;
  equipoVisitantePuntos?: number | null;
  idEquipoVisitantePorPartido?: number;
  observaciones?: string;
  estado?: 'PROGRAMADO' | 'TERMINADO' | 'APLAZADO';
}

export interface PartidoCreateRequest {
  id_torneo: number;
  id_fase: number;
  id_grupo?: number;
  id_jornada?: number;
  id_lugar: number;
  id_usuario_arbitro: number;
  fecha: string;
  hora: string;
  observaciones?: string;
}

export interface AsignarEquiposRequest {
  equipoId1: number;
  equipoId2: number;
}

export interface ActualizarMarcadorRequest {
  equipo1Id: number;
  equipo2Id: number;
  puntosEquipo1?: number;
  puntosEquipo2?: number;
  resultadoEquipo1Id?: number;
  resultadoEquipo2Id?: number;
}

// Evento types
export interface Evento {
  id: number;
  partidoId: number;
  tipoEventoId: number;
  usuarioId: number;
  observaciones?: string;
  tipoEvento: TipoEvento;
  usuario: Usuario;
  // Backend flattened DTO compatibility fields
  id_equipo_por_partido?: number;
  id_usuario_jugador?: number;
  nombreJugador?: string;
  id_tipo_evento?: number;
  nombreTipoEvento?: string;
  puntosNegativos?: number;
}

export interface EventoCreateRequest {
  id_equipo_por_partido: number;
  id_tipo_evento: number;
  id_usuario_jugador?: number;
  observaciones?: string;
}

// Posiciones types
export interface Posicion {
  equipo: Equipo;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  gd: number;
  pts: number;
  fairPlay: number;
}

// Tabla posiciones DTO (backend shape)
export interface EquipoPosicionDTO {
  equipoId: number;
  equipoNombre: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  gd: number;
  pts: number;
  fairPlay: number;
}

export interface TablaPosiciones {
  torneoId: number;
  torneoNombre: string;
  grupoId?: number;
  grupoNombre?: string;
  posiciones: EquipoPosicionDTO[];
}

// Clasificación y llaves
export interface ClasificacionDTO {
  equipoId: number;
  equipoNombre: string;
  posicionGeneral: number | null;
  posicionGrupo: number;
  grupoNombre: string | null;
  clasificado: boolean;
  razonClasificacion: string | null; // "1º Grupo A", "2º Grupo B", "Mejor 3º", etc.
}

export interface EstadoFaseGruposDTO {
  puedeGenerar: boolean;
  partidosJugados: number;
  partidosTotales: number;
  mensaje: string;
}

// Pagination types
export interface PageRequest {
  page?: number;
  size?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
