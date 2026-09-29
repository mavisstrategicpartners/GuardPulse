package com.guardpulse.backend.catalog.dto;

import java.util.List;

import com.guardpulse.backend.catalog.Product;


public class ProductDetailDto extends ProductSummaryDto {
    public String sku;
    public String description;
    public List<SpecDto> specs;

    public record SpecDto(String text) {}

    public static ProductDetailDto fromDetail(Product p) {
        ProductDetailDto dto = new ProductDetailDto();
        dto.id = p.getId();
        dto.slug = p.getSlug();
        dto.name = p.getName();
        dto.brand = p.getBrand();
        dto.category = p.getCategory().getKey();
        dto.isBundle = p.isBundle();
        dto.tagline = p.getTagline();
        dto.price = p.getPrice();
        dto.stockQty = p.getStockQty();
        dto.image = p.getImageUrl();
        dto.sku = p.getSku();
        dto.description = p.getDescription();
        dto.specs = p.getSpecs().stream().map(s -> new SpecDto(s.getText())).toList();
        return dto;
    }
}


