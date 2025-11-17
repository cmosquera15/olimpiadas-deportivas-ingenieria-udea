package com.ingenieria.olimpiadas.olimpiadas_deportivas.controllers;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.partido.AsignarEquiposRequest;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.partido.ClasificacionDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.partido.MarcadorUpdateDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.partido.PartidoCreateDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.partido.PartidoDetailDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.partido.PartidoEstadoUpdateDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.partido.PartidoListViewDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.partido.PartidoUpdateDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.services.PartidoService;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.services.GeneradorLlavesService;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.realtime.RealtimeService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/partidos")
public class PartidoController {

    private final PartidoService svc;
    private final GeneradorLlavesService generadorLlavesService;
    private final RealtimeService realtime;
    
    public PartidoController(PartidoService svc, GeneradorLlavesService generadorLlavesService, RealtimeService realtime) { 
        this.svc = svc;
        this.generadorLlavesService = generadorLlavesService;
        this.realtime = realtime;
    }

    @GetMapping
    public ResponseEntity<Page<PartidoListViewDTO>> listar(
            @RequestParam(required = false) Integer torneoId,
            @RequestParam(required = false) Integer faseId,
            @RequestParam(required = false) Integer grupoId,
            @RequestParam(required = false) Integer arbitroId,
            Pageable pageable) {
        return ResponseEntity.ok(svc.listar(torneoId, faseId, grupoId, arbitroId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PartidoDetailDTO> detalle(@PathVariable Integer id) {
        return ResponseEntity.ok(svc.detalle(id));
    }

    @PostMapping
    public ResponseEntity<PartidoDetailDTO> crear(@Valid @RequestBody PartidoCreateDTO req) {
        PartidoDetailDTO dto = svc.crear(req);
        if (dto != null) {
            realtime.emitPartidoUpdated(dto.id(), dto.idTorneo());
            realtime.emitTorneosUpdated(dto.idTorneo());
        }
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('Partidos_Editar')")
    public ResponseEntity<PartidoDetailDTO> actualizar(@PathVariable Integer id,
                                                       @Valid @RequestBody PartidoUpdateDTO req) {
        PartidoDetailDTO dto = svc.actualizar(id, req);
        if (dto != null) {
            realtime.emitPartidoUpdated(dto.id(), dto.idTorneo());
        }
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('Partidos_Eliminar')")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        svc.eliminar(id);
        // Emit a generic update for partido list; torneoId unknown here
        realtime.emit("partidos-updated", Map.of("partidoId", id));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/asignar-equipos")
    @PreAuthorize("hasAuthority('Partidos_Editar')")
    public ResponseEntity<Void> asignarEquipos(@PathVariable Integer id,
                                               @Valid @RequestBody AsignarEquiposRequest req) {
        svc.asignarEquipos(id, req.equipoId1(), req.equipoId2());
        realtime.emit("partido-assign-updated", Map.of("partidoId", id));
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/marcador")
    @PreAuthorize("hasAuthority('Partidos_Editar')")
    public ResponseEntity<PartidoDetailDTO> actualizarMarcador(@PathVariable Integer id,
                                                               @Valid @RequestBody MarcadorUpdateDTO req) {
        PartidoDetailDTO dto = svc.actualizarMarcador(id, req);
        if (dto != null) {
            realtime.emitPartidoUpdated(dto.id(), dto.idTorneo());
            realtime.emitPosicionesUpdated(dto.idTorneo());
        }
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}/estado")
    @PreAuthorize("hasAuthority('Partidos_Editar')")
    public ResponseEntity<PartidoDetailDTO> actualizarEstado(@PathVariable Integer id,
                                                              @Valid @RequestBody PartidoEstadoUpdateDTO req) {
        PartidoDetailDTO dto = svc.actualizarEstado(id, req.estado());
        if (dto != null) {
            realtime.emitPartidoUpdated(dto.id(), dto.idTorneo());
            if ("TERMINADO".equalsIgnoreCase(req.estado())) {
                realtime.emitPosicionesUpdated(dto.idTorneo());
            }
        }
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/torneo/{torneoId}/puede-generar-llaves")
    public ResponseEntity<Map<String, Object>> puedeGenerarLlaves(@PathVariable Integer torneoId) {
        return ResponseEntity.ok(generadorLlavesService.verificarEstadoFaseGrupos(torneoId));
    }

    @GetMapping("/torneo/{torneoId}/clasificacion")
    public ResponseEntity<List<ClasificacionDTO>> obtenerClasificacion(@PathVariable Integer torneoId) {
        return ResponseEntity.ok(generadorLlavesService.obtenerClasificacion(torneoId));
    }

    @PostMapping("/torneo/{torneoId}/generar-llaves")
    @PreAuthorize("hasAuthority('Partidos_Editar')")
    public ResponseEntity<Map<String, String>> generarLlaves(@PathVariable Integer torneoId) {
        generadorLlavesService.generarLlaves(torneoId);
        realtime.emitBracketUpdated(torneoId);
        return ResponseEntity.ok(Map.of("mensaje", "Llaves generadas exitosamente"));
    }
}
