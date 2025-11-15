package com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.estadistica;

public record GoleadorDTO(
        Integer usuarioId,
        String nombreJugador,
        String fotoUrl,
        Integer equipoId,
        String equipoNombre,
        Long totalGoles
) {
}
