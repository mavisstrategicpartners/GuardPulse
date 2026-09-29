package com.guardpulse.backend.catalog;

import jakarta.persistence.*;
 
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
 
@Entity
@Table(name = "products")
public class Product {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    @Column(unique = true, nullable = false)
    private String slug;
 
    @Column(nullable = false)
    private String name;
 
    @Column(nullable = false)
    private String brand; // xiaomi | tplink
 
    @ManyToOne(optional = false)
    @JoinColumn(name = "category_id")
    private Category category;
 
    private boolean bundle;
 
    private String sku;
 
    @Column(nullable = false)
    private String tagline;
 
    @Column(length = 2000)
    private String description;
 
    @Column(precision = 10, scale = 2)
    private BigDecimal costPrice;
 
    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal price;
 
    private int stockQty;
 
    /** Parcel weight in kilograms, used to calculate shipping — see shipping/ShippingService. */
    @Column(precision = 6, scale = 3)
    private BigDecimal weightKg = BigDecimal.valueOf(0.5);
 
    private boolean active = true;
 
    /** Optimistic lock — prevents two simultaneous checkouts from both decrementing stale stock. */
    @Version
    private long version;
 
    /** Set once real product photography is uploaded; null falls back to the line-art icon on the frontend. */
    private String imageUrl;
 
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderColumn(name = "spec_order")
    private List<ProductSpec> specs = new ArrayList<>();
 
    private Instant createdAt = Instant.now();
 
    protected Product() {
    }
 
    public Product(String slug, String name, String brand, Category category, boolean bundle, String sku,
                    String tagline, String description, BigDecimal costPrice, BigDecimal price, int stockQty,
                    BigDecimal weightKg) {
        this.slug = slug;
        this.name = name;
        this.brand = brand;
        this.category = category;
        this.bundle = bundle;
        this.sku = sku;
        this.tagline = tagline;
        this.description = description;
        this.costPrice = costPrice;
        this.price = price;
        this.stockQty = stockQty;
        this.weightKg = weightKg;
    }
 
    public void addSpec(String text) {
        specs.add(new ProductSpec(this, text));
    }
 
    /** Throws if insufficient stock; otherwise decrements. Caller is expected to be inside a transaction. */
    public void decreaseStock(int quantity) {
        if (quantity > stockQty) {
            throw new IllegalStateException("Only " + stockQty + " left in stock for \"" + name + "\"");
        }
        stockQty -= quantity;
    }
 
    public void setPrice(BigDecimal price) { this.price = price; }
    public void setStockQty(int stockQty) { this.stockQty = stockQty; }
    public void setActive(boolean active) { this.active = active; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setWeightKg(BigDecimal weightKg) { this.weightKg = weightKg; }
 
    public Long getId() { return id; }
    public String getSlug() { return slug; }
    public String getName() { return name; }
    public String getBrand() { return brand; }
    public Category getCategory() { return category; }
    public boolean isBundle() { return bundle; }
    public String getSku() { return sku; }
    public String getTagline() { return tagline; }
    public String getDescription() { return description; }
    public BigDecimal getPrice() { return price; }
    public int getStockQty() { return stockQty; }
    public BigDecimal getWeightKg() { return weightKg; }
    public boolean isActive() { return active; }
    public String getImageUrl() { return imageUrl; }
    public List<ProductSpec> getSpecs() { return specs; }
}
 
