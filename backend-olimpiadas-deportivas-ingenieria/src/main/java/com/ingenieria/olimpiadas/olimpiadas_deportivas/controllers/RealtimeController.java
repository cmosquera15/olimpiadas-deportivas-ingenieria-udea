package com.ingenieria.olimpiadas.olimpiadas_deportivas.controllers;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.ingenieria.olimpiadas.olimpiadas_deportivas.realtime.RealtimeService;

@RestController
@RequestMapping("/api/rt")
public class RealtimeController {

    private final RealtimeService realtimeService;

    public RealtimeController(RealtimeService realtimeService) {
        this.realtimeService = realtimeService;
    }

    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        return realtimeService.subscribe();
    }
}
