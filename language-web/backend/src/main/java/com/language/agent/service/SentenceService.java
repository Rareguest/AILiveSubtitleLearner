package com.language.agent.service;

import com.language.agent.dto.PageResult;
import com.language.agent.dto.SentenceCreateRequest;
import com.language.agent.dto.SentenceDTO;

import java.util.List;

public interface SentenceService {

    SentenceDTO create(Long userId, SentenceCreateRequest request);

    SentenceDTO update(Long userId, Long id, SentenceCreateRequest request);

    void delete(Long userId, Long id);

    SentenceDTO getById(Long userId, Long id);

    PageResult<SentenceDTO> getByUserId(Long userId, int page, int size);

    List<SentenceDTO> getFavorites(Long userId);

    SentenceDTO toggleFavorite(Long userId, Long id);

    PageResult<SentenceDTO> search(Long userId, String keyword, int page, int size);

    SentenceDTO generateKnowledge(Long userId, Long id);
}
