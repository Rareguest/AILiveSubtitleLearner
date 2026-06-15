package com.language.agent.service;

import com.language.agent.dto.AuthRequest;
import com.language.agent.dto.AuthResponse;
import com.language.agent.dto.RegisterRequest;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(AuthRequest request);
}
