package com.guardpulse.backend.catalog.dto;

import java.math.BigDecimal;

import com.guardpulse.backend.catalog.Product;

public class ProductSummaryDto {
    public Long id;
    public String slug;
    public String name;
    public String brand;
    public String category;
    public boolean isBundle;
    public String tagline;
    public BigDecimal price;
    public int stockQty;
    public String image;

    public static ProductSummaryDto from(Product p) {
        ProductSummaryDto dto = new ProductSummaryDto();
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
        return dto;
    }
}


