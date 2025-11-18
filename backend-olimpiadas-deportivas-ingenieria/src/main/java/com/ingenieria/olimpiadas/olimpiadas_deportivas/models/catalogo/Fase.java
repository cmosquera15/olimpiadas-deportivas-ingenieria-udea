package com.ingenieria.olimpiadas.olimpiadas_deportivas.models.catalogo;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo.Torneo;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(schema="olimpiadas_ingenieria", name="tbl_fase",
        uniqueConstraints = @UniqueConstraint(columnNames = {"nombre","id_torneo"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Fase {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable=false, length=255)
    private String nombre;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="id_torneo", nullable=false)
    private Torneo torneo;
}
