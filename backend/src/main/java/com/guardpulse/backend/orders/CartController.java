package com.guardpulse.backend.orders;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import com.guardpulse.backend.catalog.Product;
import com.guardpulse.backend.catalog.ProductRepository;
import com.guardpulse.backend.orders.dto.AddItemRequest;
import com.guardpulse.backend.orders.dto.CartDto;
import com.guardpulse.backend.orders.dto.UpdateQuantityRequest;

import java.util.UUID;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    public CartController(CartRepository cartRepository, CartItemRepository cartItemRepository,
                           ProductRepository productRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
    }

    @PostMapping({"", "/"})
    public ResponseEntity<CartDto> create() {
        Cart cart = cartRepository.save(new Cart());
        return ResponseEntity.status(HttpStatus.CREATED).body(CartDto.from(cart));
    }

    @GetMapping("/{token}/")
    public CartDto retrieve(@PathVariable String token) {
        return CartDto.from(findCart(token));
    }

    @PostMapping("/{token}/items/")
    public CartDto addItem(@PathVariable String token, @Valid @RequestBody AddItemRequest request) {
        Cart cart = findCart(token);
        Product product = productRepository.findBySlugAndActiveTrue(request.productSlug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        var existing = cartItemRepository.findByCartAndProduct(cart, product);
        int newQuantity = request.quantity + existing.map(CartItem::getQuantity).orElse(0);

        if (newQuantity > product.getStockQty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Only " + product.getStockQty() + " left in stock for \"" + product.getName() + "\"");
        }

        if (existing.isPresent()) {
            CartItem item = existing.get();
            item.setQuantity(newQuantity);
            cartItemRepository.save(item);
        } else {
            cartItemRepository.save(new CartItem(cart, product, request.quantity));
        }
        return CartDto.from(findCart(token));
    }

    @PatchMapping("/{token}/items/{itemId}/")
    public CartDto updateItem(@PathVariable String token, @PathVariable Long itemId,
                               @RequestBody UpdateQuantityRequest request) {
        Cart cart = findCart(token);
        CartItem item = cartItemRepository.findByIdAndCart(itemId, cart)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart item not found"));

        if (request.quantity <= 0) {
            cartItemRepository.delete(item);
        } else {
            if (request.quantity > item.getProduct().getStockQty()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Only " + item.getProduct().getStockQty() + " left in stock for \"" + item.getProduct().getName() + "\"");
            }
            item.setQuantity(request.quantity);
            cartItemRepository.save(item);
        }
        return CartDto.from(findCart(token));
    }

    @DeleteMapping("/{token}/items/{itemId}/")
    public CartDto removeItem(@PathVariable String token, @PathVariable Long itemId) {
        Cart cart = findCart(token);
        CartItem item = cartItemRepository.findByIdAndCart(itemId, cart)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart item not found"));
        cartItemRepository.delete(item);
        return CartDto.from(findCart(token));
    }

    private Cart findCart(String token) {
        try {
            return cartRepository.findByToken(UUID.fromString(token))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart not found"));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid cart token");
        }
    }
}


