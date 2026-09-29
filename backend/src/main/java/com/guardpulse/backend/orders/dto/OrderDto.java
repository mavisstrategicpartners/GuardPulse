package com.guardpulse.backend.orders.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.guardpulse.backend.orders.Order;

public class OrderDto {
    public String reference;
    public String status;
    public String fullName;
    public String email;
    public String phone;
    public String addressLine1;
    public String addressLine2;
    public String city;
    public String province;
    public String postalCode;
    public BigDecimal shippingFee;
    public BigDecimal total;
    public Instant createdAt;
    public List<OrderItemDto> items;

    public static OrderDto from(Order order) {
        OrderDto dto = new OrderDto();
        dto.reference = order.getReference().toString();
        dto.status = order.getStatus().name().toLowerCase();
        dto.fullName = order.getFullName();
        dto.email = order.getEmail();
        dto.phone = order.getPhone();
        dto.addressLine1 = order.getAddressLine1();
        dto.addressLine2 = order.getAddressLine2();
        dto.city = order.getCity();
        dto.province = order.getProvince();
        dto.postalCode = order.getPostalCode();
        dto.shippingFee = order.getShippingFee();
        dto.total = order.getTotal();
        dto.createdAt = order.getCreatedAt();
        dto.items = order.getItems().stream().map(OrderItemDto::from).toList();
        return dto;
    }

    public static class OrderItemDto {
        public String productName;
        public BigDecimal unitPrice;
        public int quantity;
        public BigDecimal subtotal;

        public static OrderItemDto from(com.guardpulse.backend.orders.OrderItem item) {
            OrderItemDto dto = new OrderItemDto();
            dto.productName = item.getProductName();
            dto.unitPrice = item.getUnitPrice();
            dto.quantity = item.getQuantity();
            dto.subtotal = item.getSubtotal();
            return dto;
        }
    }
}


