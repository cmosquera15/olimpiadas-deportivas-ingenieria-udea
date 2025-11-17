package com.ingenieria.olimpiadas.olimpiadas_deportivas.realtime;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class RealtimeService {

    private final CopyOnWriteArrayList<SseEmitter> clients = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(0L); // no timeout; client will reconnect on failure
        clients.add(emitter);
        emitter.onCompletion(() -> clients.remove(emitter));
        emitter.onTimeout(() -> clients.remove(emitter));
        emitter.onError(e -> clients.remove(emitter));
        // Send initial ready event
        try {
            SseEmitter.SseEventBuilder event = SseEmitter.event()
                .name("ready")
                .data(Map.of("message", "connected"))
                .id(String.valueOf(System.currentTimeMillis()))
                .reconnectTime(3000);
            emitter.send(event);
        } catch (IOException ignored) {}
        return emitter;
    }

    public void emit(String type, Map<String, Object> data) {
        clients.forEach(emitter -> {
            try {
                SseEmitter.SseEventBuilder event = SseEmitter.event()
                    .name(type)
                    .data(data)
                    .id(String.valueOf(System.currentTimeMillis()))
                    .reconnectTime(3000);
                emitter.send(event);
            } catch (IOException e) {
                clients.remove(emitter);
                emitter.completeWithError(e);
            }
        });
    }

    // Helpers for common resources
    public void emitPartidoUpdated(Integer partidoId, Integer torneoId) {
        emit("partido-updated", Map.of("partidoId", partidoId, "torneoId", torneoId));
    }

    public void emitPosicionesUpdated(Integer torneoId) {
        emit("posiciones-updated", Map.of("torneoId", torneoId));
    }

    public void emitEventosUpdated(Integer partidoId) {
        emit("eventos-updated", Map.of("partidoId", partidoId));
    }

    public void emitEquiposUpdated(Integer torneoId) {
        emit("equipos-updated", Map.of("torneoId", torneoId));
    }

    public void emitTorneosUpdated(Integer torneoId) {
        emit("torneos-updated", Map.of("torneoId", torneoId));
    }

    public void emitBracketUpdated(Integer torneoId) {
        emit("bracket-updated", Map.of("torneoId", torneoId));
    }
}
