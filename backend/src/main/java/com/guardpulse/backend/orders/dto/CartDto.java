package com.guardpulse.backend.orders.dto;

import java.math.BigDecimal;
import java.util.List;

import com.guardpulse.backend.catalog.dto.ProductSummaryDto;
import com.guardpulse.backend.orders.Cart;
import com.guardpulse.backend.orders.CartItem;

public class CartDto {
    public String token;
    public List<CartItemDto> items;
    public BigDecimal total;

    public static CartDto from(Cart cart) {
        CartDto dto = new CartDto();
        dto.token = cart.getToken().toString();
        dto.items = cart.getItems().stream().map(CartItemDto::from).toList();
        dto.total = cart.getTotal();
        return dto;
    }

    public static class CartItemDto {
        public Long id;
        public ProductSummaryDto product;
        public int quantity;
        public BigDecimal subtotal;

        public static CartItemDto from(CartItem item) {
            CartItemDto dto = new CartItemDto();
            dto.id = item.getId();
            dto.product = ProductSummaryDto.from(item.getProduct());
            dto.quantity = item.getQuantity();
            dto.subtotal = item.getSubtotal();
            return dto;
        }
    }
}


