-- Adds parcel weight, used by shipping/ShippingService to price delivery.
ALTER TABLE products ADD COLUMN weight_kg NUMERIC(6,3) NOT NULL DEFAULT 0.5;