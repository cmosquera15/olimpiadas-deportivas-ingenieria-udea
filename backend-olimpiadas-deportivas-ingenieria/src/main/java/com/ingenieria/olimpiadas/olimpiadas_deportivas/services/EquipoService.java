package com.ingenieria.olimpiadas.olimpiadas_deportivas.services;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.equipo.*;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.exceptions.*;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.mappers.EquipoMapper;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.catalogo.*;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo.*;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.usuario.Usuario;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.catalogo.*;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.torneo.*;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.usuario.UsuarioRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.text.Normalizer;

@Service
public class EquipoService {
    private static final Logger log = LoggerFactory.getLogger(EquipoService.class);

    private final EquipoRepository equipoRepository;
    private final TorneoRepository torneoRepository;
    private final GrupoRepository grupoRepository;
    private final ProgramaAcademicoRepository programaRepository;
    private final UsuarioRepository usuarioRepository;
    private final EquipoMapper mapper;
    private final UsuariosPorEquipoRepository usuariosPorEquipoRepository;

    public EquipoService(EquipoRepository equipoRepository,
                         TorneoRepository torneoRepository,
                         GrupoRepository grupoRepository,
                         ProgramaAcademicoRepository programaRepository,
                         UsuarioRepository usuarioRepository,
                         UsuariosPorEquipoRepository usuariosPorEquipoRepository,
                         EquipoMapper mapper) {
        this.equipoRepository = equipoRepository;
        this.torneoRepository = torneoRepository;
        this.grupoRepository = grupoRepository;
        this.programaRepository = programaRepository;
        this.usuarioRepository = usuarioRepository;
        this.mapper = mapper;
        this.usuariosPorEquipoRepository = usuariosPorEquipoRepository;
    }

    public Page<EquipoListDTO> listar(Integer torneoId, Integer grupoId, Pageable pageable) {
        List<Equipo> base;
        if (torneoId != null && grupoId != null) {
            base = grupoRepository.findById(grupoId)
                    .map(g -> equipoRepository.findByGrupo(grupoId))
                    .orElse(List.of());
        } else if (torneoId != null) {
            base = equipoRepository.findByTorneoIdOrderByNombreAsc(torneoId);
        } else {
            base = equipoRepository.findAll();
        }

        // Map teams including dynamic integrantesCount (players assigned per equipo in its torneo)
        List<EquipoListDTO> dtos = base.stream().map(e -> {
            Integer torneoIdLocal = e.getTorneo() != null ? e.getTorneo().getId() : null;
            long count = 0L;
            if (torneoIdLocal != null) {
                // Count players for this equipo in its torneo
                count = usuariosPorEquipoRepository.countByEquipoIdAndTorneoId(e.getId(), torneoIdLocal);
            }
            return new EquipoListDTO(
                    e.getId(),
                    e.getNombre(),
                    torneoIdLocal,
                    e.getTorneo() != null ? e.getTorneo().getNombre() : null,
                    e.getGrupo() != null ? e.getGrupo().getId() : null,
                    e.getProgramaAcademico1() != null ? e.getProgramaAcademico1().getId() : null,
                    e.getProgramaAcademico2() != null ? e.getProgramaAcademico2().getId() : null,
                    e.getCapitan() != null ? e.getCapitan().getId() : null,
                    (int) count
            );
        }).toList();

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), dtos.size());
        List<EquipoListDTO> slice = start > end ? List.of() : dtos.subList(start, end);

        return new PageImpl<>(slice, pageable, dtos.size());
    }

    public EquipoDetailDTO detalle(Integer id) {
        Equipo e = equipoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Equipo no encontrado"));
        return mapper.toDetailDTO(e);
    }

    @Transactional
    public EquipoDetailDTO crear(EquipoCreateDTO req) {
        Torneo torneo = torneoRepository.findById(req.getId_torneo())
                .orElseThrow(() -> new NotFoundException("Torneo no encontrado"));
        Grupo grupo = grupoRepository.findById(req.getId_grupo())
                .orElseThrow(() -> new NotFoundException("Grupo no encontrado"));
        if (!grupo.getTorneo().getId().equals(torneo.getId())) {
            throw new BadRequestException("El grupo no pertenece al torneo");
        }
        String nombreOriginal = req.getNombre();
        log.info("[EQUIPO_CREAR] Intento creación equipo. torneoId={}, grupoId={}, nombreOriginal='{}'", torneo.getId(), grupo.getId(), nombreOriginal);

        if (nombreOriginal == null) {
            log.warn("[EQUIPO_CREAR] Nombre nulo");
            throw new BadRequestException("El nombre del equipo es obligatorio");
        }
        // Limpia espacios múltiples, conserva acentos para almacenamiento
        String nombreTrimmado = nombreOriginal.replaceAll("\\s+", " ").trim();
        if (nombreTrimmado.isEmpty()) {
            log.warn("[EQUIPO_CREAR] Nombre vacío tras trim. original='{}'", nombreOriginal);
            throw new BadRequestException("El nombre del equipo es obligatorio");
        }

        // Versión para comparación (sin acentos, lowercase, espacios colapsados)
        String claveComparacion = Normalizer.normalize(nombreTrimmado, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase();

        List<Equipo> existentesTorneo = equipoRepository.findByTorneoIdOrderByNombreAsc(torneo.getId());
        List<String> clavesExistentes = existentesTorneo.stream()
                .map(Equipo::getNombre)
                .map(n -> Normalizer.normalize(n.replaceAll("\\s+", " ").trim(), Normalizer.Form.NFD)
                        .replaceAll("\\p{M}", "")
                        .toLowerCase())
                .toList();
        log.info("[EQUIPO_CREAR] Claves existentes torneo {} => {}", torneo.getId(), clavesExistentes);
        boolean duplicadoTorneo = clavesExistentes.contains(claveComparacion);
        if (duplicadoTorneo) {
            throw new BadRequestException("Duplicado: '" + nombreTrimmado + "' torneo=" + torneo.getId());
        }

        // Chequeo global opcional (por si hay constraint solo por nombre global)
        boolean duplicadoGlobal = equipoRepository.existsByNombreIgnoreCase(nombreTrimmado);
        log.info("[EQUIPO_CREAR] Chequeo global existsByNombreIgnoreCase='{}' => {}", nombreTrimmado, duplicadoGlobal);
        if (duplicadoGlobal) {
            log.warn("[EQUIPO_CREAR] Nombre ya existe globalmente (otro torneo). nombre='{}'", nombreTrimmado);
            // Solo informativo, permitimos si constraint lo deja; si BD lanza violación se capturará abajo.
        }

        var p1 = programaRepository.findById(req.getId_programa_academico_1())
                .orElseThrow(() -> new NotFoundException("Programa 1 no encontrado"));
        var p2 = (req.getId_programa_academico_2() == null) ? null :
                programaRepository.findById(req.getId_programa_academico_2())
                        .orElseThrow(() -> new NotFoundException("Programa 2 no encontrado"));

        Usuario cap = null;
        if (req.getId_usuario_capitan() != null) {
            cap = usuarioRepository.findById(req.getId_usuario_capitan())
                    .orElseThrow(() -> new NotFoundException("Capitán no encontrado"));
        }

    Equipo e = new Equipo();
    e.setNombre(nombreTrimmado); // almacenamos versión legible (con acentos)
        e.setTorneo(torneo);
        e.setGrupo(grupo);
        e.setProgramaAcademico1(p1);
        e.setProgramaAcademico2(p2);
        e.setCapitan(cap);

        try {
            e = equipoRepository.save(e);
            log.info("[EQUIPO_CREAR] Equipo creado id={} nombre='{}' torneoId={}", e.getId(), e.getNombre(), torneo.getId());
        } catch (DataIntegrityViolationException ex) {
            String causa = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
            log.error("[EQUIPO_CREAR] DataIntegrityViolation al guardar nombre='{}' torneoId={} causa={}", nombreTrimmado, torneo.getId(), causa);
            // Si la violación es por PK (secuencia desfasada), indicamos error interno claro
            if (causa != null && causa.contains("tbl_equipo_pkey")) {
                throw new RuntimeException("Error interno: secuencia de IDs desfasada en equipos. Contacta al administrador.");
            }
            // Cualquier otro constraint (por ejemplo, único por nombre si se define en BD)
            throw new BadRequestException("Duplicado (constraint BD): '" + nombreTrimmado + "' torneo=" + torneo.getId());
        }
        return mapper.toDetailDTO(e);
    }

    @Transactional
    public EquipoDetailDTO actualizar(Integer id, EquipoUpdateDTO req) {
        Equipo e = equipoRepository.findById(id).orElseThrow(() -> new NotFoundException("Equipo no encontrado"));

        if (req.getNombre() != null) e.setNombre(req.getNombre());

        if (req.getId_grupo() != null) {
            Grupo g = grupoRepository.findById(req.getId_grupo())
                    .orElseThrow(() -> new NotFoundException("Grupo no encontrado"));
            if (!g.getTorneo().getId().equals(e.getTorneo().getId()))
                throw new BadRequestException("El grupo no pertenece al torneo del equipo");
            e.setGrupo(g);
        }
        if (req.getId_programa_academico_1() != null) {
            e.setProgramaAcademico1(programaRepository.findById(req.getId_programa_academico_1())
                    .orElseThrow(() -> new NotFoundException("Programa 1 no encontrado")));
        }
        if (req.getId_programa_academico_2() != null) {
            e.setProgramaAcademico2(programaRepository.findById(req.getId_programa_academico_2())
                    .orElseThrow(() -> new NotFoundException("Programa 2 no encontrado")));
        }
        if (req.getId_usuario_capitan() != null) {
            e.setCapitan(usuarioRepository.findById(req.getId_usuario_capitan())
                    .orElseThrow(() -> new NotFoundException("Capitán no encontrado")));
        }

        Equipo saved = equipoRepository.save(e);

        return mapper.toDetailDTO(saved);
    }

    @Transactional
    public void eliminar(Integer id) {
        equipoRepository.deleteById(id);
    }
}
