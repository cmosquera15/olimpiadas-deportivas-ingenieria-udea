package com.ingenieria.olimpiadas.olimpiadas_deportivas.services;

import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.equipo.EquipoPosicionDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.torneo.TablaPosicionesDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.exceptions.NotFoundException;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.catalogo.Resultado;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo.Equipo;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo.EquiposPorPartido;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo.Partido;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo.Torneo;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.catalogo.GrupoRepository;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.evento.EventoRepository;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.torneo.*;

@Service
public class TablaPosicionesService {

    private final TorneoRepository torneoRepository;
    private final GrupoRepository grupoRepository;
    private final PartidoRepository partidoRepository;
    private final EquiposPorPartidoRepository eppRepository;
    private final EventoRepository eventoRepository;
    private final EquipoRepository equipoRepository;

    public TablaPosicionesService(TorneoRepository torneoRepository,
                                  GrupoRepository grupoRepository,
                                  PartidoRepository partidoRepository,
                                  EquiposPorPartidoRepository eppRepository,
                                  EventoRepository eventoRepository,
                                  EquipoRepository equipoRepository) {
        this.torneoRepository = torneoRepository;
        this.grupoRepository = grupoRepository;
        this.partidoRepository = partidoRepository;
        this.eppRepository = eppRepository;
        this.eventoRepository = eventoRepository;
        this.equipoRepository = equipoRepository;
    }

    public TablaPosicionesDTO calcular(Integer torneoId, Integer grupoIdOrNull) {
        Torneo torneo = torneoRepository.findById(torneoId)
                .orElseThrow(() -> new NotFoundException("Torneo no encontrado"));

        var grupo = (grupoIdOrNull == null) ? null
                : grupoRepository.findById(grupoIdOrNull)
                .orElseThrow(() -> new NotFoundException("Grupo no encontrado"));

        // Initialize ALL teams in the torneo/grupo with zero stats
        List<Equipo> allEquipos;
        if (grupo != null) {
            allEquipos = equipoRepository.findByGrupo(grupo.getId());
        } else {
            allEquipos = equipoRepository.findByTorneoIdOrderByNombreAsc(torneoId);
        }

        List<Partido> partidos = partidoRepository.findByTorneoOrdered(torneoId);
        if (grupo != null) {
            partidos = partidos.stream()
                    .filter(p -> p.getGrupo() != null && grupo.getId().equals(p.getGrupo().getId()))
                    .toList();
        }
        
        // Solo considerar partidos TERMINADOS para la tabla de posiciones
        partidos = partidos.stream()
                .filter(p -> p.getEstado() != null && "TERMINADO".equals(p.getEstado().name()))
                .toList();

        record Stats(int equipoId, String nombre,
                     AtomicInteger pj, AtomicInteger pg, AtomicInteger pe, AtomicInteger pp, AtomicInteger wo,
                     AtomicInteger gf, AtomicInteger gc, AtomicInteger pts,
                     AtomicInteger cestasPrimerPartido) {

            static Stats of(int id, String nombre) {
                return new Stats(id, nombre,
                        new AtomicInteger(), new AtomicInteger(), new AtomicInteger(), new AtomicInteger(), new AtomicInteger(),
                        new AtomicInteger(), new AtomicInteger(), new AtomicInteger(),
                        new AtomicInteger());
            }
        }

        Map<Integer, Stats> map = new HashMap<>();

        // Pre-populate map with all teams (zero stats)
        for (Equipo equipo : allEquipos) {
            System.out.println("🔍 Pre-populating team: ID=" + equipo.getId() + ", Name=" + equipo.getNombre());
            map.put(equipo.getId(), Stats.of(equipo.getId(), equipo.getNombre()));
        }

        String depName = Optional.ofNullable(torneo.getDeporte())
                .map(d -> d.getNombre() == null ? "" : d.getNombre().toUpperCase())
                .orElse("");

        boolean esBasket = depName.contains("BALONCESTO");
        boolean esFutbol = depName.contains("FUTBOL") || depName.contains("FÚTBOL");

        for (Partido p : partidos) {
            List<EquiposPorPartido> epps = eppRepository.findByPartidoId(p.getId());
            if (epps.size() != 2) continue;

            var a = epps.get(0);
            var b = epps.get(1);

            // Only count matches that have been played (both teams have puntos AND resultado)
            boolean matchPlayed = a.getPuntos() != null && a.getResultado() != null
                    && b.getPuntos() != null && b.getResultado() != null;

            Integer aId = a.getEquipo().getId();
            Integer bId = b.getEquipo().getId();
            map.putIfAbsent(aId, Stats.of(aId, a.getEquipo().getNombre()));
            map.putIfAbsent(bId, Stats.of(bId, b.getEquipo().getNombre()));
            var sa = map.get(aId);
            var sb = map.get(bId);

            if (!matchPlayed) {
                // Match hasn't been played yet, skip stats calculation
                continue;
            }

            int pa = a.getPuntos();
            int pb = b.getPuntos();

            sa.pj.incrementAndGet();
            sb.pj.incrementAndGet();
            
            // Count goals/baskets for both sports
            sa.gf.addAndGet(pa);
            sa.gc.addAndGet(pb);
            sb.gf.addAndGet(pb);
            sb.gc.addAndGet(pa);

            // Check if either team has WO event (requiereJugador=false event)
            boolean aHasWO = eventoRepository.existsWoEventForTeamInMatch(p.getId(), aId);
            boolean bHasWO = eventoRepository.existsWoEventForTeamInMatch(p.getId(), bId);

            if (esBasket) {
                // Basketball scoring: winner=2pts, normal loser=1pt, WO loser=0pts
                if (pa > pb) {
                    sa.pg.incrementAndGet();
                    sb.pp.incrementAndGet();
                    sa.pts.addAndGet(2);      // Winner gets 2 points
                    sb.pts.addAndGet(bHasWO ? 0 : 1);  // Loser gets 1pt unless WO
                    if (bHasWO) sb.wo.incrementAndGet();
                } else if (pa < pb) {
                    sb.pg.incrementAndGet();
                    sa.pp.incrementAndGet();
                    sb.pts.addAndGet(2);      // Winner gets 2 points
                    sa.pts.addAndGet(aHasWO ? 0 : 1);  // Loser gets 1pt unless WO
                    if (aHasWO) sa.wo.incrementAndGet();
                } else {
                    // Tie in basketball (rare but possible)
                    sa.pe.incrementAndGet();
                    sb.pe.incrementAndGet();
                    // No points for draws in basketball
                }

                // Track first game scores for tiebreaker
                if (sa.cestasPrimerPartido.get() == 0) sa.cestasPrimerPartido.set(pa);
                if (sb.cestasPrimerPartido.get() == 0) sb.cestasPrimerPartido.set(pb);
            } else {
                // Football scoring: winner=3pts, draw=1pt each, WO=forfeit
                String resA = Optional.ofNullable(a.getResultado()).map(Resultado::getNombre).orElse(null);
                String resB = Optional.ofNullable(b.getResultado()).map(Resultado::getNombre).orElse(null);
                boolean aWO = resA != null && resA.equalsIgnoreCase("WO");
                boolean bWO = resB != null && resB.equalsIgnoreCase("WO");

                if (aWO ^ bWO) { // uno solo WO
                    if (aWO) { 
                        sa.wo.incrementAndGet(); 
                        sa.pp.incrementAndGet(); 
                        sb.pg.incrementAndGet(); 
                        sb.pts.addAndGet(3); 
                    } else { 
                        sb.wo.incrementAndGet(); 
                        sb.pp.incrementAndGet(); 
                        sa.pg.incrementAndGet(); 
                        sa.pts.addAndGet(3); 
                    }
                    continue;
                }

                if (pa > pb) { 
                    sa.pg.incrementAndGet(); 
                    sb.pp.incrementAndGet(); 
                    sa.pts.addAndGet(3); 
                } else if (pa < pb) { 
                    sb.pg.incrementAndGet(); 
                    sa.pp.incrementAndGet(); 
                    sb.pts.addAndGet(3); 
                } else {
                    sa.pe.incrementAndGet();
                    sb.pe.incrementAndGet();
                    sa.pts.addAndGet(1);
                    sb.pts.addAndGet(1);
                }
            }
        }

        for (var st : map.values()) {
            int totalNeg = eventoRepository
                    .sumPuntosNegativosEquipoEnFase(torneoId, "Grupo", st.equipoId);
        }

        Comparator<EquipoPosicionDTO> futbolCmp = Comparator
                .comparing(EquipoPosicionDTO::fairPlay)                                    // 1) Menor promedio Fair Play
                .thenComparing(EquipoPosicionDTO::pg, Comparator.reverseOrder())          // 2) Mayor número de partidos ganados
                .thenComparing(dto -> dto.gf() - dto.gc(), Comparator.reverseOrder())     // 3) Mayor diferencia de goles (GD)
                .thenComparing(EquipoPosicionDTO::gf, Comparator.reverseOrder())          // 4) Mayor número de goles a favor
                .thenComparing(EquipoPosicionDTO::pp)                                     // 5) Menor cantidad de partidos perdidos
                .thenComparing(EquipoPosicionDTO::gc);                                    // 6) Menor cantidad de goles en contra

        Comparator<EquipoPosicionDTO> basketCmp = Comparator
                .comparing(EquipoPosicionDTO::fairPlay)                                    // 1) Menor puntaje Fair Play
                .thenComparing(EquipoPosicionDTO::pg, Comparator.reverseOrder())          // 2) Mayor número de partidos ganados
                .thenComparing(EquipoPosicionDTO::gf, Comparator.reverseOrder())          // 3) Mayor número de cestas a favor
                .thenComparing(dto -> dto.gf() - dto.gc(), Comparator.reverseOrder());    // 4) Mayor diferencia de cestas

        Map<Integer, Integer> primerJuegoCestas = map.values().stream()
                .collect(Collectors.toMap(s -> s.equipoId, s -> s.cestasPrimerPartido.get()));

        List<EquipoPosicionDTO> posiciones = map.values().stream().map(s -> {
            int gd = s.gf.get() - s.gc.get();
            int totalNeg = eventoRepository
                    .sumPuntosNegativosEquipoEnFase(torneoId, "Grupo", s.equipoId);
            double fair = s.pj.get() > 0 ? (totalNeg * 1.0 / s.pj.get()) : 0.0;

            EquipoPosicionDTO dto = new EquipoPosicionDTO(
                    s.equipoId, s.nombre,
                    s.pj.get(), s.pg.get(), s.pe.get(), s.pp.get(),
                    s.gf.get(), s.gc.get(), gd, s.pts.get(), fair
            );
            System.out.println("🔍 Creating DTO for team: ID=" + dto.equipoId() + ", Name=" + dto.equipoNombre());
            return dto;
        }).collect(Collectors.toList());

        posiciones.sort(Comparator.comparing(EquipoPosicionDTO::pts).reversed());

        Comparator<EquipoPosicionDTO> tieBreak = esBasket ? basketCmp : futbolCmp;
        posiciones = posiciones.stream()
                .sorted(Comparator.comparing(EquipoPosicionDTO::pts).reversed()
                        .thenComparing(tieBreak)
                        .thenComparing(dto -> esBasket ? -primerJuegoCestas.getOrDefault(dto.equipoId(), 0) : 0))
                .toList();

        return new TablaPosicionesDTO(
                torneo.getId(),
                torneo.getNombre(),
                grupo != null ? grupo.getId() : null,
                grupo != null ? grupo.getNombre() : null,
                posiciones
        );
    }
}
