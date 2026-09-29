package com.guardpulse.backend.catalog;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.guardpulse.backend.catalog.dto.CategoryDto;
import com.guardpulse.backend.common.PageResponse;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryRepository categoryRepository;

    public CategoryController(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @GetMapping({"", "/"})
    public PageResponse<CategoryDto> list() {
        var dtos = categoryRepository.findAllByOrderBySortOrderAsc().stream()
                .map(CategoryDto::from)
                .toList();
        return PageResponse.of(dtos);
    }
}


