package com.ingenieria.olimpiadas.olimpiadas_deportivas.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.catalogo.*;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.common.IdNombreDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.evento.TipoEventoDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo.*;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.catalogo.*;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.evento.TipoEvento;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.usuario.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface CatalogoMapper {

    IdNombreDTO mapDeporteToIdNombre(Deporte d);

    default ProgramaAcademicoDTO toProgramaAcademicoDTO(ProgramaAcademico p) {
        return p == null ? null : new ProgramaAcademicoDTO(p.getId(), p.getNombre());
    }

    default EntidadPromotoraSaludDTO toEntidadPromotoraSaludDTO(EntidadPromotoraSalud e) {
        return e == null ? null : new EntidadPromotoraSaludDTO(e.getId(), e.getNombre());
    }

    default GeneroDTO toGeneroDTO(Genero g) {
        return g == null ? null : new GeneroDTO(g.getId(), g.getNombre());
    }

    default DeporteDTO toDeporteDTO(Deporte d) {
        return d == null ? null : new DeporteDTO(d.getId(), d.getNombre());
    }

    default LugarDTO toLugarDTO(Lugar l) {
        return l == null ? null : new LugarDTO(l.getId(), l.getNombre());
    }

    default FaseDTO toFaseDTO(Fase f) {
        return f == null ? null : new FaseDTO(
            f.getId(),
            f.getNombre(),
            f.getTorneo() != null ? f.getTorneo().getId() : null
        );
    }

    default JornadaDTO toJornadaDTO(Jornada j) {
        return j == null ? null : new JornadaDTO(
                j.getId(),
                j.getNumero(),
                j.getTorneo() != null ? j.getTorneo().getId() : null
        );
    }

    default GrupoDTO toGrupoDTO(Grupo g) {
        return g == null ? null : new GrupoDTO(
                g.getId(),
                g.getNombre(),
                g.getTorneo() != null ? g.getTorneo().getId() : null
        );
    }

    default ResultadoDTO toResultadoDTO(Resultado r) {
        return r == null ? null : new ResultadoDTO(r.getId(), r.getNombre());
    }

    default TipoVinculoDTO toTipoVinculoDTO(TipoVinculo t) {
        return t == null ? null : new TipoVinculoDTO(t.getId(), t.getNombre());
    }

    default TipoEventoDTO toTipoEventoDTO(TipoEvento x) {
        if (x == null) return null;
        Integer deporteId = (x.getDeporte() != null) ? x.getDeporte().getId() : null;
        return new TipoEventoDTO(x.getId(), x.getNombre(), x.getPuntosNegativos(), deporteId, x.getRequiereJugador());
    }

    default IdNombreDTO toIdNombre(Deporte d) { return d == null ? null : new IdNombreDTO(d.getId(), d.getNombre()); }
    default IdNombreDTO toIdNombre(Lugar l)   { return l == null ? null : new IdNombreDTO(l.getId(), l.getNombre()); }
    default IdNombreDTO toIdNombre(Fase f)    { return f == null ? null : new IdNombreDTO(f.getId(), f.getNombre()); }
    default IdNombreDTO toIdNombre(Grupo g)   { return g == null ? null : new IdNombreDTO(g.getId(), g.getNombre()); }
    default IdNombreDTO toIdNombre(Rol r)     { return r == null ? null : new IdNombreDTO(r.getId(), r.getNombre()); }
    default IdNombreDTO toIdNombre(Usuario u) { return u == null ? null : new IdNombreDTO(u.getId(), u.getNombre()); }
    default IdNombreDTO toIdNombre(Torneo t)  { return t == null ? null : new IdNombreDTO(t.getId(), t.getNombre()); }
    default IdNombreDTO toIdNombre(Equipo e)  { return e == null ? null : new IdNombreDTO(e.getId(), e.getNombre()); }
    default IdNombreDTO toIdNombre(TipoEvento t)  { return t == null ? null : new IdNombreDTO(t.getId(), t.getNombre()); }
}
