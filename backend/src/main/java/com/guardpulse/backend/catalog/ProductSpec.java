package com.guardpulse.backend.catalog;

import jakarta.persistence.*;

@Entity
@Table(name = "product_specs")
public class ProductSpec {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(nullable = false)
    private String text;

    protected ProductSpec() {
    }

    public ProductSpec(Product product, String text) {
        this.product = product;
        this.text = text;
    }

    public Long getId() { return id; }
    public String getText() { return text; }
}


