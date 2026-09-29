package com.guardpulse.backend.orders;

import org.springframework.data.jpa.repository.JpaRepository;

import com.guardpulse.backend.catalog.Product;

import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    Optional<CartItem> findByCartAndProduct(Cart cart, Product product);
    Optional<CartItem> findByIdAndCart(Long id, Cart cart);
}


