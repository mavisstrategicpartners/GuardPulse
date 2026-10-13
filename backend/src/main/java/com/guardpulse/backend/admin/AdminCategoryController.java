package com.guardpulse.backend.admin;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.guardpulse.backend.catalog.Category;
import com.guardpulse.backend.catalog.CategoryRepository;

@Controller
@RequestMapping("/admin/categories")
public class AdminCategoryController {

    private final CategoryRepository categoryRepository;

    public AdminCategoryController(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @GetMapping({"", "/"})
    public String list(Model model) {
        model.addAttribute("categories", categoryRepository.findAllByOrderBySortOrderAsc());
        return "admin/categories";
    }

    @PostMapping
    public String create(@RequestParam String key, @RequestParam String label, @RequestParam(defaultValue = "0") int sortOrder) {
        if (categoryRepository.findByKey(key).isPresent()) {
            return "redirect:/admin/categories?keyTaken";
        }
        categoryRepository.save(new Category(key.trim(), label.trim(), sortOrder));
        return "redirect:/admin/categories?created";
    }
}