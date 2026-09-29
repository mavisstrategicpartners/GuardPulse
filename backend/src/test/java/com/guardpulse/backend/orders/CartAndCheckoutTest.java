package com.guardpulse.backend.orders;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;

import com.guardpulse.backend.catalog.Product;
import com.guardpulse.backend.catalog.ProductRepository;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class CartAndCheckoutTest {

    @Autowired
    TestRestTemplate rest;

    @Autowired
    ProductRepository productRepository;

    @Test
    void addingMoreThanAvailableStockIsRejected() {
        Product product = anyActiveProduct();
        product.setStockQty(2);
        productRepository.save(product);

        String cartToken = createCart();

        // First add of 2 succeeds — exactly at the stock limit.
        ResponseEntity<String> first = addItem(cartToken, product.getSlug(), 2);
        assertThat(first.getStatusCode().is2xxSuccessful()).isTrue();

        // Adding one more on top would exceed stock (2 already in cart + 1 more > 2 available).
        ResponseEntity<String> second = addItem(cartToken, product.getSlug(), 1);
        assertThat(second.getStatusCode().value()).isEqualTo(409);
    }

    @Test
    void removingTheOnlyItemEmptiesTheCart() {
        Product product = anyActiveProduct();
        product.setStockQty(5);
        productRepository.save(product);

        String cartToken = createCart();
        addItem(cartToken, product.getSlug(), 1);

        ResponseEntity<Map> cartAfterAdd = rest.getForEntity("/api/cart/" + cartToken + "/", Map.class);
        var items = (java.util.List<?>) cartAfterAdd.getBody().get("items");
        assertThat(items).hasSize(1);
        var itemId = ((Map<?, ?>) items.get(0)).get("id");

        rest.exchange("/api/cart/" + cartToken + "/items/" + itemId + "/", HttpMethod.DELETE, null, String.class);

        ResponseEntity<Map> cartAfterRemove = rest.getForEntity("/api/cart/" + cartToken + "/", Map.class);
        var itemsAfter = (java.util.List<?>) cartAfterRemove.getBody().get("items");
        assertThat(itemsAfter).isEmpty();
    }

    @Test
    void checkoutWithAnEmptyCartIsRejected() {
        String cartToken = createCart();

        String body = """
                {"cart_token":"%s","full_name":"Nobody","email":"nobody@example.com","phone":"0000000000",
                 "address_line1":"1 Nowhere St","city":"Cape Town","province":"Western Cape","postal_code":"8000"}
                """.formatted(cartToken);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<String> response = rest.postForEntity("/api/orders/", new HttpEntity<>(body, headers), String.class);
        assertThat(response.getStatusCode().value()).isEqualTo(400);
    }

    @Test
    void checkoutWithAnInvalidCartTokenIsRejected() {
        String body = """
                {"cart_token":"not-a-real-uuid","full_name":"Nobody","email":"nobody@example.com","phone":"0000000000",
                 "address_line1":"1 Nowhere St","city":"Cape Town","province":"Western Cape","postal_code":"8000"}
                """;
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<String> response = rest.postForEntity("/api/orders/", new HttpEntity<>(body, headers), String.class);
        assertThat(response.getStatusCode().value()).isEqualTo(400);
    }

    // --- helpers ---

    private Product anyActiveProduct() {
        return productRepository.findAllByActiveTrueOrderByNameAsc().stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Expected the catalog to be seeded"));
    }

    private String createCart() {
        ResponseEntity<Map> response = rest.postForEntity("/api/cart/", null, Map.class);
        return (String) response.getBody().get("token");
    }

    private ResponseEntity<String> addItem(String cartToken, String productSlug, int quantity) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String body = """
                {"product_slug":"%s","quantity":%d}
                """.formatted(productSlug, quantity);
        return rest.postForEntity("/api/cart/" + cartToken + "/items/", new HttpEntity<>(body, headers), String.class);
    }
}


