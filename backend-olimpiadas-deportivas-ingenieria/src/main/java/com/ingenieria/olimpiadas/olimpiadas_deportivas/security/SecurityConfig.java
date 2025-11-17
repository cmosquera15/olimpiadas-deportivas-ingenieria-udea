package com.ingenieria.olimpiadas.olimpiadas_deportivas.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.*;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(CorsConfigurationSource corsConfigurationSource) {
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration-ms}")
    private long jwtExpirationMs;

    @Value("${jwt.issuer}")
    private String jwtIssuer;

    @Bean
    public JwtTokenProvider jwtTokenProvider() {
        return new JwtTokenProvider(jwtSecret, jwtExpirationMs, jwtIssuer);
    }

    @Bean
    public JwtAuthFilter jwtAuthFilter(JwtTokenProvider jwtTokenProvider) {
        return new JwtAuthFilter(jwtTokenProvider);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           JwtAuthFilter jwtAuthFilter) throws Exception {

        http
            .cors(c -> c.configurationSource(corsConfigurationSource))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                // Swagger
                .requestMatchers(
                    "/v3/api-docs/**",
                    "/swagger-ui.html",
                    "/swagger-ui/**"
                ).permitAll()

                // Health check
                .requestMatchers("/healthz").permitAll()

                                // Auth
                .requestMatchers(HttpMethod.POST, "/api/auth/google-login").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/completar-perfil").authenticated()

                // Public endpoints
                .requestMatchers("/api/public/**").permitAll()

                // Catálogos GET públicos + Partidos GET
                .requestMatchers(HttpMethod.GET,
                    "/api/programas", "/api/programas/**",
                    "/api/eps", "/api/eps/**",
                    "/api/generos", "/api/generos/**",
                    "/api/deportes", "/api/deportes/**",
                    "/api/lugares", "/api/lugares/**",
                    "/api/fases", "/api/fases/**",
                    "/api/jornadas", "/api/jornadas/**",
                    "/api/grupos", "/api/grupos/**",
                    "/api/resultados", "/api/resultados/**",
                    "/api/tipos-vinculo", "/api/tipos-vinculo/**",
                    "/api/tipos-evento", "/api/tipos-evento/**",
                    "/api/torneos", "/api/torneos/**",
                    "/api/partidos", "/api/partidos/**",
                    "/api/equipos", "/api/equipos/**",
                    "/api/posiciones", "/api/posiciones/**",
                    "/api/olimpiadas", "/api/olimpiadas/**",
                    "/api/rt/stream"
                ).permitAll()

                // Admin endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMINISTRADOR")

                // Torneos endpoints (non-GET)
                .requestMatchers(HttpMethod.POST, "/api/torneos/**").hasAuthority("Torneos_Crear")
                .requestMatchers(HttpMethod.PUT,  "/api/torneos/**").hasAuthority("Torneos_Editar")
                .requestMatchers(HttpMethod.DELETE, "/api/torneos/**").hasAuthority("Torneos_Eliminar")

                // Partidos endpoints (non-GET)
                .requestMatchers(HttpMethod.POST, "/api/partidos/**").hasAuthority("Partidos_Crear")
                .requestMatchers(HttpMethod.PUT,  "/api/partidos/*/marcador").hasAuthority("Partidos_Editar")
                .requestMatchers(HttpMethod.PUT,  "/api/partidos/**").hasAuthority("Partidos_Editar")
                .requestMatchers(HttpMethod.DELETE,"/api/partidos/**").hasAuthority("Partidos_Eliminar")
                                                     
                // Eventos endpoints
                .requestMatchers(HttpMethod.POST, "/api/eventos/**").hasAuthority("Partidos_Editar")
                .requestMatchers(HttpMethod.DELETE, "/api/eventos/**").hasAuthority("Partidos_Editar")
                .requestMatchers(HttpMethod.PUT, "/api/eventos/**").hasAuthority("Partidos_Editar")
                .requestMatchers(HttpMethod.PATCH, "/api/eventos/**").hasAuthority("Partidos_Editar")

                // Default: authenticated
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }
}
