package com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.torneo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo.UsuariosPorEquipo;

public interface UsuariosPorEquipoRepository extends JpaRepository<UsuariosPorEquipo, Integer> {

    @Query("""
           select count(upe) > 0
           from UsuariosPorEquipo upe
           where upe.usuario.id = :usuarioId
             and upe.torneo.id = :torneoId
             and upe.equipo.id <> :equipoId
             and upe.equipo.torneo.deporte.id = :deporteId
           """)
    boolean existsUsuarioEnOtroEquipoMismaDisciplinaMismoTorneo(Integer usuarioId, Integer torneoId, Integer equipoId, Integer deporteId);

    @Query("""
           select count(upe)
           from UsuariosPorEquipo upe
           where upe.equipo.id = :equipoId
           """)
    long countJugadoresEnEquipo(Integer equipoId);

    @Query("""
           select case when count(upe)>0 then true else false end
           from UsuariosPorEquipo upe
           where upe.equipo.id = :equipoId
             and upe.torneo.id = :torneoId
             and upe.usuario.genero.nombre ilike 'M%'
           """)
    boolean existsMujerEnEquipoTorneo(Integer equipoId, Integer torneoId);

    @Query("""
           select count(upe)
           from UsuariosPorEquipo upe
           where upe.equipo.id = :equipoId
             and upe.torneo.id = :torneoId
             and upper(upe.usuario.genero.nombre) like 'F%%'
           """)
    long countMujeresEnEquipoTorneo(Integer equipoId, Integer torneoId);

    @Query("""
           select count(upe)
           from UsuariosPorEquipo upe
           where upe.equipo.id = :equipoId
             and upe.torneo.id = :torneoId
           """)
    long countByEquipoIdAndTorneoId(Integer equipoId, Integer torneoId);

    @Query("""
           select upe
           from UsuariosPorEquipo upe
           where upe.equipo.id = :equipoId
             and upe.torneo.id = :torneoId
           """)
    List<UsuariosPorEquipo> findByEquipoAndTorneo(Integer equipoId, Integer torneoId);

    @Query("""
           select upe
           from UsuariosPorEquipo upe
           where upe.torneo.id = :torneoId
           """)
    List<UsuariosPorEquipo> findByTorneoId(Integer torneoId);

    @Query("""
           select upe
           from UsuariosPorEquipo upe
           where upe.usuario.id = :usuarioId
             and upe.torneo.id = :torneoId
           """)
    List<UsuariosPorEquipo> findByUsuarioIdAndTorneoId(Integer usuarioId, Integer torneoId);

    boolean existsByUsuarioIdAndEquipoIdAndTorneoId(Integer usuarioId, Integer equipoId, Integer torneoId);
}
