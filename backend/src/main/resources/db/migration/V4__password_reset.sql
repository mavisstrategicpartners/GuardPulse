-- "Forgot password" tokens. A row is created when a customer requests a reset and deleted
-- the moment it's used (or replaced, if they request another one before using the first).
-- Only the SHA-256 hash of the token is stored, same as auth_tokens, so a database leak
-- doesn't hand out usable reset links.

CREATE TABLE password_reset_tokens (
    id           BIGSERIAL PRIMARY KEY,
    token_hash   VARCHAR(64) NOT NULL UNIQUE,
    customer_id  BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at   TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_password_reset_tokens_customer ON password_reset_tokens(customer_id);