package com.guardpulse.backend.admin;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.guardpulse.backend.catalog.Category;
import com.guardpulse.backend.catalog.CategoryRepository;
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
    private final CategoryRepository categoryRepository;

    @Value("${uploads.dir}")
    private String uploadsDir;

    public AdminProductController(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @GetMapping({"", "/"})
    public String list(Model model) {
        model.addAttribute("products", productRepository.findAllByOrderByNameAsc());
        return "admin/products";
    }

    @GetMapping("/new")
    public String newForm(Model model) {
        model.addAttribute("product", null);
        model.addAttribute("categories", categoryRepository.findAllByOrderBySortOrderAsc());
        return "admin/product-edit";
    }

    @GetMapping("/{id}/edit")
    public String edit(@PathVariable Long id, Model model) {
        model.addAttribute("product", productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND)));
        model.addAttribute("categories", categoryRepository.findAllByOrderBySortOrderAsc());
        return "admin/product-edit";
    }

    /** Creates a new product. Slugs must be unique store-wide — rejects a duplicate rather
     *  than letting the database throw a raw constraint error. */
    @PostMapping
    public String create(@RequestParam String slug,
                          @RequestParam String name,
                          @RequestParam String brand,
                          @RequestParam Long categoryId,
                          @RequestParam(defaultValue = "false") boolean bundle,
                          @RequestParam(required = false) String sku,
                          @RequestParam String tagline,
                          @RequestParam(required = false) String description,
                          @RequestParam(required = false) BigDecimal costPrice,
                          @RequestParam BigDecimal price,
                          @RequestParam int stockQty,
                          @RequestParam BigDecimal weightKg,
                          @RequestParam(required = false) String imageUrl) {
        if (productRepository.findBySlug(slug).isPresent()) {
            return "redirect:/admin/products/new?slugTaken";
        }
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown category"));

        Product product = new Product(slug, name, brand, category, bundle, sku, tagline,
                description, costPrice, price, stockQty, weightKg);
        if (imageUrl != null && !imageUrl.isBlank()) {
            product.setImageUrl(imageUrl.trim());
        }
        product = productRepository.save(product);
        return "redirect:/admin/products/" + product.getId() + "/edit?created";
    }

    @PostMapping("/{id}")
    public String save(@PathVariable Long id,
                        @RequestParam String name,
                        @RequestParam String brand,
                        @RequestParam Long categoryId,
                        @RequestParam(required = false) String sku,
                        @RequestParam String tagline,
                        @RequestParam(required = false) String description,
                        @RequestParam(required = false) BigDecimal costPrice,
                        @RequestParam BigDecimal price,
                        @RequestParam int stockQty,
                        @RequestParam BigDecimal weightKg,
                        @RequestParam(defaultValue = "false") boolean active,
                        @RequestParam(required = false) String imageUrl,
                        @RequestParam(required = false) MultipartFile image) throws IOException {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown category"));

        product.setName(name);
        product.setBrand(brand);
        product.setCategory(category);
        product.setSku(sku);
        product.setTagline(tagline);
        product.setDescription(description);
        product.setCostPrice(costPrice);
        product.setPrice(price);
        product.setStockQty(stockQty);
        product.setWeightKg(weightKg);
        product.setActive(active);

        // A typed URL/path wins if given (works for the photos already bundled under
        // static/products/, and persists across redeploys). A file upload is also still
        // supported, but Render's free tier disk is wiped on every deploy/restart — fine
        // for a quick swap between redeploys, not reliable long-term. See note below.
        if (imageUrl != null && !imageUrl.isBlank()) {
            product.setImageUrl(imageUrl.trim());
        } else if (image != null && !image.isEmpty()) {
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
        return "redirect:/admin/products/" + id + "/edit?saved";
    }

    /**
     * Deletes a product outright if it's safe to (never ordered, never carted). If it's
     * referenced by past orders — which have a NOT NULL foreign key to it — a hard delete
     * would fail, so this falls back to deactivating it instead: it disappears from the
     * storefront but order history stays intact.
     */
    @PostMapping("/{id}/delete")
    @Transactional
    public String delete(@PathVariable Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        try {
            productRepository.delete(product);
            productRepository.flush();
            return "redirect:/admin/products?deleted";
        } catch (DataIntegrityViolationException stillReferenced) {
            product.setActive(false);
            productRepository.save(product);
            return "redirect:/admin/products?deactivatedInstead";
        }
    }
}