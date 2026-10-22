-- Initial schema for Postgres, matching the JPA entities in catalog/ and orders/ exactly.
-- Hibernate never touches the schema in production (ddl-auto=validate) — this file is the
-- only thing allowed to change it from here on. Add new migrations (V2__..., V3__...) rather
-- than editing this one once it's been applied anywhere.

CREATE TABLE categories (
    id          BIGSERIAL PRIMARY KEY,
    key         VARCHAR(255) NOT NULL UNIQUE,
    label       VARCHAR(255) NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE products (
    id           BIGSERIAL PRIMARY KEY,
    slug         VARCHAR(255) NOT NULL UNIQUE,
    name         VARCHAR(255) NOT NULL,
    brand        VARCHAR(255) NOT NULL,
    category_id  BIGINT NOT NULL REFERENCES categories(id),
    bundle       BOOLEAN NOT NULL DEFAULT FALSE,
    sku          VARCHAR(255),
    tagline      VARCHAR(255) NOT NULL,
    description  VARCHAR(2000),
    cost_price   NUMERIC(10,2),
    price        NUMERIC(10,2) NOT NULL,
    stock_qty    INTEGER NOT NULL DEFAULT 0,
    active       BOOLEAN NOT NULL DEFAULT TRUE,
    version      BIGINT NOT NULL DEFAULT 0,
    image_url    VARCHAR(255),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(active);

CREATE TABLE product_specs (
    id          BIGSERIAL PRIMARY KEY,
    product_id  BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    text        VARCHAR(255) NOT NULL,
    spec_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_product_specs_product ON product_specs(product_id);

CREATE TABLE carts (
    id          BIGSERIAL PRIMARY KEY,
    token       UUID NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cart_items (
    id          BIGSERIAL PRIMARY KEY,
    cart_id     BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id  BIGINT NOT NULL REFERENCES products(id),
    quantity    INTEGER NOT NULL DEFAULT 1,
    UNIQUE (cart_id, product_id)
);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

CREATE TABLE orders (
    id             BIGSERIAL PRIMARY KEY,
    reference      UUID NOT NULL UNIQUE,
    status         VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    full_name      VARCHAR(255) NOT NULL,
    email          VARCHAR(255) NOT NULL,
    phone          VARCHAR(255) NOT NULL,
    address_line1  VARCHAR(255) NOT NULL,
    address_line2  VARCHAR(255),
    city           VARCHAR(255) NOT NULL,
    province       VARCHAR(255) NOT NULL,
    postal_code    VARCHAR(255) NOT NULL,
    shipping_fee   NUMERIC(8,2) NOT NULL DEFAULT 0,
    total          NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_email ON orders(email);

CREATE TABLE order_items (
    id            BIGSERIAL PRIMARY KEY,
    order_id      BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id    BIGINT NOT NULL REFERENCES products(id),
    product_name  VARCHAR(255) NOT NULL,
    unit_price    NUMERIC(10,2) NOT NULL,
    quantity      INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX idx_order_items_order ON order_items(order_id);
