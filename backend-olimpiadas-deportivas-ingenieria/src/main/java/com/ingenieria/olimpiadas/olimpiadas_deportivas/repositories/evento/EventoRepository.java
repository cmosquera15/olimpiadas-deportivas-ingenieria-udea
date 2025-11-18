package com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.evento;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.evento.Evento;

public interface EventoRepository extends JpaRepository<Evento, Integer> {

    @Query("""
           select ev from Evento ev 
           left join fetch ev.usuarioJugador
           join fetch ev.tipoEvento
           join fetch ev.equipoPorPartido
           where ev.equipoPorPartido.partido.id = :partidoId
           """)
    List<Evento> findByPartido(Integer partidoId);

    @Query("""
           select coalesce(sum(ev.tipoEvento.puntosNegativos), 0)
           from Evento ev
           where ev.equipoPorPartido.equipo.id = :equipoId
             and ev.equipoPorPartido.partido.torneo.id = :torneoId
             and ev.tipoEvento.puntosNegativos > 0
           """)
    Integer sumPuntosNegativosByEquipoAndTorneo(Integer equipoId, Integer torneoId);

    @Query("""
          select coalesce(sum(te.puntosNegativos),0)
          from Evento ev
            join ev.tipoEvento te
            join ev.equipoPorPartido epp
            join epp.partido p
          where p.torneo.id = :torneoId
            and p.fase.nombre like %:faseNombre%
            and epp.equipo.id = :equipoId
            and te.puntosNegativos > 0
       """)
    Integer sumPuntosNegativosEquipoEnFase(Integer torneoId, String faseNombre, Integer equipoId);

    @Query("""
          select count(ev)
          from Evento ev
            join ev.tipoEvento te
            join ev.equipoPorPartido epp
            join epp.partido p
          where p.torneo.id = :torneoId
            and ev.usuarioJugador is not null
            and ev.usuarioJugador.id = :usuarioId
            and upper(te.nombre) like '%GOL%'
       """)
    Long countGolesByUsuarioInTorneo(Integer torneoId, Integer usuarioId);

    @Query("""
          select case when count(ev) > 0 then true else false end
          from Evento ev
            join ev.tipoEvento te
            join ev.equipoPorPartido epp
          where epp.partido.id = :partidoId
            and epp.equipo.id = :equipoId
            and te.requiereJugador = false
       """)
    boolean existsWoEventForTeamInMatch(Integer partidoId, Integer equipoId);
}
