package com.ingenieria.olimpiadas.olimpiadas_deportivas.dto.evento;

import jakarta.validation.constraints.NotNull;

public class EventoCreateDTO {

    @NotNull(message = "id_equipo_por_partido es obligatorio")
    private Integer id_equipo_por_partido;

    // Jugador es opcional para eventos como WO donde no hay jugador específico
    private Integer id_usuario_jugador;

    @NotNull(message = "id_tipo_evento es obligatorio")
    private Integer id_tipo_evento;

    private String observaciones;

    public Integer getId_equipo_por_partido() { return id_equipo_por_partido; }
    public void setId_equipo_por_partido(Integer id_equipo_por_partido) { this.id_equipo_por_partido = id_equipo_por_partido; }
    public Integer getId_usuario_jugador() { return id_usuario_jugador; }
    public void setId_usuario_jugador(Integer id_usuario_jugador) { this.id_usuario_jugador = id_usuario_jugador; }
    public Integer getId_tipo_evento() { return id_tipo_evento; }
    public void setId_tipo_evento(Integer id_tipo_evento) { this.id_tipo_evento = id_tipo_evento; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}
