package com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.partido;

import java.time.LocalDate;
import java.time.LocalTime;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.common.IdNombreDTO;

public record PartidoListViewDTO(
        Integer id,
        LocalDate fecha,
        LocalTime hora,
        IdNombreDTO torneo,
        IdNombreDTO fase,
        IdNombreDTO grupo,
        IdNombreDTO lugar,
        IdNombreDTO arbitro,
        EquipoPartidoResumenDTO equipoLocal,
        EquipoPartidoResumenDTO equipoVisitante,
        Integer puntosLocal,
        Integer puntosVisitante,
        IdNombreDTO olimpiada,
        String estado
) {}
