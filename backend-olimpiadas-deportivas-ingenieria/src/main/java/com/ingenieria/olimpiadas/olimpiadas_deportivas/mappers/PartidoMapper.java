package com.ingenieria.olimpiadas.olimpiadas_deportivas.mappers;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.common.IdNombreDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.partido.EquipoPartidoResumenDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.partido.PartidoDetailDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.partido.PartidoListDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.partido.PartidoListViewDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo.Equipo;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo.EquiposPorPartido;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo.Partido;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface PartidoMapper {

    // ---- LIST VIEW (para /api/partidos GET)
    default PartidoListViewDTO toListView(Partido p, List<EquiposPorPartido> epps) {
        if (p == null) return null;

        IdNombreDTO torneo  = (p.getTorneo()  != null) ? new IdNombreDTO(p.getTorneo().getId(),  p.getTorneo().getNombre()) : null;
        IdNombreDTO fase    = (p.getFase()    != null) ? new IdNombreDTO(p.getFase().getId(),    p.getFase().getNombre())   : null;
        IdNombreDTO grupo   = (p.getGrupo()   != null) ? new IdNombreDTO(p.getGrupo().getId(),   p.getGrupo().getNombre())  : null;
        IdNombreDTO lugar   = (p.getLugar()   != null) ? new IdNombreDTO(p.getLugar().getId(),   p.getLugar().getNombre())  : null;
        IdNombreDTO arbitro = (p.getArbitro() != null) ? new IdNombreDTO(p.getArbitro().getId(), p.getArbitro().getNombre()): null;
        IdNombreDTO olimpiada = (p.getTorneo() != null && p.getTorneo().getOlimpiada() != null) ? new IdNombreDTO(p.getTorneo().getOlimpiada().getId(), p.getTorneo().getOlimpiada().getNombre()) : null;

        Integer ptsLoc = null, ptsVis = null;
        EquipoPartidoResumenDTO equipoLocal = null;
        EquipoPartidoResumenDTO equipoVisitante = null;

        if (epps != null && !epps.isEmpty()) {
            if (epps.size() >= 1) {
                var e1 = epps.get(0);
                var eq = e1.getEquipo();
                Integer id = (eq != null) ? eq.getId() : null;
                String nombre = (eq != null) ? eq.getNombre() : null;
                ptsLoc = e1.getPuntos();
                equipoLocal = new EquipoPartidoResumenDTO(id, nombre, ptsLoc);
            }
            if (epps.size() >= 2) {
                var e2 = epps.get(1);
                var eq = e2.getEquipo();
                Integer id = (eq != null) ? eq.getId() : null;
                String nombre = (eq != null) ? eq.getNombre() : null;
                ptsVis = e2.getPuntos();
                equipoVisitante = new EquipoPartidoResumenDTO(id, nombre, ptsVis);
            }
        }

        return new PartidoListViewDTO(
                p.getId(),
                p.getFecha(),
                p.getHora(),
                torneo,
                fase,
                grupo,
                lugar,
                arbitro,
                equipoLocal,
                equipoVisitante,
                ptsLoc,
                ptsVis,
                olimpiada
        );
    }

    // ---- LIST DTO "crudo" (compatibilidad)
    default PartidoListDTO toListDTO(Partido p) {
        if (p == null) return null;
        Integer torneoId  = (p.getTorneo()  != null) ? p.getTorneo().getId()  : null;
        Integer lugarId   = (p.getLugar()   != null) ? p.getLugar().getId()   : null;
        Integer faseId    = (p.getFase()    != null) ? p.getFase().getId()    : null;
        Integer grupoId   = (p.getGrupo()   != null) ? p.getGrupo().getId()   : null;
        Integer jornadaId = (p.getJornada() != null) ? p.getJornada().getId() : null;
        Integer arbitroId = (p.getArbitro() != null) ? p.getArbitro().getId() : null;

        return new PartidoListDTO(
                p.getId(),
                p.getFecha(),
                p.getHora(),
                torneoId,
                lugarId,
                faseId,
                grupoId,
                jornadaId,
                arbitroId
        );
    }

    // ---- DETAIL
    default PartidoDetailDTO toDetailDTO(
            Partido p,
            Integer equipoLocalId, String equipoLocalNombre, Integer equipoLocalPuntos,
            Integer equipoVisitanteId, String equipoVisitanteNombre, Integer equipoVisitantePuntos
    ) {
        if (p == null) return null;

        String torneoNombre   = (p.getTorneo()  != null) ? p.getTorneo().getNombre()  : null;
        String lugarNombre    = (p.getLugar()   != null) ? p.getLugar().getNombre()   : null;
        String faseNombre     = (p.getFase()    != null) ? p.getFase().getNombre()    : null;
        String grupoNombre    = (p.getGrupo()   != null) ? p.getGrupo().getNombre()   : null;
        Integer numeroJornada = (p.getJornada() != null) ? p.getJornada().getNumero() : null;
        String arbitroNombre  = (p.getArbitro() != null) ? p.getArbitro().getNombre() : null;
        String olimpiadaNombre = (p.getTorneo() != null && p.getTorneo().getOlimpiada() != null) ? p.getTorneo().getOlimpiada().getNombre() : null;
        String estado = (p.getEstado() != null) ? p.getEstado().name() : "PROGRAMADO";

        return new PartidoDetailDTO(
                p.getId(),
                p.getFecha(),
                p.getHora(),
                (p.getTorneo() != null) ? p.getTorneo().getId() : null,
                torneoNombre,
                (p.getLugar()  != null) ? p.getLugar().getId()  : null,
                lugarNombre,
                (p.getFase()   != null) ? p.getFase().getId()   : null,
                faseNombre,
                (p.getGrupo()  != null) ? p.getGrupo().getId()  : null,
                grupoNombre,
                (p.getJornada()!= null) ? p.getJornada().getId(): null,
                numeroJornada,
                (p.getArbitro()!= null) ? p.getArbitro().getId(): null,
                arbitroNombre,
                p.getObservaciones(),
                equipoLocalId,
                equipoLocalNombre,
                equipoLocalPuntos,
                equipoVisitanteId,
                equipoVisitanteNombre,
                equipoVisitantePuntos,
                (p.getTorneo() != null && p.getTorneo().getOlimpiada() != null) ? p.getTorneo().getOlimpiada().getId() : null,
                olimpiadaNombre,
                estado
        );
    }

    default PartidoDetailDTO toDetailDTO(Partido p, List<EquiposPorPartido> epps) {
        if (p == null) return null;

        Integer localId = null, visId = null, ptsLoc = null, ptsVis = null;
        String  localNm = null, visNm = null;

        if (epps != null && !epps.isEmpty()) {
            if (epps.size() >= 1) {
                Equipo eq = epps.get(0).getEquipo();
                localId = (eq != null) ? eq.getId() : null;
                localNm = (eq != null) ? eq.getNombre() : null;
                ptsLoc  = epps.get(0).getPuntos();
            }
            if (epps.size() >= 2) {
                Equipo eq = epps.get(1).getEquipo();
                visId = (eq != null) ? eq.getId() : null;
                visNm = (eq != null) ? eq.getNombre() : null;
                ptsVis = epps.get(1).getPuntos();
            }
        }
        return toDetailDTO(p, localId, localNm, ptsLoc, visId, visNm, ptsVis);
    }
}
