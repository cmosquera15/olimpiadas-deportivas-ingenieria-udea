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

import java.util.List;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.usuario.CandidatoJugadorDTO;

@RestController
@RequestMapping("/api/equipos")
public class EquipoController {

    private final EquipoService equipoService;
    private final UsuariosPorEquipoService plantillaService;

    public EquipoController(EquipoService equipoService,
                            UsuariosPorEquipoService plantillaService) {
        this.equipoService = equipoService;
        this.plantillaService = plantillaService;
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
        return ResponseEntity.ok(equipoService.crear(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EquipoDetailDTO> actualizar(@PathVariable Integer id,
                                                      @Valid @RequestBody EquipoUpdateDTO req) {
        return ResponseEntity.ok(equipoService.actualizar(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        equipoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{equipoId}/plantilla")
    public ResponseEntity<List<UsuariosPorEquipoDTO>> listarPlantilla(@PathVariable Integer equipoId,
                                                                  @RequestParam Integer torneoId) {
        List<UsuariosPorEquipo> plantilla = plantillaService.listarPorEquipo(equipoId, torneoId);
        return ResponseEntity.ok(plantilla.stream().map(UsuariosPorEquipoDTO::from).toList());
    }

    @PostMapping("/{equipoId}/plantilla")
    public ResponseEntity<UsuariosPorEquipo> agregarJugador(@PathVariable Integer equipoId,
                                                           @RequestParam Integer usuarioId,
                                                           @RequestParam Integer torneoId) {
        return ResponseEntity.ok(plantillaService.agregarJugador(equipoId, usuarioId, torneoId));
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
        return ResponseEntity.noContent().build();
    }
}
