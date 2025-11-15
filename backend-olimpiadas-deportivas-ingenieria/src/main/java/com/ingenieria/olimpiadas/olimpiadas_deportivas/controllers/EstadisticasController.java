package com.ingenieria.olimpiadas.olimpiadas_deportivas.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.estadistica.GoleadorDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.services.TablaGoleadoresService;

@RestController
@RequestMapping("/api/estadisticas")
public class EstadisticasController {

    private final TablaGoleadoresService tablaGoleadoresService;

    public EstadisticasController(TablaGoleadoresService tablaGoleadoresService) {
        this.tablaGoleadoresService = tablaGoleadoresService;
    }

    @GetMapping("/goleadores")
    public ResponseEntity<List<GoleadorDTO>> obtenerGoleadores(@RequestParam Integer torneoId) {
        return ResponseEntity.ok(tablaGoleadoresService.obtenerGoleadores(torneoId));
    }
}
