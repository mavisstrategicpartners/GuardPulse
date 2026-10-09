package com.guardpulse.backend.catalog;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/products/{slug}/reviews")
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;

    public ReviewController(ReviewRepository reviewRepository, ProductRepository productRepository) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
    }

    @GetMapping
    public ReviewSummary list(@PathVariable String slug) {
        productRepository.findBySlugAndActiveTrue(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found."));

        List<ReviewDto> reviews = reviewRepository.findAllByProduct_SlugOrderByCreatedAtDesc(slug)
                .stream().map(ReviewDto::from).toList();

        double average = Math.round(reviewRepository.averageRatingForSlug(slug) * 10) / 10.0;
        long count = reviewRepository.countByProduct_Slug(slug);

        return new ReviewSummary(average, count, reviews);
    }

    @PostMapping
    public ReviewDto submit(@PathVariable String slug, @Valid @RequestBody NewReviewRequest request) {
        Product product = productRepository.findBySlugAndActiveTrue(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found."));

        Review review = new Review(product, request.authorName().trim(), request.rating(), request.comment().trim(), false);
        return ReviewDto.from(reviewRepository.save(review));
    }

    public record NewReviewRequest(
            @NotBlank @Size(max = 120) String authorName,
            @Min(1) @Max(5) int rating,
            @NotBlank @Size(max = 2000) String comment
    ) {}

    public record ReviewDto(Long id, String authorName, int rating, String comment, boolean verifiedPurchase, Instant createdAt) {
        static ReviewDto from(Review r) {
            return new ReviewDto(r.getId(), r.getAuthorName(), r.getRating(), r.getComment(), r.isVerifiedPurchase(), r.getCreatedAt());
        }
    }

    public record ReviewSummary(double averageRating, long count, List<ReviewDto> reviews) {}
}