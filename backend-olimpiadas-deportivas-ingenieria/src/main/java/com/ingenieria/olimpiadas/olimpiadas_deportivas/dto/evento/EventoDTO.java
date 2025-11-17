package com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.evento;

public record EventoDTO(
        Integer id,
        Integer id_equipo_por_partido,
        Integer id_usuario_jugador,
        String nombreJugador,
        Integer id_tipo_evento,
        String nombreTipoEvento,
        Integer puntosNegativos,
        String observaciones
) {}
