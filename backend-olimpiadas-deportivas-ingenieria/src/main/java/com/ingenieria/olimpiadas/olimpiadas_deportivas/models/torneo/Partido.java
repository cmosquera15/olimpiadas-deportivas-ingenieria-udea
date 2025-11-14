package com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.catalogo.Fase;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.catalogo.Grupo;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.catalogo.Jornada;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.catalogo.Lugar;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.usuario.Usuario;

@Entity @Table(schema="olimpiadas_ingenieria", name="tbl_partido")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Partido {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable=false)
    private LocalDate fecha;

    @Column(nullable=false)
    private LocalTime hora;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="id_lugar", nullable=false)
    private Lugar lugar;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="id_jornada")
    private Jornada jornada;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="id_fase", nullable=false)
    private Fase fase;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="id_grupo")
    private Grupo grupo;

    @Column(length=255)
    private String observaciones;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="id_usuario_arbitro", nullable=false)
    private Usuario arbitro;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="id_torneo", nullable=false)
    private Torneo torneo;

    @Enumerated(EnumType.STRING)
    @Column(name="estado", length=20, nullable=false)
    @Builder.Default
    private EstadoPartido estado = EstadoPartido.PROGRAMADO;
}
