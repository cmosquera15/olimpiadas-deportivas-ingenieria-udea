package com.ingenieria.olimpiadas.olimpiadas_deportivas.services;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.estadistica.GoleadorDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.exceptions.NotFoundException;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo.Torneo;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.usuario.Usuario;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.evento.EventoRepository;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.torneo.TorneoRepository;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.torneo.UsuariosPorEquipoRepository;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.usuario.UsuarioRepository;

@Service
public class TablaGoleadoresService {

    private final EventoRepository eventoRepository;
    private final TorneoRepository torneoRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuariosPorEquipoRepository upeRepository;

    public TablaGoleadoresService(EventoRepository eventoRepository,
                                  TorneoRepository torneoRepository,
                                  UsuarioRepository usuarioRepository,
                                  UsuariosPorEquipoRepository upeRepository) {
        this.eventoRepository = eventoRepository;
        this.torneoRepository = torneoRepository;
        this.usuarioRepository = usuarioRepository;
        this.upeRepository = upeRepository;
    }

    public List<GoleadorDTO> obtenerGoleadores(Integer torneoId) {
        Torneo torneo = torneoRepository.findById(torneoId)
                .orElseThrow(() -> new NotFoundException("Torneo no encontrado"));

        // Obtener todos los jugadores inscritos en el torneo
        var usuariosEnTorneo = upeRepository.findByTorneoId(torneoId).stream()
                .map(upe -> upe.getUsuario())
                .distinct()
                .collect(Collectors.toList());

        // Para cada jugador, contar sus goles
        List<GoleadorDTO> goleadores = new ArrayList<>();
        
        for (Usuario usuario : usuariosEnTorneo) {
            Long totalGoles = eventoRepository.countGolesByUsuarioInTorneo(torneoId, usuario.getId());
            
            // Solo incluir jugadores con al menos 1 gol
            if (totalGoles > 0) {
                // Obtener el equipo del jugador en este torneo
                var upe = upeRepository.findByUsuarioIdAndTorneoId(usuario.getId(), torneoId).stream()
                        .findFirst()
                        .orElse(null);
                
                if (upe != null) {
                    goleadores.add(new GoleadorDTO(
                            usuario.getId(),
                            usuario.getNombre(),
                            usuario.getFotoUrl(),
                            upe.getEquipo().getId(),
                            upe.getEquipo().getNombre(),
                            totalGoles
                    ));
                }
            }
        }

        // Ordenar por total de goles descendente
        goleadores.sort(Comparator.comparing(GoleadorDTO::totalGoles).reversed()
                .thenComparing(GoleadorDTO::nombreJugador));

        return goleadores;
    }
}
