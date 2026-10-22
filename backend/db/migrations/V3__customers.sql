-- Customer accounts (register / login) and the link from an order back to the account.
-- Deleting a customer never deletes their orders: orders.customer_id is simply set to NULL.

CREATE TABLE customers (
    id             BIGSERIAL PRIMARY KEY,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    full_name      VARCHAR(255) NOT NULL,
    phone          VARCHAR(255),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE auth_tokens (
    id           BIGSERIAL PRIMARY KEY,
    token_hash   VARCHAR(64) NOT NULL UNIQUE,
    customer_id  BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at   TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_auth_tokens_customer ON auth_tokens(customer_id);

ALTER TABLE orders ADD COLUMN customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL;
CREATE INDEX idx_orders_customer ON orders(customer_id);