package com.guardpulse.backend.catalog;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.guardpulse.backend.catalog.dto.ProductDetailDto;
import com.guardpulse.backend.catalog.dto.ProductSummaryDto;
import com.guardpulse.backend.common.PageResponse;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @GetMapping({"", "/"})
    public PageResponse<ProductSummaryDto> list(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean bundle) {

        var products = (category != null)
                ? productRepository.findAllByActiveTrueAndCategory_KeyOrderByNameAsc(category)
                : (Boolean.TRUE.equals(bundle))
                    ? productRepository.findAllByActiveTrueAndBundleTrueOrderByNameAsc()
                    : productRepository.findAllByActiveTrueOrderByNameAsc();

        var dtos = products.stream().map(ProductSummaryDto::from).toList();
        return PageResponse.of(dtos);
    }

    @GetMapping("/{slug}/")
    public ResponseEntity<ProductDetailDto> detail(@PathVariable String slug) {
        return productRepository.findBySlugAndActiveTrue(slug)
                .map(ProductDetailDto::fromDetail)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}


