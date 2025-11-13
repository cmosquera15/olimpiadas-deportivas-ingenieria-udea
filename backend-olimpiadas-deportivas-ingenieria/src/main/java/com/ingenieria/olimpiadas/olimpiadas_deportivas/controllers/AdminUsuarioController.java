package com.ingenieria.olimpiadas.olimpiadas_deportivas.controllers;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.usuario.UsuarioListDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.usuario.UsuarioCreateDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.usuario.UsuarioUpdateDTO;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.usuario.Usuario;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.services.UsuarioService;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/usuarios")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class AdminUsuarioController {

    private final UsuarioService usuarioService;

    public AdminUsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    public ResponseEntity<Page<UsuarioListDTO>> getUsuarios(
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(usuarioService.getUsuarios(search, page, size));
    }

    @PostMapping
    public ResponseEntity<UsuarioListDTO> crearUsuario(@RequestBody @jakarta.validation.Valid UsuarioCreateDTO req) {
        return ResponseEntity.ok(usuarioService.crearUsuarioAdmin(req));
    }

    @PutMapping("/{id}/rol")
    public ResponseEntity<UsuarioListDTO> updateRol(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {
        String rol = body.get("rol");
        return ResponseEntity.ok(usuarioService.updateRol(id, rol));
    }

    @PutMapping("/{id}/habilitado")
    public ResponseEntity<UsuarioListDTO> updateHabilitado(
            @PathVariable Integer id,
            @RequestBody Map<String, Boolean> body) {
        Boolean habilitado = body.get("habilitado");
        return ResponseEntity.ok(usuarioService.updateHabilitado(id, habilitado));
    }

    @PutMapping("/{id}/perfil")
    public ResponseEntity<UsuarioListDTO> updatePerfilAdmin(@PathVariable Integer id,
                                                     @RequestBody UsuarioUpdateDTO req) {
        Usuario u = usuarioService.editarPerfilAdmin(id, req);
        UsuarioListDTO dto = new UsuarioListDTO(
                u.getId(),
                u.getNombre(),
                u.getCorreo(),
                u.getRol() != null ? u.getRol().getNombre() : null,
                u.getHabilitado()
        );
        return ResponseEntity.ok(dto);
    }
}
