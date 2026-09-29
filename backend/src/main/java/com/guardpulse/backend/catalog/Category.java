package com.guardpulse.backend.catalog;

import jakarta.persistence.*;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String key; // indoor | outdoor | solar

    @Column(nullable = false)
    private String label;

    private int sortOrder;

    protected Category() {
    }

    public Category(String key, String label, int sortOrder) {
        this.key = key;
        this.label = label;
        this.sortOrder = sortOrder;
    }

    public Long getId() { return id; }
    public String getKey() { return key; }
    public String getLabel() { return label; }
    public int getSortOrder() { return sortOrder; }
}


