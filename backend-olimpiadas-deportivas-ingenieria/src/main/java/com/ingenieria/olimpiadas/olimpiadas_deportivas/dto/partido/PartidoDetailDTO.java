package com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.partido;

import java.time.LocalDate;
import java.time.LocalTime;

public record PartidoDetailDTO(
        Integer id,
        LocalDate fecha,
        LocalTime hora,
        Integer idTorneo,
        String torneoNombre,
        Integer idLugar,
        String lugarNombre,
        Integer idFase,
        String faseNombre,
        Integer idGrupo,
        String grupoNombre,
        Integer idJornada,
        Integer numeroJornada,
        Integer idUsuarioArbitro,
        String arbitroNombre,
        String observaciones,
        Integer equipoLocalId,
        String equipoLocalNombre,
        Integer equipoLocalPuntos,
        Integer idEquipoLocalPorPartido,
        Integer equipoVisitanteId,
        String equipoVisitanteNombre,
        Integer equipoVisitantePuntos,
        Integer idEquipoVisitantePorPartido,
        Integer idOlimpiada,
        String olimpiadaNombre,
        String estado
) {}
