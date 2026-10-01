package com.guardpulse.backend.admin;

import com.guardpulse.backend.customer.AuthService;
import com.guardpulse.backend.customer.Customer;
import com.guardpulse.backend.customer.CustomerRepository;
import com.guardpulse.backend.orders.OrderRepository;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

/** Back-office list of registered shoppers, with the ability to delete an account. */
@Controller
@RequestMapping("/admin/customers")
public class AdminCustomerController {

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm").withZone(ZoneId.of("Africa/Johannesburg"));

    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final AuthService authService;

    public AdminCustomerController(CustomerRepository customerRepository, OrderRepository orderRepository,
                                   AuthService authService) {
        this.customerRepository = customerRepository;
        this.orderRepository = orderRepository;
        this.authService = authService;
    }

    /** View model — plain getters so Thymeleaf can read it. */
    public static class Row {
        private final Customer customer;
        private final long orderCount;
        private final String registeredOn;

        Row(Customer customer, long orderCount, String registeredOn) {
            this.customer = customer;
            this.orderCount = orderCount;
            this.registeredOn = registeredOn;
        }

        public Customer getCustomer() { return customer; }
        public long getOrderCount() { return orderCount; }
        public String getRegisteredOn() { return registeredOn; }
    }

    @GetMapping({"", "/"})
    public String list(Model model) {
        List<Row> rows = customerRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(c -> new Row(c,
                        orderRepository.findByCustomerOrderByCreatedAtDesc(c).size(),
                        DATE_FORMAT.format(c.getCreatedAt())))
                .toList();
        model.addAttribute("rows", rows);
        return "admin/customers";
    }

    @PostMapping("/{id}/delete")
    public String delete(@PathVariable Long id) {
        authService.deleteAccount(id);
        return "redirect:/admin/customers?deleted";
    }
}