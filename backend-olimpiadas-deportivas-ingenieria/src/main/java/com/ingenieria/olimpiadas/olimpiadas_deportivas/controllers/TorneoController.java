package com.ingenieria.olimpiadas.olimpiadas_deportivas.controllers;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.common.IdNombreDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.torneo.TorneoCreateRequest;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.torneo.TorneoDetailDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.torneo.TorneoListDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.services.GeneradorLlavesService;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.services.TorneoService;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.realtime.RealtimeService;

import jakarta.validation.Valid;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.util.UriComponentsBuilder;

@RestController
@RequestMapping("/api/torneos")
public class TorneoController {

    private final TorneoService svc;
    private final GeneradorLlavesService generadorLlavesService;
    private final RealtimeService realtime;

    public TorneoController(TorneoService svc, GeneradorLlavesService generadorLlavesService, RealtimeService realtime) {
        this.svc = svc;
        this.generadorLlavesService = generadorLlavesService;
        this.realtime = realtime;
    }

    @GetMapping
    public ResponseEntity<Page<TorneoListDTO>> listar(
            @RequestParam(required = false) Integer olimpiadaId,
            @RequestParam(required = false) Integer deporteId,
            Pageable pageable) {
        return ResponseEntity.ok(svc.listar(olimpiadaId, deporteId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TorneoDetailDTO> detalle(@PathVariable Integer id) {
        return ResponseEntity.ok(svc.detalle(id));
    }

    @GetMapping("/opciones")
    public ResponseEntity<List<IdNombreDTO>> listarOpciones(
            @RequestParam(required = false) Integer olimpiadaId,
            @RequestParam(required = false) Integer deporteId) {
        return ResponseEntity.ok(svc.listarOpciones(olimpiadaId, deporteId));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('Torneos_Crear')")
    public ResponseEntity<TorneoDetailDTO> crear(@Valid @RequestBody TorneoCreateRequest req, UriComponentsBuilder uriBuilder) {
        TorneoDetailDTO dto = svc.crear(req);
        var location = uriBuilder.path("/api/torneos/{id}").buildAndExpand(dto.id()).toUri();
        realtime.emitTorneosUpdated(dto.id());
        return ResponseEntity.status(HttpStatus.CREATED).location(location).body(dto);
    }

    @PostMapping("/{id}/generar-llaves")
    @PreAuthorize("hasAuthority('Partidos_Crear')")
    public ResponseEntity<Void> generarLlaves(@PathVariable Integer id) {
        generadorLlavesService.generarLlaves(id);
        realtime.emitBracketUpdated(id);
        return ResponseEntity.noContent().build();
    }
}
