package com.ingenieria.olimpiadas.olimpiadas_deportivas.services;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.usuario.Permiso;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.usuario.PermisosPorRol;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.models.usuario.Rol;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.usuario.PermisoRepository;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.usuario.PermisosPorRolRepository;
import com.ingenieria.olimpiadas.olimpiadas_deportivas.repositories.usuario.RolRepository;

@Service
public class SeguridadService {

    private final RolRepository rolRepository;
    private final PermisoRepository permisoRepository;
    private final PermisosPorRolRepository permisosPorRolRepository;

    public SeguridadService(RolRepository rolRepository,
                            PermisoRepository permisoRepository,
                            PermisosPorRolRepository permisosPorRolRepository) {
        this.rolRepository = rolRepository;
        this.permisoRepository = permisoRepository;
        this.permisosPorRolRepository = permisosPorRolRepository;
    }

    @Transactional
    public void seedBasico() {
        Rol administrador = rolRepository.findByNombreIgnoreCase("ADMINISTRADOR")
                .orElseGet(() -> rolRepository.save(new Rol(null, "ADMINISTRADOR", "Responsable de gestionar, mantener y asegurar el buen funcionamiento del sitio web.")));
        Rol arbitro = rolRepository.findByNombreIgnoreCase("ARBITRO")
                .orElseGet(() -> rolRepository.save(new Rol(null, "ARBITRO", "Encargado de dirigir un encuentro para que se cumpla el reglamento, sancionar las infracciones y validar los resultados.")));
        Rol jugador = rolRepository.findByNombreIgnoreCase("JUGADOR")
                .orElseGet(() -> rolRepository.save(new Rol(null, "JUGADOR", "Persona que participa activamente en la práctica de un deporte.")));

        Permiso pPartidosVer = permisoRepository.findByNombreIgnoreCase("Partidos_Ver")
                .orElseGet(() -> permisoRepository.save(new Permiso(null, "Partidos_Ver", "Ver listado de partidos.")));
        
        Permiso pPartidosEditar = permisoRepository.findByNombreIgnoreCase("Partidos_Editar")
                .orElseGet(() -> permisoRepository.save(new Permiso(null, "Partidos_Editar", "Editar los encuentros ya creados.")));

        Permiso pTorneosVer = permisoRepository.findByNombreIgnoreCase("Torneos_Ver")
                .orElseGet(() -> permisoRepository.save(new Permiso(null, "Torneos_Ver", "Ver listado de torneos.")));

        Permiso pTorneosCrear = permisoRepository.findByNombreIgnoreCase("Torneos_Crear")
                .orElseGet(() -> permisoRepository.save(new Permiso(null, "Torneos_Crear", "Crear torneos y generar llaves.")));

        Permiso pUsuariosEditarRol = permisoRepository.findByNombreIgnoreCase("Usuarios_Editar_Rol")
                .orElseGet(() -> permisoRepository.save(new Permiso(null, "Usuarios_Editar_Rol", "Editar rol a cada usuario que lo requiera.")));

        Permiso pEquiposEliminar = permisoRepository.findByNombreIgnoreCase("Equipos_Eliminar")
                .orElseGet(() -> permisoRepository.save(new Permiso(null, "Equipos_Eliminar", "Eliminar equipos ya creados.")));

        Permiso pEquiposCrear = permisoRepository.findByNombreIgnoreCase("Equipos_Crear")
                .orElseGet(() -> permisoRepository.save(new Permiso(null, "Equipos_Crear", "Crear equipos para cada torneo.")));

        Permiso pPartidosEliminar = permisoRepository.findByNombreIgnoreCase("Partidos_Eliminar")
                .orElseGet(() -> permisoRepository.save(new Permiso(null, "Partidos_Eliminar", "Eliminar los encuentros ya creados.")));

        Permiso pPosicionesVer = permisoRepository.findByNombreIgnoreCase("Posiciones_Ver")
                .orElseGet(() -> permisoRepository.save(new Permiso(null, "Posiciones_Ver", "Ver tablas de posiciones.")));

        Permiso pEquiposEditar = permisoRepository.findByNombreIgnoreCase("Equipos_Editar")
                .orElseGet(() -> permisoRepository.save(new Permiso(null, "Equipos_Editar", "Editar equipos ya creados.")));

        Permiso pPartidosCrear = permisoRepository.findByNombreIgnoreCase("Partidos_Crear")
                .orElseGet(() -> permisoRepository.save(new Permiso(null, "Partidos_Crear", "Crear encuentros entre equipos.")));

        Permiso pEquiposVer = permisoRepository.findByNombreIgnoreCase("Equipos_Ver")
                .orElseGet(() -> permisoRepository.save(new Permiso(null, "Equipos_Ver", "Ver listado de equipos por torneo.")));

        vincular(administrador, List.of(pPartidosVer, pPartidosEditar, pTorneosVer, pTorneosCrear,
                pUsuariosEditarRol, pEquiposEliminar, pEquiposCrear,
                pPartidosEliminar, pPosicionesVer, pEquiposEditar,
                pPartidosCrear, pEquiposVer));
        vincular(arbitro, List.of(pPartidosVer, pPartidosEditar,
                pTorneosVer, pPosicionesVer,
                pEquiposVer));

        vincular(jugador, List.of(pPartidosVer, pTorneosVer,
                pPosicionesVer, pEquiposVer));
    }

    private void vincular(Rol rol, List<Permiso> permisos) {
        for (Permiso p : permisos) {
            boolean exists = permisosPorRolRepository.existsByRolIdAndPermisoId(rol.getId(), p.getId());
            if (!exists) {
                permisosPorRolRepository.save(new PermisosPorRol(null, rol, p));
            }
        }
    }
}
