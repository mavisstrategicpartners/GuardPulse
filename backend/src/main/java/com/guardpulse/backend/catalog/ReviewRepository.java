package com.guardpulse.backend.catalog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findAllByProduct_SlugOrderByCreatedAtDesc(String slug);

    @Query("select coalesce(avg(r.rating), 0) from Review r where r.product.slug = :slug")
    double averageRatingForSlug(@Param("slug") String slug);

    long countByProduct_Slug(String slug);
}