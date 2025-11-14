package com.ingenieria.olimpiadas.olimpiadas_deportivas.services;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.common.IdNombreDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.olimpiada.OlimpiadaCreateDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.olimpiada.OlimpiadaDetailDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.olimpiada.OlimpiadaUpdateDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.olimpiada.TorneoSummaryDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.exceptions.BadRequestException;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.exceptions.NotFoundException;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.catalogo.Deporte;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo.Olimpiada;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo.Torneo;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.catalogo.DeporteRepository;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.torneo.OlimpiadaRepository;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.torneo.TorneoRepository;

@Service
public class OlimpiadaService {

    private final OlimpiadaRepository olimpiadaRepository;
    private final TorneoRepository torneoRepository;
    private final DeporteRepository deporteRepository;

    public OlimpiadaService(OlimpiadaRepository olimpiadaRepository, 
                           TorneoRepository torneoRepository,
                           DeporteRepository deporteRepository) {
        this.olimpiadaRepository = olimpiadaRepository;
        this.torneoRepository = torneoRepository;
        this.deporteRepository = deporteRepository;
    }

    public List<IdNombreDTO> listarActivas() {
        return olimpiadaRepository.findByActivoTrueOrderByAnioDescNombreAsc()
                .stream()
                .map(o -> new IdNombreDTO(o.getId(), o.getNombre()))
                .toList();
    }

    public Olimpiada obtenerPorSlug(String slug) {
        return olimpiadaRepository.findBySlug(slug)
                .orElseThrow(() -> new NotFoundException("Olimpiada no encontrada"));
    }

    public Olimpiada obtenerPorId(Integer id) {
        return olimpiadaRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Olimpiada no encontrada"));
    }

    @Transactional
    public OlimpiadaDetailDTO crear(OlimpiadaCreateDTO req) {
        // Generate slug from nombre
        String slug = generateSlug(req.nombre());
        
        // Check if slug already exists
        olimpiadaRepository.findBySlug(slug).ifPresent(existing -> {
            throw new BadRequestException("Ya existe una olimpiada con ese nombre (slug: " + slug + "). Intenta con un nombre diferente.");
        });

        // Create Olimpiada
        Olimpiada olimpiada = Olimpiada.builder()
                .nombre(req.nombre())
                .slug(slug)
                .edicion(req.edicion())
                .anio(req.anio())
                .activo(req.activo() != null ? req.activo() : true)
                .build();
        
        Olimpiada olimpiadaGuardada = olimpiadaRepository.save(olimpiada);

        // Get all deportes (Futbol and Baloncesto)
        List<Deporte> deportes = deporteRepository.findAll();
        
        // Create a tournament for each deporte
        List<Torneo> torneos = deportes.stream()
                .map(deporte -> {
                    Torneo torneo = Torneo.builder()
                            .nombre(deporte.getNombre() + " " + req.nombre())
                            .deporte(deporte)
                            .olimpiada(olimpiadaGuardada)
                            .build();
                    return torneoRepository.save(torneo);
                })
                .collect(Collectors.toList());

        // Build response
        List<TorneoSummaryDTO> torneoSummaries = torneos.stream()
                .map(t -> new TorneoSummaryDTO(
                        t.getId(),
                        t.getNombre(),
                        t.getDeporte().getId(),
                        t.getDeporte().getNombre()
                ))
                .toList();

        return new OlimpiadaDetailDTO(
                olimpiadaGuardada.getId(),
                olimpiadaGuardada.getNombre(),
                olimpiadaGuardada.getSlug(),
                olimpiadaGuardada.getEdicion(),
                olimpiadaGuardada.getAnio(),
                olimpiadaGuardada.getActivo(),
                torneoSummaries
        );
    }

    @Transactional
    public OlimpiadaDetailDTO actualizar(Integer id, OlimpiadaUpdateDTO req) {
        Olimpiada olimpiada = obtenerPorId(id);
        
        // Generate new slug from the nombre
        String newSlug = generateSlug(req.nombre());
        
        // If olimpiada doesn't have a slug yet (legacy data), set it
        if (olimpiada.getSlug() == null || olimpiada.getSlug().isEmpty()) {
            // Check if the new slug conflicts with another olimpiada
            olimpiadaRepository.findBySlug(newSlug).ifPresent(existing -> {
                throw new BadRequestException("Ya existe una olimpiada con ese nombre (slug: " + newSlug + ")");
            });
            olimpiada.setSlug(newSlug);
        } else if (!olimpiada.getSlug().equals(newSlug)) {
            // Slug is changing, check if the new slug conflicts with another olimpiada
            olimpiadaRepository.findBySlug(newSlug).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new BadRequestException("Ya existe una olimpiada con ese nombre (slug: " + newSlug + ")");
                }
            });
            olimpiada.setSlug(newSlug);
        }
        
        olimpiada.setNombre(req.nombre());
        olimpiada.setEdicion(req.edicion());
        olimpiada.setAnio(req.anio());
        if (req.activo() != null) {
            olimpiada.setActivo(req.activo());
        }
        
        Olimpiada olimpiadaActualizada = olimpiadaRepository.save(olimpiada);
        
        // Get associated tournaments - the JOIN FETCH should eager-load deporte and olimpiada
        List<Torneo> torneos = torneoRepository.findByOlimpiadaIdOrderByNombreAscIncludingInactive(olimpiadaActualizada.getId());
        List<TorneoSummaryDTO> torneoSummaries = torneos.stream()
                .map(t -> new TorneoSummaryDTO(
                        t.getId(),
                        t.getNombre(),
                        t.getDeporte().getId(),
                        t.getDeporte().getNombre()
                ))
                .toList();
        
        return new OlimpiadaDetailDTO(
                olimpiadaActualizada.getId(),
                olimpiadaActualizada.getNombre(),
                olimpiadaActualizada.getSlug(),
                olimpiadaActualizada.getEdicion(),
                olimpiadaActualizada.getAnio(),
                olimpiadaActualizada.getActivo(),
                torneoSummaries
        );
    }

    public List<OlimpiadaDetailDTO> listarTodas() {
        return olimpiadaRepository.findAllByOrderByAnioDescNombreAsc()
                .stream()
                .map(o -> {
                    List<Torneo> torneos = torneoRepository.findByOlimpiadaIdOrderByNombreAsc(o.getId());
                    List<TorneoSummaryDTO> torneoSummaries = torneos.stream()
                            .map(t -> new TorneoSummaryDTO(
                                    t.getId(),
                                    t.getNombre(),
                                    t.getDeporte().getId(),
                                    t.getDeporte().getNombre()
                            ))
                            .toList();
                    
                    return new OlimpiadaDetailDTO(
                            o.getId(),
                            o.getNombre(),
                            o.getSlug(),
                            o.getEdicion(),
                            o.getAnio(),
                            o.getActivo(),
                            torneoSummaries
                    );
                })
                .toList();
    }

    public List<Torneo> getTorneosByOlimpiadaId(Integer olimpiadaId) {
        return torneoRepository.findByOlimpiadaIdOrderByNombreAsc(olimpiadaId);
    }

    private String generateSlug(String nombre) {
        return nombre.toLowerCase()
                .replaceAll("[áàäâã]", "a")
                .replaceAll("[éèëê]", "e")
                .replaceAll("[íìïî]", "i")
                .replaceAll("[óòöôõ]", "o")
                .replaceAll("[úùüû]", "u")
                .replaceAll("[ñ]", "n")
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
    }
}
