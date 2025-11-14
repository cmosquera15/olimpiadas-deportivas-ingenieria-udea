package com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.partido;

import jakarta.validation.constraints.NotNull;

public record PartidoEstadoUpdateDTO(
    @NotNull(message = "El estado es requerido")
    String estado
) {}
