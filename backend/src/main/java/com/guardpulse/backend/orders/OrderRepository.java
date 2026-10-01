package com.guardpulse.backend.orders;

import com.guardpulse.backend.customer.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByReference(UUID reference);

    List<Order> findByCustomerOrderByCreatedAtDesc(Customer customer);
}