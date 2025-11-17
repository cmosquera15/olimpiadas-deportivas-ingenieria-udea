package com.ingenieria.olimpiadas.olimpiadas_deportivas.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.evento.EventoCreateDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.evento.EventoDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.exceptions.BadRequestException;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.exceptions.NotFoundException;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.mappers.EventoMapper;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.evento.Evento;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo.EquiposPorPartido;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.usuario.Usuario;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.evento.EventoRepository;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.evento.TipoEventoRepository;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.torneo.EquiposPorPartidoRepository;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.torneo.UsuariosPorEquipoRepository;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.usuario.UsuarioRepository;

import java.util.List;

@Service
public class EventoService {

    private final EventoRepository eventoRepository;
    private final EquiposPorPartidoRepository eppRepository;
    private final UsuarioRepository usuarioRepository;
    private final TipoEventoRepository tipoEventoRepository;
    private final UsuariosPorEquipoRepository upeRepository;
    private final EventoMapper mapper;

    public EventoService(EventoRepository eventoRepository,
                         EquiposPorPartidoRepository eppRepository,
                         UsuarioRepository usuarioRepository,
                         TipoEventoRepository tipoEventoRepository,
                         UsuariosPorEquipoRepository upeRepository,
                         EventoMapper mapper) {
        this.eventoRepository = eventoRepository;
        this.eppRepository = eppRepository;
        this.usuarioRepository = usuarioRepository;
        this.tipoEventoRepository = tipoEventoRepository;
        this.upeRepository = upeRepository;
        this.mapper = mapper;
    }

    public List<EventoDTO> listarPorPartido(Integer partidoId) {
        List<Evento> lista = eventoRepository.findByPartido(partidoId);
        return lista.stream().map(mapper::toDTO).toList();
    }

    @Transactional
    public EventoDTO crear(EventoCreateDTO req) {
        EquiposPorPartido epp = eppRepository.findById(req.getId_equipo_por_partido())
                .orElseThrow(() -> new NotFoundException("EquipoPorPartido no encontrado"));
        
        var tipo = tipoEventoRepository.findById(req.getId_tipo_evento())
                .orElseThrow(() -> new NotFoundException("Tipo de evento no encontrado"));

        // Validar jugador solo si se proporciona (eventos como WO no requieren jugador)
        Usuario jugador = null;
        if (req.getId_usuario_jugador() != null) {
            jugador = usuarioRepository.findById(req.getId_usuario_jugador())
                    .orElseThrow(() -> new NotFoundException("Jugador no encontrado"));

            Integer equipoId = epp.getEquipo().getId();
            Integer torneoId = epp.getPartido().getTorneo().getId();
            boolean pertenece = upeRepository.existsByUsuarioIdAndEquipoIdAndTorneoId(jugador.getId(), equipoId, torneoId);
            if (!pertenece) {
                throw new BadRequestException("El jugador no pertenece a la plantilla del equipo para este torneo");
            }
        }

        Evento ev = new Evento();
        ev.setEquipoPorPartido(epp);
        ev.setUsuarioJugador(jugador); // puede ser null para eventos tipo WO
        ev.setTipoEvento(tipo);
        ev.setObservaciones(req.getObservaciones());

        ev = eventoRepository.save(ev);
        return mapper.toDTO(ev);
    }

    @Transactional
    public void eliminar(Integer id) {
        eventoRepository.deleteById(id);
    }
}
