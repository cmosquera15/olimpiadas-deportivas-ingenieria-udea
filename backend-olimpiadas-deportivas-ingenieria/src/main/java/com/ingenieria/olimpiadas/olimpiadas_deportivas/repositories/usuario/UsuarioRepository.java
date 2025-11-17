package com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.usuario;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.usuario.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    
    @Query("select u from Usuario u where lower(u.correo) = lower(:correo)")
    Optional<Usuario> findByCorreoIgnoreCase(String correo);

    boolean existsByDocumento(String documento);
    
    Optional<Usuario> findByDocumento(String documento);
    
    Page<Usuario> findByNombreContainingIgnoreCaseOrCorreoContainingIgnoreCase(
        String nombre, String correo, Pageable pageable);

    @Query("""
        select u from Usuario u
        where u.programaAcademico.id in (:programa1Id, :programa2Id)
    """)
    Page<Usuario> findByProgramas(Integer programa1Id, Integer programa2Id, Pageable pageable);

    @Query("""
        select u from Usuario u
        where (lower(u.nombre) like lower(concat('%', :q, '%'))
            or lower(u.correo) like lower(concat('%', :q, '%'))
            or u.documento like concat('%', :q, '%'))
    """)
    Page<Usuario> searchByTexto(String q, Pageable pageable);
}
