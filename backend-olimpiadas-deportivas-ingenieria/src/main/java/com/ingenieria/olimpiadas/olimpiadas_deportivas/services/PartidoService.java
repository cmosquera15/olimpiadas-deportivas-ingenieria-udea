package com.ingenieria.olimpiadas.olimpiadas_deportivas.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.partido.*;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.exceptions.*;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.mappers.PartidoMapper;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.catalogo.*;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo.*;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.usuario.Usuario;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.catalogo.*;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.torneo.*;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.usuario.UsuarioRepository;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.util.Constants;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Service
public class PartidoService {

    private final PartidoRepository partidoRepository;
    private final TorneoRepository torneoRepository;
    private final LugarRepository lugarRepository;
    private final JornadaRepository jornadaRepository;
    private final FaseRepository faseRepository;
    private final GrupoRepository grupoRepository;
    private final UsuarioRepository usuarioRepository;
    private final EquiposPorPartidoRepository eppRepository;
    private final EquipoRepository equipoRepository;
    private final ResultadoRepository resultadoRepository;
    private final PartidoMapper mapper;

    public PartidoService(PartidoRepository partidoRepository,
                          TorneoRepository torneoRepository,
                          LugarRepository lugarRepository,
                          JornadaRepository jornadaRepository,
                          FaseRepository faseRepository,
                          GrupoRepository grupoRepository,
                          UsuarioRepository usuarioRepository,
                          EquiposPorPartidoRepository eppRepository,
                          EquipoRepository equipoRepository,
                          ResultadoRepository resultadoRepository,
                          PartidoMapper mapper) {
        this.partidoRepository = partidoRepository;
        this.torneoRepository = torneoRepository;
        this.lugarRepository = lugarRepository;
        this.jornadaRepository = jornadaRepository;
        this.faseRepository = faseRepository;
        this.grupoRepository = grupoRepository;
        this.usuarioRepository = usuarioRepository;
        this.eppRepository = eppRepository;
        this.equipoRepository = equipoRepository;
        this.resultadoRepository = resultadoRepository;
        this.mapper = mapper;
    }

    @Transactional
    public Partido crear(Partido p) {
        validarSolape(p);
        return partidoRepository.save(p);
    }

    @Transactional
    public Partido editar(Integer id, Partido cambios) {
        Partido p = partidoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Partido no encontrado"));

        p.setFecha(cambios.getFecha());
        p.setHora(cambios.getHora());
        p.setLugar(cambios.getLugar());
        p.setFase(cambios.getFase());
        p.setGrupo(cambios.getGrupo());
        p.setJornada(cambios.getJornada());
        p.setArbitro(cambios.getArbitro());
        p.setObservaciones(cambios.getObservaciones());

        validarSolape(p);
        return partidoRepository.save(p);
    }

    @Transactional
    public void asignarEquipos(Integer partidoId, Integer equipoId1, Integer equipoId2) {
        Partido p = partidoRepository.findById(partidoId)
                .orElseThrow(() -> new NotFoundException("Partido no encontrado"));
        Equipo e1 = equipoRepository.findById(equipoId1)
                .orElseThrow(() -> new NotFoundException("Equipo no encontrado: " + equipoId1));
        Equipo e2 = equipoRepository.findById(equipoId2)
                .orElseThrow(() -> new NotFoundException("Equipo no encontrado: " + equipoId2));

        long count = eppRepository.countByPartido(partidoId);
        if (count > 0) {
            List<EquiposPorPartido> actuales = eppRepository.findByPartidoId(partidoId);
            eppRepository.deleteAll(actuales);
        }

        eppRepository.save(EquiposPorPartido.builder().partido(p).equipo(e1).build());
        eppRepository.save(EquiposPorPartido.builder().partido(p).equipo(e2).build());
    }

    @Transactional
    public PartidoDetailDTO actualizarMarcador(Integer partidoId, MarcadorUpdateDTO req) {
        Partido p = partidoRepository.findById(partidoId)
                .orElseThrow(() -> new NotFoundException("Partido no encontrado"));

        List<EquiposPorPartido> epps = eppRepository.findByPartidoId(partidoId);
        if (epps.size() != 2) {
            throw new BadRequestException("El partido debe tener exactamente dos equipos asignados");
        }

        Map<Integer, EquiposPorPartido> porEquipo = new HashMap<>();
        for (EquiposPorPartido epp : epps) {
            porEquipo.put(epp.getEquipo().getId(), epp);
        }
        EquiposPorPartido epp1 = porEquipo.get(req.equipo1Id());
        EquiposPorPartido epp2 = porEquipo.get(req.equipo2Id());
        if (epp1 == null || epp2 == null) {
            throw new BadRequestException("Los equipos del request no coinciden con los asignados al partido");
        }

        Resultado res1 = null, res2 = null;
        if (req.resultadoEquipo1Id() != null) {
            res1 = resultadoRepository.findById(req.resultadoEquipo1Id())
                    .orElseThrow(() -> new NotFoundException("Resultado no encontrado: " + req.resultadoEquipo1Id()));
        }
        if (req.resultadoEquipo2Id() != null) {
            res2 = resultadoRepository.findById(req.resultadoEquipo2Id())
                    .orElseThrow(() -> new NotFoundException("Resultado no encontrado: " + req.resultadoEquipo2Id()));
        }

        boolean esBasket = Optional.ofNullable(p.getTorneo())
                .map(Torneo::getDeporte)
                .map(Deporte::getNombre)
                .map(String::toUpperCase)
                .map(n -> n.contains("BALONCESTO"))
                .orElse(false);

        Integer pts1 = req.puntosEquipo1();
        Integer pts2 = req.puntosEquipo2();

        boolean algunoEsWO = (res1 != null && esWO(res1)) || (res2 != null && esWO(res2));
        if (esBasket && pts1 != null && pts2 != null && Objects.equals(pts1, pts2) && !algunoEsWO) {
            throw new BadRequestException("En baloncesto no se permiten empates. Asigne WO a un equipo si corresponde.");
        }

        epp1.setPuntos(pts1);
        epp2.setPuntos(pts2);
        epp1.setResultado(res1);
        epp2.setResultado(res2);

        eppRepository.saveAll(List.of(epp1, epp2));

        List<EquiposPorPartido> eppsActualizados = eppRepository.findByPartidoId(partidoId);
        return mapper.toDetailDTO(p, eppsActualizados);
    }

    private boolean esWO(Resultado r) {
        if (r == null || r.getNombre() == null) return false;
        String n = r.getNombre().toUpperCase(Locale.ROOT).replace(".", "");
        return n.equals("WO") || n.equals("W O"); // tolerante a "W.O."
    }

    private void validarSolape(Partido p) {
        if (p.getFecha() == null || p.getHora() == null || p.getLugar() == null) return;

        List<Partido> conflictos = partidoRepository.findConflictsSameDateTimeAndLugar(
                p.getTorneo().getId(), p.getFecha(), p.getHora(), p.getLugar().getId());

        if (p.getId() != null) {
            conflictos = conflictos.stream().filter(x -> !x.getId().equals(p.getId())).toList();
        }
        if (!conflictos.isEmpty()) {
            throw new BadRequestException("Ya existe un partido en el mismo lugar, fecha y hora.");
        }

        if (p.getFecha().isBefore(LocalDate.now(ZoneId.of(Constants.ZONA_BOGOTA)))) {
            throw new BadRequestException("No se pueden agendar partidos en fechas pasadas.");
        }
    }

    public Page<PartidoListViewDTO> listar(Integer torneoId, Integer faseId, Integer grupoId, Integer arbitroId, Pageable pageable) {
        // 1) Traer base de partidos, ya ordenados
        List<Partido> base;
        if (torneoId != null) {
            base = partidoRepository.findByTorneoOrdered(torneoId);
        } else {
            base = partidoRepository.findAll();
            base.sort(Comparator.comparing(Partido::getFecha).thenComparing(Partido::getHora));
        }

        // 2) Filtros en memoria (podrías llevarlos a queries si prefieres)
        if (faseId != null)
            base = base.stream().filter(p -> p.getFase()   != null && faseId.equals(p.getFase().getId())).toList();
        if (grupoId != null)
            base = base.stream().filter(p -> p.getGrupo()  != null && grupoId.equals(p.getGrupo().getId())).toList();
        if (arbitroId != null)
            base = base.stream().filter(p -> p.getArbitro()!= null && arbitroId.equals(p.getArbitro().getId())).toList();

        // 3) Mapear a ListView incluyendo equipos y puntos (si hay EPPs)
        List<PartidoListViewDTO> dtos = base.stream().map(p -> {
            List<EquiposPorPartido> epps = eppRepository.findByPartidoIdOrderByIdAsc(p.getId());
            return mapper.toListView(p, epps);
        }).toList();

        // 4) Paginación manual sobre la lista ya mapeada
        int start = (int) pageable.getOffset();
        int end   = Math.min(start + pageable.getPageSize(), dtos.size());
        List<PartidoListViewDTO> slice = (start > end) ? List.of() : dtos.subList(start, end);

        return new PageImpl<>(slice, pageable, dtos.size());
    }

    @Transactional
    public PartidoDetailDTO crear(PartidoCreateDTO req) {
        Torneo torneo = torneoRepository.findById(req.getId_torneo())
                .orElseThrow(() -> new NotFoundException("Torneo no encontrado"));
        Lugar lugar = lugarRepository.findById(req.getId_lugar())
                .orElseThrow(() -> new NotFoundException("Lugar no encontrado"));
        Fase fase = faseRepository.findById(req.getId_fase())
                .orElseThrow(() -> new NotFoundException("Fase no encontrada"));

        Jornada jornada = null;
        if (req.getId_jornada() != null) {
            jornada = jornadaRepository.findById(req.getId_jornada())
                    .orElseThrow(() -> new NotFoundException("Jornada no encontrada"));
            if (!jornada.getTorneo().getId().equals(torneo.getId()))
                throw new BadRequestException("La jornada no pertenece al torneo");
        }

        Grupo grupo = null;
        if (req.getId_grupo() != null) {
            grupo = grupoRepository.findById(req.getId_grupo())
                    .orElseThrow(() -> new NotFoundException("Grupo no encontrado"));
            if (!grupo.getTorneo().getId().equals(torneo.getId()))
                throw new BadRequestException("El grupo no pertenece al torneo");
        }

        Usuario arbitro = usuarioRepository.findById(req.getId_usuario_arbitro())
                .orElseThrow(() -> new NotFoundException("Árbitro no encontrado"));
        if (!"ARBITRO".equalsIgnoreCase(arbitro.getRol().getNombre())) {
            throw new BadRequestException("El usuario seleccionado no tiene rol de Árbitro");
        }

        Partido p = new Partido();
        p.setFecha(req.getFecha());
        p.setHora(req.getHora());
        p.setLugar(lugar);
        p.setJornada(jornada);
        p.setFase(fase);
        p.setGrupo(grupo);
        p.setObservaciones(req.getObservaciones());
        p.setArbitro(arbitro);
        p.setTorneo(torneo);

        p = partidoRepository.save(p);
        return mapper.toDetailDTO(p, List.of());
    }

    public PartidoDetailDTO detalle(Integer id) {
        Partido p = partidoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Partido no encontrado"));

        var epps = eppRepository.findByPartidoId(p.getId())
                .stream().sorted(Comparator.comparing(EquiposPorPartido::getId)).toList();

        Integer locId = null, visId = null, locPts = null, visPts = null;
        Integer idEppLoc = null, idEppVis = null;
        String locNom = null, visNom = null;

        if (epps.size() >= 1) {
            var e1 = epps.get(0);
            locId  = e1.getEquipo().getId();
            locNom = e1.getEquipo().getNombre();
            locPts = e1.getPuntos();
            idEppLoc = e1.getId();
        }
        if (epps.size() >= 2) {
            var e2 = epps.get(1);
            visId  = e2.getEquipo().getId();
            visNom = e2.getEquipo().getNombre();
            visPts = e2.getPuntos();
            idEppVis = e2.getId();
        }

        return mapper.toDetailDTO(p, locId, locNom, locPts, idEppLoc, visId, visNom, visPts, idEppVis);
    }

    @Transactional
    public PartidoDetailDTO actualizar(Integer id, PartidoUpdateDTO req) {
        Partido p = partidoRepository.findById(id).orElseThrow(() -> new NotFoundException("Partido no encontrado"));

        if (req.getFecha() != null) p.setFecha(req.getFecha());
        if (req.getHora() != null) p.setHora(req.getHora());
        if (req.getId_lugar() != null) p.setLugar(lugarRepository.findById(req.getId_lugar())
                .orElseThrow(() -> new NotFoundException("Lugar no encontrado")));

        if (req.getId_jornada() != null) {
            Jornada j = jornadaRepository.findById(req.getId_jornada())
                    .orElseThrow(() -> new NotFoundException("Jornada"));
            if (!j.getTorneo().getId().equals(p.getTorneo().getId()))
                throw new BadRequestException("La jornada no pertenece al torneo del partido");
            p.setJornada(j);
        }
        if (req.getId_fase() != null) {
            p.setFase(faseRepository.findById(req.getId_fase())
                    .orElseThrow(() -> new NotFoundException("Fase")));
        }
        if (req.getId_grupo() != null) {
            Grupo g = grupoRepository.findById(req.getId_grupo())
                    .orElseThrow(() -> new NotFoundException("Grupo"));
            if (!g.getTorneo().getId().equals(p.getTorneo().getId()))
                throw new BadRequestException("El grupo no pertenece al torneo del partido");
            p.setGrupo(g);
        }
        if (req.getId_usuario_arbitro() != null) {
            Usuario a = usuarioRepository.findById(req.getId_usuario_arbitro())
                    .orElseThrow(() -> new NotFoundException("Árbitro"));
            if (!"ARBITRO".equalsIgnoreCase(a.getRol().getNombre()))
                throw new BadRequestException("El usuario no tiene rol de Árbitro");
            p.setArbitro(a);
        }
        if (req.getObservaciones() != null) p.setObservaciones(req.getObservaciones());

        Partido saved = partidoRepository.save(p);
        List<EquiposPorPartido> epps = eppRepository.findByPartidoId(saved.getId());
        return mapper.toDetailDTO(saved, epps);
    }

    @Transactional
    public PartidoDetailDTO asignarEquipos(Integer partidoId, PartidoAssignTeamsDTO req) {
        Partido p = partidoRepository.findById(partidoId).orElseThrow(() -> new NotFoundException("Partido no encontrado"));

        Equipo local = equipoRepository.findById(req.getEquipo_local_id())
                .orElseThrow(() -> new NotFoundException("Equipo local no encontrado"));
        Equipo visita = equipoRepository.findById(req.getEquipo_visitante_id())
                .orElseThrow(() -> new NotFoundException("Equipo visitante no encontrado"));

        if (!local.getTorneo().getId().equals(p.getTorneo().getId())
                || !visita.getTorneo().getId().equals(p.getTorneo().getId())) {
            throw new BadRequestException("Los equipos deben pertenecer al torneo del partido");
        }
        if (p.getFase() != null && "GRUPOS".equalsIgnoreCase(p.getFase().getNombre())) {
            if (p.getGrupo() == null || local.getGrupo() == null || visita.getGrupo() == null
                    || !local.getGrupo().getId().equals(p.getGrupo().getId())
                    || !visita.getGrupo().getId().equals(p.getGrupo().getId())) {
                throw new BadRequestException("En fase de grupos, ambos equipos deben pertenecer al grupo del partido");
            }
        }

        List<EquiposPorPartido> prev = eppRepository.findByPartidoId(p.getId());
        if (!prev.isEmpty()) eppRepository.deleteAll(prev);

        EquiposPorPartido eLocal = new EquiposPorPartido();
        eLocal.setPartido(p);
        eLocal.setEquipo(local);
        eLocal.setPuntos(0);

        EquiposPorPartido eVisita = new EquiposPorPartido();
        eVisita.setPartido(p);
        eVisita.setEquipo(visita);
        eVisita.setPuntos(0);

        eppRepository.saveAll(List.of(eLocal, eVisita));

        List<EquiposPorPartido> epps = eppRepository.findByPartidoId(p.getId());
        return mapper.toDetailDTO(p, epps);
    }

    @Transactional
    public PartidoDetailDTO setScore(Integer partidoId, PartidoSetScoreDTO req) {
        Partido p = partidoRepository.findById(partidoId).orElseThrow(() -> new NotFoundException("Partido no encontrado"));
        List<EquiposPorPartido> epps = eppRepository.findByPartidoId(p.getId());
        if (epps.size() != 2) throw new BadRequestException("El partido no tiene exactamente dos equipos asignados");

        EquiposPorPartido eLocal = epps.stream().filter(e -> e.getEquipo().getId().equals(req.getEquipo_local_id()))
                .findFirst().orElseThrow(() -> new BadRequestException("Equipo local no coincide con el partido"));
        EquiposPorPartido eVisita = epps.stream().filter(e -> e.getEquipo().getId().equals(req.getEquipo_visitante_id()))
                .findFirst().orElseThrow(() -> new BadRequestException("Equipo visitante no coincide con el partido"));

        eLocal.setPuntos(req.getPuntos_local());
        eVisita.setPuntos(req.getPuntos_visitante());
        eppRepository.saveAll(List.of(eLocal, eVisita));

        var ganador = resultadoRepository.findByNombreIgnoreCase("GANADOR").orElse(null);
        var perdedor = resultadoRepository.findByNombreIgnoreCase("PERDEDOR").orElse(null);
        var empate  = resultadoRepository.findByNombreIgnoreCase("EMPATE").orElse(null);

        String dep = p.getTorneo().getDeporte() != null ? p.getTorneo().getDeporte().getNombre().toUpperCase() : "";
        if (dep.contains("BALONCESTO")) {
            if (req.getPuntos_local() > req.getPuntos_visitante()) { eLocal.setResultado(ganador); eVisita.setResultado(perdedor); }
            else if (req.getPuntos_local() < req.getPuntos_visitante()) { eLocal.setResultado(perdedor); eVisita.setResultado(ganador); }
            else { throw new BadRequestException("En baloncesto no hay empates"); }
        } else {
            if (req.getPuntos_local() > req.getPuntos_visitante()) { eLocal.setResultado(ganador); eVisita.setResultado(perdedor); }
            else if (req.getPuntos_local() < req.getPuntos_visitante()) { eLocal.setResultado(perdedor); eVisita.setResultado(ganador); }
            else { eLocal.setResultado(empate); eVisita.setResultado(empate); }
        }
        eppRepository.saveAll(List.of(eLocal, eVisita));

        List<EquiposPorPartido> refreshed = eppRepository.findByPartidoId(p.getId());
        return mapper.toDetailDTO(p, refreshed);
    }

    @Transactional
    public void eliminar(Integer id) {
        List<EquiposPorPartido> epps = eppRepository.findByPartidoId(id);
        if (!epps.isEmpty()) eppRepository.deleteAll(epps);
        partidoRepository.deleteById(id);
    }

    @Transactional
    public PartidoDetailDTO actualizarEstado(Integer partidoId, String estado) {
        Partido p = partidoRepository.findById(partidoId)
                .orElseThrow(() -> new NotFoundException("Partido no encontrado"));
        
        try {
            EstadoPartido nuevoEstado = EstadoPartido.valueOf(estado.toUpperCase());
            p.setEstado(nuevoEstado);
            
            // Si cambia a TERMINADO, validar que tenga marcador
            if (nuevoEstado == EstadoPartido.TERMINADO) {
                List<EquiposPorPartido> epps = eppRepository.findByPartidoId(partidoId);
                if (epps.size() == 2) {
                    boolean tieneMarcador = epps.get(0).getPuntos() != null && epps.get(1).getPuntos() != null;
                    if (!tieneMarcador) {
                        throw new BadRequestException("No se puede marcar como TERMINADO sin actualizar el marcador");
                    }
                }
            }
            
            partidoRepository.save(p);
            List<EquiposPorPartido> epps = eppRepository.findByPartidoId(partidoId);
            return mapper.toDetailDTO(p, epps);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Estado inválido. Valores permitidos: PROGRAMADO, TERMINADO, APLAZADO");
        }
    }
}
