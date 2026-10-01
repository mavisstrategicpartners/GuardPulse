package com.guardpulse.backend.admin;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.guardpulse.backend.catalog.Product;
import com.guardpulse.backend.customer.CustomerRepository;
import com.guardpulse.backend.catalog.ProductRepository;
import com.guardpulse.backend.orders.Order;
import com.guardpulse.backend.orders.OrderRepository;

import java.math.BigDecimal;
import java.util.List;

@Controller
@RequestMapping("/admin")
public class AdminDashboardController {

    private static final int LOW_STOCK_THRESHOLD = 5;

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;

    public AdminDashboardController(OrderRepository orderRepository, ProductRepository productRepository,
                                    CustomerRepository customerRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
    }

    @GetMapping({"", "/"})
    public String dashboard(Model model) {
        List<Order> allOrders = orderRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        // Only money actually received: pending and cancelled orders are not revenue.
        BigDecimal revenue = allOrders.stream()
                .filter(o -> o.getStatus() == Order.Status.PAID || o.getStatus() == Order.Status.SHIPPED
                        || o.getStatus() == Order.Status.DELIVERED)
                .map(Order::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Product> lowStock = productRepository.findAllByActiveTrueOrderByNameAsc().stream()
                .filter(p -> p.getStockQty() < LOW_STOCK_THRESHOLD)
                .toList();

        model.addAttribute("orderCount", allOrders.size());
        model.addAttribute("revenue", revenue);
        model.addAttribute("customerCount", customerRepository.count());
        model.addAttribute("lowStock", lowStock);
        model.addAttribute("recentOrders", allOrders.stream().limit(8).toList());
        return "admin/dashboard";
    }
}