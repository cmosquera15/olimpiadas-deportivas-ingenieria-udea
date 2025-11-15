package com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.evento;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.evento.Evento;

public interface EventoRepository extends JpaRepository<Evento, Integer> {

    @Query("""
           select ev from Evento ev 
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
            and ev.usuario.id = :usuarioId
            and upper(te.nombre) like '%GOL%'
       """)
    Long countGolesByUsuarioInTorneo(Integer torneoId, Integer usuarioId);
}
