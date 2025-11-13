package com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.torneo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo.Torneo;

public interface TorneoRepository extends JpaRepository<Torneo, Integer> {
    @Query("SELECT t FROM Torneo t JOIN FETCH t.deporte JOIN FETCH t.olimpiada WHERE t.olimpiada.id = :olimpiadaId AND t.olimpiada.activo = true ORDER BY t.nombre ASC")
    List<Torneo> findByOlimpiadaIdOrderByNombreAsc(@Param("olimpiadaId") Integer olimpiadaId);

    @Query("SELECT t FROM Torneo t JOIN FETCH t.deporte JOIN FETCH t.olimpiada WHERE t.olimpiada.id = :olimpiadaId ORDER BY t.nombre ASC")
    List<Torneo> findByOlimpiadaIdOrderByNombreAscIncludingInactive(@Param("olimpiadaId") Integer olimpiadaId);

    @Query("SELECT t FROM Torneo t JOIN FETCH t.deporte JOIN FETCH t.olimpiada WHERE t.olimpiada.id = :olimpiadaId AND t.deporte.id = :deporteId AND t.olimpiada.activo = true ORDER BY t.nombre ASC")
    List<Torneo> findByOlimpiadaIdAndDeporteIdOrderByNombreAsc(@Param("olimpiadaId") Integer olimpiadaId, @Param("deporteId") Integer deporteId);

    @Query("SELECT t FROM Torneo t JOIN FETCH t.deporte JOIN FETCH t.olimpiada WHERE t.deporte.id = :deporteId AND t.olimpiada.activo = true ORDER BY t.nombre ASC")
    List<Torneo> findByDeporteIdOrderByNombreAsc(@Param("deporteId") Integer deporteId);

    @Query("SELECT t FROM Torneo t JOIN FETCH t.deporte JOIN FETCH t.olimpiada WHERE t.olimpiada.activo = true ORDER BY t.nombre ASC")
    List<Torneo> findAllOrderByNombreAsc();

    Optional<Torneo> findByNombreAndDeporteIdAndOlimpiadaId(String nombre, Integer deporteId, Integer olimpiadaId);
}
