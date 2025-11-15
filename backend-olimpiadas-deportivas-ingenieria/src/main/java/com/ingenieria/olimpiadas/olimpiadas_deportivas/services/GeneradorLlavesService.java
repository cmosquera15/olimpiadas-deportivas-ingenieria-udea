package com.ingenieria.olimpiadas.olimpiadas_deportivas.services;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import java.util.Objects;
import java.util.stream.Stream;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.equipo.EquipoPosicionDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.partido.ClasificacionDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.exceptions.BadRequestException;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.exceptions.NotFoundException;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.catalogo.Fase;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.catalogo.Grupo;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo.Equipo;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo.EquiposPorPartido;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo.Partido;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo.Torneo;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.catalogo.FaseRepository;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.catalogo.GrupoRepository;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.torneo.EquipoRepository;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.torneo.EquiposPorPartidoRepository;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.torneo.PartidoRepository;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.torneo.TorneoRepository;

import jakarta.transaction.Transactional;

@Service
public class GeneradorLlavesService {

    private final TablaPosicionesService posicionesSvc;
    private final PartidoRepository partidoRepo;
    private final FaseRepository faseRepo;
    private final GrupoRepository grupoRepo;
    private final TorneoRepository torneoRepo;
    private final EquipoRepository equipoRepo;
    private final EquiposPorPartidoRepository eppRepo;

    public GeneradorLlavesService(TablaPosicionesService posicionesSvc,
                                  PartidoRepository partidoRepo,
                                  FaseRepository faseRepo,
                                  GrupoRepository grupoRepo,
                                  TorneoRepository torneoRepo,
                                  EquipoRepository equipoRepo,
                                  EquiposPorPartidoRepository eppRepo) {
        this.posicionesSvc = posicionesSvc;
        this.partidoRepo = partidoRepo;
        this.faseRepo = faseRepo;
        this.grupoRepo = grupoRepo;
        this.torneoRepo = torneoRepo;
        this.equipoRepo = equipoRepo;
        this.eppRepo = eppRepo;
    }

    /**
     * Verifica si se puede generar llaves de eliminación directa
     * @return Map con "puedeGenerar" (boolean), "partidosJugados", "partidosTotales", "mensaje"
     */
    public Map<String, Object> verificarEstadoFaseGrupos(Integer torneoId) {
        Map<String, Object> resultado = new HashMap<>();
        
        Torneo t = torneoRepo.findById(torneoId)
                .orElseThrow(() -> new NotFoundException("Torneo no encontrado"));

        List<Partido> partidosGrupos = partidoRepo.findByTorneoIdAndFaseNombre(torneoId, "Fase de Grupos");
        
        if (partidosGrupos.isEmpty()) {
            resultado.put("puedeGenerar", false);
            resultado.put("partidosJugados", 0);
            resultado.put("partidosTotales", 0);
            resultado.put("mensaje", "No hay partidos de fase de grupos registrados");
            return resultado;
        }

        long partidosTerminados = partidosGrupos.stream()
                .filter(p -> p.getEstado() != null && "TERMINADO".equals(p.getEstado().name()))
                .count();

        boolean puedeGenerar = partidosTerminados == partidosGrupos.size();

        resultado.put("puedeGenerar", puedeGenerar);
        resultado.put("partidosJugados", partidosTerminados);
        resultado.put("partidosTotales", partidosGrupos.size());
        
        if (puedeGenerar) {
            resultado.put("mensaje", "La fase de grupos ha finalizado. Puedes generar las llaves de eliminación directa.");
        } else {
            resultado.put("mensaje", String.format("Aún hay %d partido(s) pendiente(s) en la fase de grupos", 
                partidosGrupos.size() - partidosTerminados));
        }

        return resultado;
    }

    /**
     * Obtiene la información de clasificación de equipos para mostrar en la tabla de posiciones
     * @return Lista de ClasificacionDTO con información de clasificación
     */
    public List<ClasificacionDTO> obtenerClasificacion(Integer torneoId) {
        Torneo t = torneoRepo.findById(torneoId)
                .orElseThrow(() -> new NotFoundException("Torneo no encontrado"));

        String dep = t.getDeporte().getNombre().toUpperCase();
        List<ClasificacionDTO> clasificacion = new ArrayList<>();

        if (dep.contains("FUTBOL") || dep.contains("FÚTBOL")) {
            var tabla = posicionesSvc.calcular(torneoId, null).posiciones();

            Map<Integer, List<EquipoPosicionDTO>> porGrupo = new HashMap<>();
            for (EquipoPosicionDTO dto : tabla) {
                Equipo eq = equipoRepo.findById(dto.equipoId())
                        .orElseThrow(() -> new NotFoundException("Equipo no encontrado: " + dto.equipoId()));
                Integer gid = eq.getGrupo() != null ? eq.getGrupo().getId() : -1;
                porGrupo.computeIfAbsent(gid, k -> new ArrayList<>()).add(dto);
            }

            // Ordenar cada grupo
            porGrupo.values().forEach(list -> list.sort(Comparator
                    .comparing(EquipoPosicionDTO::pts).reversed()
                    .thenComparing(Comparator.comparing(EquipoPosicionDTO::fairPlay))
                    .thenComparing(dto -> dto.gf() - dto.gc(), Comparator.reverseOrder())
                    .thenComparing(EquipoPosicionDTO::gf, Comparator.reverseOrder())
                    .thenComparing(EquipoPosicionDTO::pp)
                    .thenComparing(EquipoPosicionDTO::gc)
            ));

            // Clasificar top 2 de cada grupo
            Map<Integer, String> equiposClasificados = new HashMap<>();
            for (var entry : porGrupo.entrySet()) {
                List<EquipoPosicionDTO> grupoEquipos = entry.getValue();
                Equipo eqRef = equipoRepo.findById(grupoEquipos.get(0).equipoId()).orElse(null);
                String grupoNombre = eqRef != null && eqRef.getGrupo() != null ? eqRef.getGrupo().getNombre() : "Sin grupo";
                
                for (int i = 0; i < Math.min(2, grupoEquipos.size()); i++) {
                    equiposClasificados.put(grupoEquipos.get(i).equipoId(), 
                        (i == 0 ? "1º " : "2º ") + grupoNombre);
                }
            }

            // Identificar mejores terceros
            List<EquipoPosicionDTO> terceros = porGrupo.values().stream()
                    .map(list -> list.size() >= 3 ? list.get(2) : null)
                    .filter(Objects::nonNull)
                    .sorted(Comparator
                            .comparing(EquipoPosicionDTO::pts).reversed()
                            .thenComparing(Comparator.comparing(EquipoPosicionDTO::fairPlay))
                            .thenComparing(dto -> dto.gf() - dto.gc(), Comparator.reverseOrder())
                            .thenComparing(EquipoPosicionDTO::gf, Comparator.reverseOrder())
                            .thenComparing(EquipoPosicionDTO::pp)
                            .thenComparing(EquipoPosicionDTO::gc)
                    )
                    .limit(2)
                    .toList();

            for (EquipoPosicionDTO tercero : terceros) {
                Equipo eq = equipoRepo.findById(tercero.equipoId()).orElse(null);
                String grupoNombre = eq != null && eq.getGrupo() != null ? eq.getGrupo().getNombre() : "Sin grupo";
                equiposClasificados.put(tercero.equipoId(), "Mejor 3º (" + grupoNombre + ")");
            }

            // Crear DTOs
            int posGeneral = 1;
            for (EquipoPosicionDTO dto : tabla) {
                Equipo eq = equipoRepo.findById(dto.equipoId()).orElse(null);
                String grupoNombre = eq != null && eq.getGrupo() != null ? eq.getGrupo().getNombre() : null;
                
                // Obtener posición en el grupo
                Integer grupoId = eq != null && eq.getGrupo() != null ? eq.getGrupo().getId() : -1;
                List<EquipoPosicionDTO> grupoList = porGrupo.get(grupoId);
                int posGrupo = grupoList != null ? grupoList.indexOf(dto) + 1 : 0;

                boolean clasificado = equiposClasificados.containsKey(dto.equipoId());
                String razon = equiposClasificados.get(dto.equipoId());

                clasificacion.add(new ClasificacionDTO(
                    dto.equipoId(),
                    dto.equipoNombre(),
                    posGeneral++,
                    posGrupo,
                    grupoNombre,
                    clasificado,
                    razon
                ));
            }

        } else if (dep.contains("BALONCESTO")) {
            var grupos = grupoRepo.findByTorneoIdOrderByNombreAsc(torneoId);
            
            for (var grupo : grupos) {
                var tablaGrupo = posicionesSvc.calcular(torneoId, grupo.getId()).posiciones();
                
                for (int i = 0; i < tablaGrupo.size(); i++) {
                    EquipoPosicionDTO dto = tablaGrupo.get(i);
                    boolean clasificado = i < 2; // Top 2 de cada grupo
                    String razon = clasificado ? ((i == 0 ? "1º " : "2º ") + grupo.getNombre()) : null;

                    clasificacion.add(new ClasificacionDTO(
                        dto.equipoId(),
                        dto.equipoNombre(),
                        null, // No hay posición general en baloncesto
                        i + 1,
                        grupo.getNombre(),
                        clasificado,
                        razon
                    ));
                }
            }
        }

        return clasificacion;
    }

    @Transactional
    public void generarLlaves(Integer torneoId) {
        Torneo t = torneoRepo.findById(torneoId)
                .orElseThrow(() -> new NotFoundException("Torneo no encontrado"));

        // Verificar que todos los partidos de fase de grupos estén finalizados
        List<Partido> partidosGrupos = partidoRepo.findByTorneoIdAndFaseNombre(torneoId, "Fase de Grupos");
        if (partidosGrupos.isEmpty()) {
            throw new BadRequestException("No hay partidos de fase de grupos registrados");
        }

        boolean hayPendientes = partidosGrupos.stream()
                .anyMatch(p -> p.getEstado() == null || !"TERMINADO".equals(p.getEstado().name()));

        if (hayPendientes) {
            throw new BadRequestException("No se pueden generar llaves: hay partidos de fase de grupos sin finalizar");
        }

        String dep = t.getDeporte().getNombre().toUpperCase();

        if (dep.contains("FUTBOL") || dep.contains("FÚTBOL")) {
            List<Equipo> clasificados = seleccionarFutbol(torneoId);
            if (clasificados.size() < 8) {
                throw new BadRequestException("No hay suficientes equipos clasificados para generar cuartos de final");
            }
            crearPartidosEliminacion(t, "Cuartos de Final", clasificados);
        } else if (dep.contains("BALONCESTO")) {
            List<Equipo> semifinalistas = seleccionarBasket(torneoId);
            if (semifinalistas.size() < 4) {
                throw new BadRequestException("No hay suficientes equipos clasificados para generar semifinales");
            }
            crearPartidosEliminacion(t, "Semifinal", semifinalistas);
        } else {
            throw new BadRequestException("Deporte no soportado para generación automática de llaves");
        }
    }

    private List<Equipo> seleccionarFutbol(Integer torneoId) {
        var tabla = posicionesSvc.calcular(torneoId, null).posiciones();

        Map<Integer, List<EquipoPosicionDTO>> porGrupo = new HashMap<>();
        for (EquipoPosicionDTO dto : tabla) {
            Equipo eq = equipoRepo.findById(dto.equipoId())
                    .orElseThrow(() -> new NotFoundException("Equipo no encontrado: " + dto.equipoId()));
            Integer gid = eq.getGrupo() != null ? eq.getGrupo().getId() : -1;
            porGrupo.computeIfAbsent(gid, k -> new ArrayList<>()).add(dto);
        }
        porGrupo.values().forEach(list -> list.sort(Comparator
                .comparing(EquipoPosicionDTO::pts).reversed()
                .thenComparing(Comparator.comparing(EquipoPosicionDTO::fairPlay))
                .thenComparing(dto -> dto.gf() - dto.gc(), Comparator.reverseOrder())
                .thenComparing(EquipoPosicionDTO::gf, Comparator.reverseOrder())
                .thenComparing(EquipoPosicionDTO::pp)
                .thenComparing(EquipoPosicionDTO::gc)
        ));

        List<EquipoPosicionDTO> top2DeCada = porGrupo.values().stream()
                .flatMap(list -> list.stream().limit(2))
                .toList();

        List<EquipoPosicionDTO> terceros = porGrupo.values().stream()
                .map(list -> list.size() >= 3 ? list.get(2) : null)
                .filter(Objects::nonNull)
                .toList();

        List<EquipoPosicionDTO> mejoresTerceros = terceros.stream()
                .sorted(Comparator
                        .comparing(EquipoPosicionDTO::pts).reversed()
                        .thenComparing(Comparator.comparing(EquipoPosicionDTO::fairPlay))
                        .thenComparing(dto -> dto.gf() - dto.gc(), Comparator.reverseOrder())
                        .thenComparing(EquipoPosicionDTO::gf, Comparator.reverseOrder())
                        .thenComparing(EquipoPosicionDTO::pp)
                        .thenComparing(EquipoPosicionDTO::gc)
                )
                .limit(2).toList();

        List<EquipoPosicionDTO> ocho = Stream.concat(top2DeCada.stream(), mejoresTerceros.stream())
                .sorted(Comparator
                        .comparing(EquipoPosicionDTO::pts).reversed()
                        .thenComparing(Comparator.comparing(EquipoPosicionDTO::fairPlay))
                        .thenComparing(dto -> dto.gf() - dto.gc(), Comparator.reverseOrder())
                        .thenComparing(EquipoPosicionDTO::gf, Comparator.reverseOrder())
                        .thenComparing(EquipoPosicionDTO::pp)
                        .thenComparing(EquipoPosicionDTO::gc)
                )
                .limit(8)
                .toList();

        return ocho.stream()
                .map(d -> equipoRepo.findById(d.equipoId())
                        .orElseThrow(() -> new NotFoundException("Equipo no encontrado: " + d.equipoId())))
                .toList();
    }

    private List<Equipo> seleccionarBasket(Integer torneoId) {
        var grupos = grupoRepo.findByTorneoIdOrderByNombreAsc(torneoId);
        List<EquipoPosicionDTO> acumulado = new ArrayList<>();
        for (Grupo g : grupos) {
            var tablaGrupo = posicionesSvc.calcular(torneoId, g.getId()).posiciones();
            acumulado.addAll(tablaGrupo.stream().limit(2).toList());
        }
        List<EquipoPosicionDTO> top4 = acumulado.stream()
                .sorted(Comparator
                        .comparing(EquipoPosicionDTO::pts).reversed()
                        .thenComparing(Comparator.comparing(EquipoPosicionDTO::fairPlay))
                        .thenComparing(EquipoPosicionDTO::gf, Comparator.reverseOrder())
                        .thenComparing(dto -> dto.gf() - dto.gc(), Comparator.reverseOrder())
                )
                .limit(4).toList();

        return top4.stream()
                .map(d -> equipoRepo.findById(d.equipoId())
                        .orElseThrow(() -> new NotFoundException("Equipo no encontrado: " + d.equipoId())))
                .toList();
    }

    private void crearPartidosEliminacion(Torneo t, String faseNombre, List<Equipo> orden) {
        Fase fase = faseRepo.findByNombreAndTorneoId(faseNombre, t.getId())
                .orElseThrow(() -> new NotFoundException("Fase no encontrada: " + faseNombre));

        List<int[]> cruces;
        if ("Cuartos de Final".equalsIgnoreCase(faseNombre)) {
            cruces = List.of(new int[]{0,7}, new int[]{1,6}, new int[]{2,5}, new int[]{3,4});
        } else if ("Semifinal".equalsIgnoreCase(faseNombre)) {
            cruces = List.of(new int[]{0,3}, new int[]{1,2});
        } else {
            throw new BadRequestException("Fase no soportada para generación automática: " + faseNombre);
        }

        for (int[] c : cruces) {
            Equipo e1 = orden.get(c[0]);
            Equipo e2 = orden.get(c[1]);

            Partido p = new Partido();
            p.setTorneo(t);
            p.setFase(fase);
            p.setFecha(null);
            p.setHora(null);
            p.setLugar(null);
            p.setGrupo(null);
            p.setJornada(null);
            p.setArbitro(null);
            p.setObservaciones("Partido generado automáticamente (" + faseNombre + ")");

            p = partidoRepo.save(p);

            EquiposPorPartido epp1 = EquiposPorPartido.builder()
                    .partido(p).equipo(e1).puntos(null).resultado(null).build();
            EquiposPorPartido epp2 = EquiposPorPartido.builder()
                    .partido(p).equipo(e2).puntos(null).resultado(null).build();

            eppRepo.save(epp1);
            eppRepo.save(epp2);
        }
    }
}
