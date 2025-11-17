package com.ingenieria.olimpiadas.olimpiadas_deportivas.models.evento;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo.EquiposPorPartido;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.usuario.Usuario;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(schema="olimpiadas_ingenieria", name="tbl_evento")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Evento {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="id_equipo_por_partido", nullable=false)
    private EquiposPorPartido equipoPorPartido;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="id_usuario_jugador", nullable=true)
    private Usuario usuarioJugador;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="id_tipo_evento", nullable=false)
    private TipoEvento tipoEvento;

    @Column(name="observaciones", columnDefinition="TEXT")
    private String observaciones;
}
