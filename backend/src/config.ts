const env = (k: string, d = ""): string => (process.env[k] ?? d).trim();
const num = (k: string, d: number): number => {
  const n = Number(process.env[k]);
  return Number.isFinite(n) && process.env[k] !== undefined && process.env[k] !== "" ? n : d;
};

/** Read lazily so tests and scripts can set process.env before first use. */
export function config() {
  // Only an explicit "false" goes live — a typo or blank can never charge real money by accident.
  const sandbox = env("PAYFAST_SANDBOX", "true").toLowerCase() !== "false";
  return {
    databaseUrl: env("DATABASE_URL"),
    frontendUrl: env("APP_FRONTEND_URL", "http://localhost:5173"),
    corsOrigins: env("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
      .split(/\s*,\s*/).filter(Boolean),
    admin: {
      username: env("ADMIN_USERNAME", "admin"),
      password: env("ADMIN_PASSWORD"),
      sessionSecret: env("SESSION_SECRET"),
    },
    mail: {
      enabled: env("MAIL_ENABLED", "true").toLowerCase() === "true",
      from: env("MAIL_FROM", "noreply@guardpulse.co.za"),
      adminAddress: env("MAIL_ADMIN_ADDRESS", "admin@guardpulse.co.za"),
      resendKey: env("RESEND_API_KEY"),
    },
    payfast: {
      sandbox,
      // PayFast's published public sandbox account — used only when no merchant id is set in sandbox mode.
      merchantId: env("PAYFAST_MERCHANT_ID", sandbox ? "10000100" : ""),
      merchantKey: env("PAYFAST_MERCHANT_KEY", sandbox ? "46f0cd694581a" : ""),
      passphrase: env("PAYFAST_PASSPHRASE"),
      returnUrl: env("PAYFAST_RETURN_URL", "http://localhost:5173/order"),
      cancelUrl: env("PAYFAST_CANCEL_URL", "http://localhost:5173/order"),
      notifyUrl: env("PAYFAST_NOTIFY_URL", "http://localhost:8000/api/payments/payfast/itn"),
    },
    rateLimitPerMinute: num("RATELIMIT_PER_MINUTE", 60),
    shipping: {
      tier1MaxKg: num("SHIPPING_TIER1_MAX_KG", 1), tier1Fee: num("SHIPPING_TIER1_FEE", 110),
      tier2MaxKg: num("SHIPPING_TIER2_MAX_KG", 3), tier2Fee: num("SHIPPING_TIER2_FEE", 145),
      tier3MaxKg: num("SHIPPING_TIER3_MAX_KG", 5), tier3Fee: num("SHIPPING_TIER3_FEE", 175),
      tier4MaxKg: num("SHIPPING_TIER4_MAX_KG", 10), tier4Fee: num("SHIPPING_TIER4_FEE", 220),
      overTier4RatePerKg: num("SHIPPING_OVER_TIER4_RATE", 15),
    },
    courier: {
      apiKey: env("COURIER_API_KEY"),
      baseUrl: env("COURIER_BASE_URL", "https://api.portal.thecourierguy.co.za"),
      authScheme: env("COURIER_AUTH_SCHEME", "Bearer"),
      excludeCodes: env("COURIER_EXCLUDE_CODES", "SDX,LSF,LSP").split(",").map((s) => s.trim()).filter(Boolean),
      collect: {
        company: env("COURIER_COLLECT_COMPANY", "GuardPulse"),
        street: env("COURIER_COLLECT_STREET"), area: env("COURIER_COLLECT_AREA"),
        city: env("COURIER_COLLECT_CITY"), zone: env("COURIER_COLLECT_ZONE"), code: env("COURIER_COLLECT_CODE"),
      },
      box: { l: num("COURIER_BOX_LENGTH_CM", 30), w: num("COURIER_BOX_WIDTH_CM", 20), h: num("COURIER_BOX_HEIGHT_CM", 15) },
    },
    store: {
      vatNumber: env("STORE_VAT_NUMBER"),
      vatRatePercent: num("STORE_VAT_RATE_PERCENT", 15),
      pricesIncludeVat: env("STORE_PRICES_INCLUDE_VAT", "true").toLowerCase() !== "false",
    },
    blobToken: env("BLOB_READ_WRITE_TOKEN"),
  };
}
