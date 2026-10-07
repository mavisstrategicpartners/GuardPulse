package com.guardpulse.backend.orders;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import com.guardpulse.backend.catalog.Product;
import com.guardpulse.backend.catalog.ProductRepository;


import java.util.List;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Reproduces the exact race the stock-tracking design is meant to prevent: two checkouts
 * both racing for the very last unit of a product. Without the optimistic locking on
 * Product (@Version) plus the try/catch around orderRepository.save() in
 * OrderController.checkout(), this test fails intermittently — both requests can succeed
 * and stock goes negative. With it, exactly one wins and the other gets a clean 409.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class StockConcurrencyTest {

    @Autowired
    TestRestTemplate rest;

    @Autowired
    ProductRepository productRepository;

    @Autowired
    CartRepository cartRepository;

    @Autowired
    CartItemRepository cartItemRepository;

    @Test
    void onlyOneOfTwoSimultaneousCheckoutsWinsTheLastUnit() throws Exception {
        // DataSeeder has already populated the catalog on context startup — grab any real
        // product and force it down to exactly one unit of stock for this test.
        Product product = productRepository.findAllByActiveTrueOrderByNameAsc().stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Expected the catalog to be seeded"));
        product.setStockQty(1);
        productRepository.save(product);

        Cart cartA = cartRepository.save(new Cart());
        Cart cartB = cartRepository.save(new Cart());
        cartItemRepository.save(new CartItem(cartA, product, 1));
        cartItemRepository.save(new CartItem(cartB, product, 1));

        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch bothReady = new CountDownLatch(2);
        CountDownLatch go = new CountDownLatch(1);

        Callable<ResponseEntity<String>> checkoutA = () -> {
            bothReady.countDown();
            go.await();
            return checkout(cartA.getToken().toString(), "racer-a@example.com");
        };
        Callable<ResponseEntity<String>> checkoutB = () -> {
            bothReady.countDown();
            go.await();
            return checkout(cartB.getToken().toString(), "racer-b@example.com");
        };

        Future<ResponseEntity<String>> futureA = pool.submit(checkoutA);
        Future<ResponseEntity<String>> futureB = pool.submit(checkoutB);

        bothReady.await(5, TimeUnit.SECONDS); // make sure both threads are past setup before either fires
        go.countDown(); // release both at (as close as the JVM allows to) the same instant

        ResponseEntity<String> responseA = futureA.get(10, TimeUnit.SECONDS);
        ResponseEntity<String> responseB = futureB.get(10, TimeUnit.SECONDS);
        pool.shutdown();

        List<Integer> statuses = List.of(responseA.getStatusCode().value(), responseB.getStatusCode().value());
        assertThat(statuses).as("one checkout should succeed (201) and the other should be rejected (409)")
                .containsExactlyInAnyOrder(201, 409);

        Product afterwards = productRepository.findById(product.getId()).orElseThrow();
        assertThat(afterwards.getStockQty())
                .as("the single unit of stock must not have gone negative or been sold twice")
                .isZero();
    }

    private ResponseEntity<String> checkout(String cartToken, String email) {
        String body = """
                {
                  "cart_token": "%s",
                  "full_name": "Race Condition Test",
                  "email": "%s",
                  "phone": "0821234567",
                  "address_line1": "1 Test Street",
                  "city": "Cape Town",
                  "province": "Western Cape",
                  "postal_code": "8000"
                }
                """.formatted(cartToken, email);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return rest.postForEntity("/api/orders/", new HttpEntity<>(body, headers), String.class);
    }
}


