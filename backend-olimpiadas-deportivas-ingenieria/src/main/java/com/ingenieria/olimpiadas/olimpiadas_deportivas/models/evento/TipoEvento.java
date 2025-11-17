package com.ingenieria.olimpiadas.olimpiadas_deportivas.models.evento;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.catalogo.Deporte;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(schema="olimpiadas_ingenieria", name="tbl_tipo_evento")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TipoEvento {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable=false, length=255)
    private String nombre;

    @Column(name="puntos_negativos", nullable=false)
    private Integer puntosNegativos;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="id_deporte", nullable=false)
    private Deporte deporte;

    @Column(name="requiere_jugador", nullable=false)
    @Builder.Default
    private Boolean requiereJugador = true;
}
