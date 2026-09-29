package com.guardpulse.backend.catalog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findBySlugAndActiveTrue(String slug);

    List<Product> findAllByActiveTrueOrderByNameAsc();
    List<Product> findAllByActiveTrueAndCategory_KeyOrderByNameAsc(String categoryKey);
    List<Product> findAllByActiveTrueAndBundleTrueOrderByNameAsc();
    List<Product> findAllByOrderByNameAsc(); // admin views need inactive products too
}


