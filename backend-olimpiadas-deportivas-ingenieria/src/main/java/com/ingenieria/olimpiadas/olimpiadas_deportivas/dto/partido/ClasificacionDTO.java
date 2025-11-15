package com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.partido;

public record ClasificacionDTO(
    Integer equipoId,
    String equipoNombre,
    Integer posicionGeneral,
    Integer posicionGrupo,
    String grupoNombre,
    boolean clasificado,
    String razonClasificacion // "1º Grupo A", "2º Grupo B", "Mejor 3º", etc.
) {}
