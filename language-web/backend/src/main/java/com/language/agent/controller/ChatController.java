package com.language.agent.controller;

import com.language.agent.dto.ApiResponse;
import com.language.agent.entity.ChatMessage;
import com.language.agent.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/history")
    public ApiResponse<List<ChatMessage>> getHistory(@AuthenticationPrincipal String userIdStr) {
        Long userId = Long.valueOf(userIdStr);
        return ApiResponse.success(chatService.getHistory(userId));
    }

    @PostMapping("/save")
    public ApiResponse<ChatMessage> saveMessage(@AuthenticationPrincipal String userIdStr,
                                                  @RequestBody ChatMessage message) {
        Long userId = Long.valueOf(userIdStr);
        message.setUserId(userId);
        return ApiResponse.success(chatService.saveMessage(message));
    }
}
