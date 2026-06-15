package com.language.agent.service;

import com.language.agent.entity.ChatMessage;

import java.util.List;

public interface ChatService {

    ChatMessage saveMessage(ChatMessage message);

    List<ChatMessage> getHistory(Long userId);
}
