package com.guardpulse.backend.catalog;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "products_reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "author_name", nullable = false, length = 120)
    private String authorName;

    @Column(nullable = false)
    private int rating;

    @Column(nullable = false, length = 2000)
    private String comment;

    @Column(name = "verified_purchase", nullable = false)
    private boolean verifiedPurchase;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Review() {}

    public Review(Product product, String authorName, int rating, String comment, boolean verifiedPurchase) {
        this.product = product;
        this.authorName = authorName;
        this.rating = rating;
        this.comment = comment;
        this.verifiedPurchase = verifiedPurchase;
    }

    public Long getId() { return id; }
    public Product getProduct() { return product; }
    public String getAuthorName() { return authorName; }
    public int getRating() { return rating; }
    public String getComment() { return comment; }
    public boolean isVerifiedPurchase() { return verifiedPurchase; }
    public Instant getCreatedAt() { return createdAt; }
}