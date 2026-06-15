package com.language.agent.controller;

import com.language.agent.dto.ApiResponse;
import com.language.agent.dto.AuthRequest;
import com.language.agent.dto.AuthResponse;
import com.language.agent.dto.RegisterRequest;
import com.language.agent.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success(authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ApiResponse.success(authService.login(request));
    }
}
