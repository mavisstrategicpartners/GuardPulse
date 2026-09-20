package com.aismartcamerasecurity.backend.shipping;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Weight-tiered shipping rates, structured the way South African courier pricing (RAM
 * included) actually works — small satchel, then step up by weight band.
 *
 * IMPORTANT: RAM doesn't publish a public rate API (unlike The Courier Guy, DPD Laser,
 * Aramex or Fastway, which do). Getting RAM's real, current rates for your account
 * requires either a direct RAM business account or going through an aggregator like
 * Bob Go (formerly uAfrica) or Shiplogic, both of which bridge to RAM's live rates for
 * account holders. The tier1Fee default below (R110) is RAM's own published "from"
 * price for their small-parcel satchel service as of when this was written — the tiers
 * above that are reasonable estimates in the same step-up pattern other SA couriers use,
 * NOT quoted RAM figures. Replace every value here with your real numbers the moment
 * you have a RAM or Bob Go account — see application.properties for how.
 */
@Component
public class ShippingRates {

    @Value("${shipping.tier1-max-kg}")
    BigDecimal tier1MaxKg;
    @Value("${shipping.tier1-fee}")
    BigDecimal tier1Fee;

    @Value("${shipping.tier2-max-kg}")
    BigDecimal tier2MaxKg;
    @Value("${shipping.tier2-fee}")
    BigDecimal tier2Fee;

    @Value("${shipping.tier3-max-kg}")
    BigDecimal tier3MaxKg;
    @Value("${shipping.tier3-fee}")
    BigDecimal tier3Fee;

    @Value("${shipping.tier4-max-kg}")
    BigDecimal tier4MaxKg;
    @Value("${shipping.tier4-fee}")
    BigDecimal tier4Fee;

    /** Per-kg surcharge for weight beyond tier4MaxKg. */
    @Value("${shipping.over-tier4-rate-per-kg}")
    BigDecimal overTier4RatePerKg;
}