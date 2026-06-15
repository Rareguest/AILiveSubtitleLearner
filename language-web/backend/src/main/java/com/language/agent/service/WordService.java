package com.language.agent.service;

import com.language.agent.dto.WordCreateRequest;
import com.language.agent.dto.WordDTO;
import com.language.agent.dto.PageResult;

import java.util.List;

public interface WordService {

    WordDTO create(Long userId, WordCreateRequest request);

    WordDTO update(Long userId, Long id, WordCreateRequest request);

    void delete(Long userId, Long id);

    WordDTO getById(Long userId, Long id);

    PageResult<WordDTO> getByUserId(Long userId, int page, int size);

    List<WordDTO> getFavorites(Long userId);

    WordDTO toggleFavorite(Long userId, Long id);

    PageResult<WordDTO> search(Long userId, String keyword, int page, int size);

    PageResult<WordDTO> getByMasteryLevel(Long userId, Integer level, int page, int size);

    WordDTO generateKnowledge(Long userId, Long id);
}
