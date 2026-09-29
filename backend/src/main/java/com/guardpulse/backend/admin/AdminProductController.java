package com.guardpulse.backend.admin;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.guardpulse.backend.catalog.Product;
import com.guardpulse.backend.catalog.ProductRepository;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Controller
@RequestMapping("/admin/products")
public class AdminProductController {
 
    private final ProductRepository productRepository;
 
    @Value("${uploads.dir}")
    private String uploadsDir;
 
    public AdminProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }
 
    @GetMapping({"", "/"})
    public String list(Model model) {
        model.addAttribute("products", productRepository.findAllByOrderByNameAsc());
        return "admin/products";
    }
 
    @GetMapping("/{id}/edit")
    public String edit(@PathVariable Long id, Model model) {
        model.addAttribute("product", productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND)));
        return "admin/product-edit";
    }
 
    @PostMapping("/{id}")
    public String save(@PathVariable Long id,
                        @RequestParam BigDecimal price,
                        @RequestParam int stockQty,
                        @RequestParam BigDecimal weightKg,
                        @RequestParam(defaultValue = "false") boolean active,
                        @RequestParam(required = false) MultipartFile image) throws IOException {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
 
        product.setPrice(price);
        product.setStockQty(stockQty);
        product.setWeightKg(weightKg);
        product.setActive(active);
 
        if (image != null && !image.isEmpty()) {
            Path dir = Path.of(uploadsDir);
            Files.createDirectories(dir);
            String ext = image.getOriginalFilename() != null && image.getOriginalFilename().contains(".")
                    ? image.getOriginalFilename().substring(image.getOriginalFilename().lastIndexOf('.'))
                    : "";
            String filename = product.getSlug() + "-" + UUID.randomUUID() + ext;
            Files.copy(image.getInputStream(), dir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            product.setImageUrl("/media/" + filename);
        }
 
        productRepository.save(product);
        return "redirect:/admin/products/" + id + "/edit";
    }
}
 
