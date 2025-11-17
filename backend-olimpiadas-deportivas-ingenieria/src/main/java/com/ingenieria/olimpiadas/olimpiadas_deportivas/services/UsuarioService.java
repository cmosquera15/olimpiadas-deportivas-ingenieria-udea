package com.ingenieria.olimpiadas.olimpiadas_deportivas.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.auth.AuthDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.usuario.UsuarioListDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.usuario.UsuarioUpdateDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.usuario.UsuarioCreateDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.auth.CompletarPerfilRequest;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.exceptions.BadRequestException;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.exceptions.NotFoundException;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.catalogo.EntidadPromotoraSalud;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.catalogo.Genero;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.catalogo.ProgramaAcademico;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.catalogo.TipoVinculo;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.usuario.Rol;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.usuario.Usuario;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.catalogo.EntidadPromotoraSaludRepository;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.catalogo.GeneroRepository;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.catalogo.ProgramaAcademicoRepository;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.catalogo.TipoVinculoRepository;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.usuario.RolRepository;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.usuario.UsuarioRepository;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.security.JwtTokenProvider;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final EntidadPromotoraSaludRepository entidadPromotoraSaludRepository;
    private final ProgramaAcademicoRepository programaRepository;
    private final GeneroRepository generoRepository;
    private final TipoVinculoRepository tipoVinculoRepository;
    private final JwtTokenProvider jwtTokenProvider;

    public UsuarioService(UsuarioRepository usuarioRepository,
                          RolRepository rolRepository,
                          EntidadPromotoraSaludRepository entidadPromotoraSaludRepository,
                          ProgramaAcademicoRepository programaRepository,
                          GeneroRepository generoRepository,
                          TipoVinculoRepository tipoVinculoRepository,
                          JwtTokenProvider jwtTokenProvider) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.entidadPromotoraSaludRepository = entidadPromotoraSaludRepository;
        this.programaRepository = programaRepository;
        this.generoRepository = generoRepository;
        this.tipoVinculoRepository = tipoVinculoRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public boolean estaCompleto(String correo) {
        Usuario u = usuarioRepository.findByCorreoIgnoreCase(correo)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
        return u.getDocumento() != null && !u.getDocumento().isBlank()
                && u.getEntidadPromotoraSalud() != null && u.getProgramaAcademico() != null
                && u.getGenero() != null;
    }

    @Transactional
    public void completarPerfilDesdeJWT(CompletarPerfilRequest req, String bearer) {
        if (bearer == null || !bearer.startsWith("Bearer ")) {
            throw new BadRequestException("Authorization inválido");
        }
        String token = bearer.substring("Bearer ".length()).trim();
        String correo = jwtTokenProvider.getEmailFromToken(token);

        if (estaCompleto(correo)) {
            throw new BadRequestException("Perfil ya completado. Para cambios, acércate a Bienestar/Admin.");
        }
        completarPerfil(correo, req);
    }

    @Transactional
    public Usuario completarPerfil(String correo, CompletarPerfilRequest req) {
        Usuario u = usuarioRepository.findByCorreoIgnoreCase(correo)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        if (req.getDocumento() == null || req.getDocumento().isBlank()) {
            throw new BadRequestException("Documento obligatorio");
        }

        if (u.getDocumento() != null && !u.getDocumento().equals(req.getDocumento())) {
            throw new BadRequestException("No se puede cambiar el documento una vez establecido");
        }

        EntidadPromotoraSalud eps = entidadPromotoraSaludRepository.findById(req.getId_eps())
                .orElseThrow(() -> new NotFoundException("EPS no encontrada"));
        ProgramaAcademico prog = programaRepository.findById(req.getId_programa_academico())
                .orElseThrow(() -> new NotFoundException("Programa no encontrado"));
        Genero genero = generoRepository.findById(req.getId_genero())
                .orElseThrow(() -> new NotFoundException("Género no encontrado"));
        TipoVinculo vinculo = tipoVinculoRepository.findById(req.getId_tipo_vinculo())
                .orElseThrow(() -> new NotFoundException("Tipo vínculo no encontrado"));

        u.setDocumento(req.getDocumento());
        u.setEntidadPromotoraSalud(eps);
        u.setProgramaAcademico(prog);
        u.setGenero(genero);
        u.setTipoVinculo(vinculo);

        return usuarioRepository.save(u);
    }

    public AuthDTO me(String bearer) {
        if (bearer == null || !bearer.startsWith("Bearer ")) {
            throw new BadRequestException("Authorization inválido");
        }
        String token = bearer.substring("Bearer ".length()).trim();
        String correo = jwtTokenProvider.getEmailFromToken(token);

        Usuario u = usuarioRepository.findByCorreoIgnoreCase(correo)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        boolean completo = estaCompleto(correo);
        return new AuthDTO(null, u.getId(), u.getNombre(), u.getCorreo(), completo, u.getFotoUrl());
    }

    @Transactional
    public Usuario editarPerfilPropio(String bearer, UsuarioUpdateDTO req) {
        if (bearer == null || !bearer.startsWith("Bearer ")) {
            throw new BadRequestException("Authorization inválido");
        }
        String token = bearer.substring("Bearer ".length()).trim();
        String correo = jwtTokenProvider.getEmailFromToken(token);
        Usuario u = usuarioRepository.findByCorreoIgnoreCase(correo)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        // Permitimos actualizar nombre (mayúsculas), fotoUrl, y datos del perfil excepto documento si ya existe
        if (req.getNombre() != null && !req.getNombre().isBlank()) {
            u.setNombre(req.getNombre().toUpperCase());
        }
        if (req.getFotoUrl() != null) {
            u.setFotoUrl(req.getFotoUrl());
        }
        if (req.getDocumento() != null && !req.getDocumento().isBlank()) {
            if (u.getDocumento() != null && !u.getDocumento().equals(req.getDocumento())) {
                throw new BadRequestException("No se puede cambiar el documento una vez establecido");
            }
            if (u.getDocumento() == null) {
                // Nuevo documento: validar que no exista en otros usuarios
                Usuario existente = usuarioRepository.findByDocumento(req.getDocumento()).orElse(null);
                if (existente != null && !existente.getId().equals(u.getId())) {
                    throw new BadRequestException("Documento ya registrado por otro usuario");
                }
                u.setDocumento(req.getDocumento());
            }
        }
        if (req.getId_programa_academico() != null) {
            ProgramaAcademico prog = programaRepository.findById(req.getId_programa_academico())
                    .orElseThrow(() -> new NotFoundException("Programa no encontrado"));
            u.setProgramaAcademico(prog);
        }
        if (req.getId_genero() != null) {
            Genero genero = generoRepository.findById(req.getId_genero())
                    .orElseThrow(() -> new NotFoundException("Género no encontrado"));
            u.setGenero(genero);
        }
        if (req.getId_eps() != null) {
            EntidadPromotoraSalud eps = entidadPromotoraSaludRepository.findById(req.getId_eps())
                    .orElseThrow(() -> new NotFoundException("EPS no encontrada"));
            u.setEntidadPromotoraSalud(eps);
        }
        if (req.getId_tipo_vinculo() != null) {
            TipoVinculo tv = tipoVinculoRepository.findById(req.getId_tipo_vinculo())
                    .orElseThrow(() -> new NotFoundException("Tipo vínculo no encontrado"));
            u.setTipoVinculo(tv);
        }
        return usuarioRepository.save(u);
    }

    @Transactional
    public Usuario editarPerfilAdmin(Integer id, UsuarioUpdateDTO req) {
        Usuario u = usuarioRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        if (req.getNombre() != null && !req.getNombre().isBlank()) {
            u.setNombre(req.getNombre().toUpperCase());
        }
        if (req.getFotoUrl() != null) {
            u.setFotoUrl(req.getFotoUrl());
        }
        if (req.getDocumento() != null && !req.getDocumento().isBlank()) {
            if (u.getDocumento() != null && !u.getDocumento().equals(req.getDocumento())) {
                throw new BadRequestException("No se puede cambiar el documento una vez establecido");
            }
            if (u.getDocumento() == null) {
                // Nuevo documento: validar que no exista en otros usuarios
                Usuario existente = usuarioRepository.findByDocumento(req.getDocumento()).orElse(null);
                if (existente != null && !existente.getId().equals(u.getId())) {
                    throw new BadRequestException("Documento ya registrado por otro usuario");
                }
                u.setDocumento(req.getDocumento());
            }
        }
        if (req.getId_programa_academico() != null) {
            ProgramaAcademico prog = programaRepository.findById(req.getId_programa_academico())
                    .orElseThrow(() -> new NotFoundException("Programa no encontrado"));
            u.setProgramaAcademico(prog);
        }
        if (req.getId_genero() != null) {
            Genero genero = generoRepository.findById(req.getId_genero())
                    .orElseThrow(() -> new NotFoundException("Género no encontrado"));
            u.setGenero(genero);
        }
        if (req.getId_eps() != null) {
            EntidadPromotoraSalud eps = entidadPromotoraSaludRepository.findById(req.getId_eps())
                    .orElseThrow(() -> new NotFoundException("EPS no encontrada"));
            u.setEntidadPromotoraSalud(eps);
        }
        if (req.getId_tipo_vinculo() != null) {
            TipoVinculo tv = tipoVinculoRepository.findById(req.getId_tipo_vinculo())
                    .orElseThrow(() -> new NotFoundException("Tipo vínculo no encontrado"));
            u.setTipoVinculo(tv);
        }
        return usuarioRepository.save(u);
    }

    public Usuario getById(Integer id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
    }

    // Admin methods
    public Page<UsuarioListDTO> getUsuarios(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("nombre").ascending());
        
        if (search != null && !search.trim().isEmpty()) {
            Page<Usuario> pageData = usuarioRepository.findByNombreContainingIgnoreCaseOrCorreoContainingIgnoreCase(
                search.trim(), search.trim(), pageable);
            return pageData.map(u -> new UsuarioListDTO(
                u.getId(), u.getNombre(), u.getCorreo(),
                u.getRol() != null ? u.getRol().getNombre() : null,
                u.getHabilitado()
            ));
        }
        Page<Usuario> all = usuarioRepository.findAll(pageable);
        return all.map(u -> new UsuarioListDTO(
            u.getId(), u.getNombre(), u.getCorreo(),
            u.getRol() != null ? u.getRol().getNombre() : null,
            u.getHabilitado()
        ));
    }

    @Transactional
    public UsuarioListDTO updateRol(Integer id, String rolNombre) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
        
        Rol rol = rolRepository.findByNombreIgnoreCase(rolNombre)
                .orElseThrow(() -> new NotFoundException("Rol no encontrado"));
        
        usuario.setRol(rol);
    Usuario saved = usuarioRepository.save(usuario);
    return new UsuarioListDTO(saved.getId(), saved.getNombre(), saved.getCorreo(),
        saved.getRol() != null ? saved.getRol().getNombre() : null,
        saved.getHabilitado());
    }

    @Transactional
    public UsuarioListDTO updateHabilitado(Integer id, boolean habilitado) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
        
        usuario.setHabilitado(habilitado);
        Usuario saved = usuarioRepository.save(usuario);
        return new UsuarioListDTO(saved.getId(), saved.getNombre(), saved.getCorreo(),
                saved.getRol() != null ? saved.getRol().getNombre() : null,
                saved.getHabilitado());
    }

    @Transactional
    public UsuarioListDTO crearUsuarioAdmin(UsuarioCreateDTO req) {
        if (usuarioRepository.findByCorreoIgnoreCase(req.getCorreo()).isPresent()) {
            throw new BadRequestException("Correo ya registrado");
        }

        String rolNombre = req.getRolNombre() == null ? "JUGADOR" : req.getRolNombre().toUpperCase();
        Rol rol = rolRepository.findByNombreIgnoreCase(rolNombre)
                .orElseThrow(() -> new NotFoundException("Rol no encontrado"));

        Usuario u = new Usuario();
        // Guardar nombre en mayúsculas
        u.setNombre(req.getNombre() != null ? req.getNombre().toUpperCase() : null);
        u.setCorreo(req.getCorreo());
        u.setRol(rol);
        u.setHabilitado(true);
        // fotoUrl queda null hasta primer login Google

        if (req.getDocumento() != null && !req.getDocumento().isBlank()) {
            if (usuarioRepository.findByDocumento(req.getDocumento())
                    .filter(existente -> !existente.getId().equals(u.getId()))
                    .isPresent()) {
                throw new BadRequestException("Documento ya registrado por otro usuario");
            }
            u.setDocumento(req.getDocumento());
        }

        if (req.getId_programa_academico() != null) {
            ProgramaAcademico prog = programaRepository.findById(req.getId_programa_academico())
                    .orElseThrow(() -> new NotFoundException("Programa no encontrado"));
            u.setProgramaAcademico(prog);
        }
        if (req.getId_genero() != null) {
            Genero genero = generoRepository.findById(req.getId_genero())
                    .orElseThrow(() -> new NotFoundException("Género no encontrado"));
            u.setGenero(genero);
        }
        if (req.getId_eps() != null) {
            EntidadPromotoraSalud eps = entidadPromotoraSaludRepository.findById(req.getId_eps())
                    .orElseThrow(() -> new NotFoundException("EPS no encontrada"));
            u.setEntidadPromotoraSalud(eps);
        }
        if (req.getId_tipo_vinculo() != null) {
            TipoVinculo vinculo = tipoVinculoRepository.findById(req.getId_tipo_vinculo())
                    .orElseThrow(() -> new NotFoundException("Tipo vínculo no encontrado"));
            u.setTipoVinculo(vinculo);
        }

        Usuario saved = usuarioRepository.save(u);
        return new UsuarioListDTO(saved.getId(), saved.getNombre(), saved.getCorreo(),
                saved.getRol() != null ? saved.getRol().getNombre() : null,
                saved.getHabilitado());
    }
}
