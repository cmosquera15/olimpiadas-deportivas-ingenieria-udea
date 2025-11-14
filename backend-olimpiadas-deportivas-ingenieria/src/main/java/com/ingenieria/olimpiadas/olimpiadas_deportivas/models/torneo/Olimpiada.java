package com.ingenieria.olimpiadas.olimpiadas_deportivas.models.torneo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity @Table(schema="olimpiadas_ingenieria", name="tbl_olimpiada")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Olimpiada {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  @Column(nullable=false, length=255)
  private String nombre;

  @Column(nullable=false, length=100, unique=true)
  private String slug;

  private Short edicion;
  private Short anio;
  
  @Builder.Default
  @Column(nullable=false)
  private Boolean activo = Boolean.TRUE;
}
