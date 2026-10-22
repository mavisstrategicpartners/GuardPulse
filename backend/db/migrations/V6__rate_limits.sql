-- Rate limiting that works across serverless instances (the old in-memory limiter could not).
CREATE TABLE rate_limits (
    key     VARCHAR(255) NOT NULL,
    window_start BIGINT NOT NULL,
    count   INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (key, window_start)
);
