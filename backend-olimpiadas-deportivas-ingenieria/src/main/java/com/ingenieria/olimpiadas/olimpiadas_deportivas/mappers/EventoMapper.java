package com.ingenieria.olimpiadas.olimpiadas_deportivas.mappers;

import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.common.IdNombreDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.evento.EventoDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.catalogo.Deporte;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.evento.Evento;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface EventoMapper {

    IdNombreDTO mapDeporteToIdNombre(Deporte d);

    default EventoDTO toDTO(Evento ev) {
        if (ev == null) return null;

        Integer eppId = ev.getEquipoPorPartido() != null ? ev.getEquipoPorPartido().getId() : null;

        Integer jugadorId = ev.getUsuarioJugador() != null ? ev.getUsuarioJugador().getId() : null;
        String  jugadorNm = ev.getUsuarioJugador() != null ? ev.getUsuarioJugador().getNombre() : null;

        Integer tipoEvId = ev.getTipoEvento() != null ? ev.getTipoEvento().getId() : null;
        String  tipoEvNm = ev.getTipoEvento() != null ? ev.getTipoEvento().getNombre() : null;
        Integer ptsNeg   = ev.getTipoEvento() != null ? ev.getTipoEvento().getPuntosNegativos() : null;

        return new EventoDTO(
                ev.getId(),
                eppId,
                jugadorId,
                jugadorNm,
                tipoEvId,
                tipoEvNm,
                ptsNeg,
                ev.getObservaciones()
        );
    }
}
