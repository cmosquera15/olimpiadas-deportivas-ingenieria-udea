package com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.usuario;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.common.IdNombreDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.usuario.Usuario;

public record UsuarioDetailDTO(
        Integer id,
        String nombre,
        String correo,
        String documento,
        String fotoUrl,
    String rol,
    String rolDescripcion,
        Boolean habilitado,
        IdNombreDTO genero,
        IdNombreDTO eps,
        IdNombreDTO programaAcademico,
        IdNombreDTO tipoVinculo
) {
    public static UsuarioDetailDTO from(Usuario u) {
        return new UsuarioDetailDTO(
                u.getId(),
                u.getNombre(),
                u.getCorreo(),
                u.getDocumento(),
                u.getFotoUrl(),
        u.getRol() != null ? u.getRol().getNombre() : null,
        u.getRol() != null ? u.getRol().getDescripcion() : null,
                u.getHabilitado(),
                u.getGenero() != null ? new IdNombreDTO(u.getGenero().getId(), u.getGenero().getNombre()) : null,
                u.getEntidadPromotoraSalud() != null ? new IdNombreDTO(u.getEntidadPromotoraSalud().getId(), u.getEntidadPromotoraSalud().getNombre()) : null,
                u.getProgramaAcademico() != null ? new IdNombreDTO(u.getProgramaAcademico().getId(), u.getProgramaAcademico().getNombre()) : null,
                u.getTipoVinculo() != null ? new IdNombreDTO(u.getTipoVinculo().getId(), u.getTipoVinculo().getNombre()) : null
        );
    }
}
