package com.guardpulse.backend.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.Async;

import com.guardpulse.backend.orders.Order;
import com.guardpulse.backend.orders.OrderItem;


import java.math.BigDecimal;

@Component
public class OrderNotifier {

    private static final Logger log = LoggerFactory.getLogger(OrderNotifier.class);

    private final MailService mailService;

    @Value("${mail.admin-address}")
    private String adminAddress;

    @Value("${store.vat-number:}")
    private String vatNumber;

    @Value("${store.prices-include-vat:true}")
    private boolean pricesIncludeVat;
   

    public OrderNotifier(MailService mailService) {
        this.mailService = mailService;
    }

    /**
     * Fires off the customer confirmation and merchant notification emails. Deliberately
     * swallows any mail-sending failure (SMTP down, bad creds, etc.) — a flaky mail server
     * must never roll back or fail an otherwise-successful checkout. The order is the source
     * of truth; email is a courtesy on top of it. Failures are logged so they're not silent.
     */
    @Async("mailExecutor")
public void notifyOrderPlaced(Order order) {
        try {
            mailService.send(order.getEmail(), "GuardPulse order confirmed — " + order.getReference(),
                    customerBody(order));
        } catch (Exception e) {
            log.error("Failed to send customer confirmation email for order {}", order.getReference(), e);
        }
        try {
            mailService.send(adminAddress, "New GuardPulse order — " + order.getReference(),
                    merchantBody(order));
        } catch (Exception e) {
            log.error("Failed to send merchant notification email for order {}", order.getReference(), e);
        }
    }

    /** Fired from the PayFast ITN webhook once payment actually clears. */
  @Async("mailExecutor")
public void notifyPaymentConfirmed(Order order) {
        try {
            mailService.send(order.getEmail(), "Payment received — GuardPulse order " + order.getReference(),
                    "Thanks, " + order.getFullName() + ". We've received your payment for order "
                            + order.getReference() + " (R" + order.getTotal() + ").\n\n"
                            + "We'll email you again once it ships.\n\n— GuardPulse");
        } catch (Exception e) {
            log.error("Failed to send payment-confirmed email for order {}", order.getReference(), e);
        }
        try {
            mailService.send(adminAddress, "Payment received — order " + order.getReference(),
                    "Order " + order.getReference() + " from " + order.getFullName()
                            + " has been paid (R" + order.getTotal() + "). Ready to fulfil.");
        } catch (Exception e) {
            log.error("Failed to send merchant payment-confirmed email for order {}", order.getReference(), e);
        }
    }

    private String customerBody(Order order) {
        StringBuilder sb = new StringBuilder();
        sb.append("Thanks, ").append(order.getFullName()).append(".\n\n");
        sb.append("Your order is confirmed. Reference: ").append(order.getReference()).append("\n\n");
        for (OrderItem item : order.getItems()) {
            sb.append(String.format("  %-45s x%-3d  R%s%n", item.getProductName(), item.getQuantity(),
                    item.getSubtotal()));
        }
        sb.append("\nShipping: R").append(order.getShippingFee());
        sb.append("\nTotal: R").append(order.getTotal());
        sb.append(pricesIncludeVat ? " (incl. VAT)" : " (excl. VAT)").append("\n\n");
        sb.append("Shipping to:\n");
        sb.append(order.getAddressLine1());
        if (order.getAddressLine2() != null && !order.getAddressLine2().isBlank()) {
            sb.append(", ").append(order.getAddressLine2());
        }
        sb.append(", ").append(order.getCity()).append(", ").append(order.getProvince())
                .append(" ").append(order.getPostalCode()).append("\n\n");
        sb.append("We'll email you again once your payment is confirmed and again when it ships.\n\n— GuardPulse");
        if (vatNumber != null && !vatNumber.isBlank()) {
            sb.append("\nVAT No: ").append(vatNumber);
        }
        return sb.toString();
    }

    private String merchantBody(Order order) {
        BigDecimal itemsTotal = order.getItems().stream()
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return "New order from " + order.getFullName() + " (" + order.getEmail() + ", " + order.getPhone() + ")\n"
                + "Reference: " + order.getReference() + "\n"
                + "Items subtotal: R" + itemsTotal + "\n"
                + "Total (incl. shipping): R" + order.getTotal() + "\n\n"
                + "Manage this order in the admin panel: /admin/orders/" + order.getId();
    }
}


