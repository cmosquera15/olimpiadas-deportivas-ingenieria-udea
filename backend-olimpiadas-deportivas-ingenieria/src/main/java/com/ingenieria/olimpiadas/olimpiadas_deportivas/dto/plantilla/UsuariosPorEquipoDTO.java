package com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.plantilla;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo.UsuariosPorEquipo;

public record UsuariosPorEquipoDTO(
        Integer id,
        UsuarioBasicoDTO usuario,
        EquipoBasicoDTO equipo,
        TorneoBasicoDTO torneo
) {
    public static UsuariosPorEquipoDTO from(UsuariosPorEquipo upe) {
        return new UsuariosPorEquipoDTO(
                upe.getId(),
                new UsuarioBasicoDTO(
                        upe.getUsuario().getId(),
                        upe.getUsuario().getNombre(),
                        upe.getUsuario().getCorreo(),
                        upe.getUsuario().getDocumento(),
                        upe.getUsuario().getFotoUrl()
                ),
                new EquipoBasicoDTO(
                        upe.getEquipo().getId(),
                        upe.getEquipo().getNombre()
                ),
                new TorneoBasicoDTO(
                        upe.getTorneo().getId(),
                        upe.getTorneo().getNombre()
                )
        );
    }

    public record UsuarioBasicoDTO(
            Integer id,
            String nombre,
            String correo,
            String documento,
            String fotoUrl
    ) {}

    public record EquipoBasicoDTO(
            Integer id,
            String nombre
    ) {}

    public record TorneoBasicoDTO(
            Integer id,
            String nombre
    ) {}
}
