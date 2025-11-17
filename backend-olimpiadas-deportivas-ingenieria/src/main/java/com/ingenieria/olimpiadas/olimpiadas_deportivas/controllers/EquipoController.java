package com.ingenieria.olimpiadas.olimpiadas_deportivas.controllers;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.equipo.EquipoCreateDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.equipo.EquipoDetailDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.equipo.EquipoListDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.equipo.EquipoUpdateDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.plantilla.UsuariosPorEquipoDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo.UsuariosPorEquipo;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.services.EquipoService;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.services.UsuariosPorEquipoService;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.realtime.RealtimeService;

import java.util.List;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.usuario.CandidatoJugadorDTO;

@RestController
@RequestMapping("/api/equipos")
public class EquipoController {

    private final EquipoService equipoService;
    private final UsuariosPorEquipoService plantillaService;
    private final RealtimeService realtime;

    public EquipoController(EquipoService equipoService,
                            UsuariosPorEquipoService plantillaService,
                            RealtimeService realtime) {
        this.equipoService = equipoService;
        this.plantillaService = plantillaService;
        this.realtime = realtime;
    }

    @GetMapping
    public ResponseEntity<Page<EquipoListDTO>> listar(
            @RequestParam(required = false) Integer torneoId,
            @RequestParam(required = false) Integer grupoId,
            Pageable pageable) {
        return ResponseEntity.ok(equipoService.listar(torneoId, grupoId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EquipoDetailDTO> detalle(@PathVariable Integer id) {
        return ResponseEntity.ok(equipoService.detalle(id));
    }

    @PostMapping
    public ResponseEntity<EquipoDetailDTO> crear(@Valid @RequestBody EquipoCreateDTO req) {
        EquipoDetailDTO dto = equipoService.crear(req);
        if (dto != null) {
            Integer torneoId = dto.id_torneo();
            if (torneoId != null) {
                realtime.emitEquiposUpdated(torneoId);
            }
        }
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EquipoDetailDTO> actualizar(@PathVariable Integer id,
                                                      @Valid @RequestBody EquipoUpdateDTO req) {
        EquipoDetailDTO dto = equipoService.actualizar(id, req);
        if (dto != null) {
            Integer torneoId = dto.id_torneo();
            if (torneoId != null) {
                realtime.emitEquiposUpdated(torneoId);
            }
        }
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        equipoService.eliminar(id);
        realtime.emit("equipos-updated", java.util.Map.of("equipoId", id));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{equipoId}/plantilla")
    public ResponseEntity<List<UsuariosPorEquipoDTO>> listarPlantilla(@PathVariable Integer equipoId,
                                                                  @RequestParam Integer torneoId) {
        List<UsuariosPorEquipo> plantilla = plantillaService.listarPorEquipo(equipoId, torneoId);
        realtime.emitEquiposUpdated(torneoId);
        return ResponseEntity.ok(plantilla.stream().map(UsuariosPorEquipoDTO::from).toList());
    }

    @PostMapping("/{equipoId}/plantilla")
    public ResponseEntity<UsuariosPorEquipo> agregarJugador(@PathVariable Integer equipoId,
                                                           @RequestParam Integer usuarioId,
                                                           @RequestParam Integer torneoId) {
        UsuariosPorEquipo res = plantillaService.agregarJugador(equipoId, usuarioId, torneoId);
        realtime.emitEquiposUpdated(torneoId);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/{equipoId}/candidatos")
    public ResponseEntity<Page<CandidatoJugadorDTO>> candidatos(
            @PathVariable Integer equipoId,
            @RequestParam Integer torneoId,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(plantillaService.candidatos(equipoId, torneoId, q, page, size));
    }

    @DeleteMapping("/plantilla/{usuariosPorEquipoId}")
    public ResponseEntity<Void> removerJugador(@PathVariable Integer usuariosPorEquipoId) {
        plantillaService.removerJugador(usuariosPorEquipoId);
        realtime.emit("equipos-updated", java.util.Map.of("usuariosPorEquipoId", usuariosPorEquipoId));
        return ResponseEntity.noContent().build();
    }
}
