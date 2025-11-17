package com.ingenieria.olimpiadas.olimpiadas_deportivas.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.evento.EventoCreateDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.evento.EventoDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.services.EventoService;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.realtime.RealtimeService;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.torneo.EquiposPorPartidoRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/eventos")
public class EventoController {

    private final EventoService svc;
    private final RealtimeService realtime;
    private final EquiposPorPartidoRepository eppRepository;
    public EventoController(EventoService svc, RealtimeService realtime, EquiposPorPartidoRepository eppRepository) {
        this.svc = svc;
        this.realtime = realtime;
        this.eppRepository = eppRepository;
    }

    @GetMapping
    public ResponseEntity<List<EventoDTO>> listarPorPartido(@RequestParam Integer partidoId) {
        return ResponseEntity.ok(svc.listarPorPartido(partidoId));
    }

    @PostMapping
    public ResponseEntity<EventoDTO> crear(@Valid @RequestBody EventoCreateDTO req) {
        EventoDTO created = svc.crear(req);
        if (created != null && req.getId_equipo_por_partido() != null) {
            Integer partidoId = eppRepository.findById(req.getId_equipo_por_partido())
                    .map(epp -> epp.getPartido().getId())
                    .orElse(null);
            if (partidoId != null) {
                realtime.emitEventosUpdated(partidoId);
            }
        }
        return ResponseEntity.ok(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        svc.eliminar(id);
        // Notificamos que la lista de eventos cambió (no tenemos partidoId aquí)
        realtime.emit("eventos-updated", java.util.Map.of("id", id));
        return ResponseEntity.noContent().build();
    }
}
