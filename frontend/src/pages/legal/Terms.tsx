import LegalPage from "./LegalPage";

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="September 2026">
      <p>
        These terms govern your use of the GuardPulse website and any purchase you make through
        it. By placing an order, you agree to them.
      </p>

      <h2 className="font-display text-lg font-semibold mt-3">Pricing and availability</h2>
      <p>
       All prices are listed in South African Rand (ZAR). We make reasonable efforts to keep stock levels accurate,
        but availability isn't guaranteed until your order is confirmed. If an item you ordered turns out to be unavailable, we'll
        contact you and offer a refund or alternative.
      </p>

      <h2 className="font-display text-lg font-semibold mt-3">Orders and payment</h2>
      <p>
        An order is only confirmed once payment has been successfully processed by our payment
        gateway. We reserve the right to cancel an order (with a full refund) if we suspect fraud
        or if a listed price was clearly a pricing error.
      </p>

      <h2 className="font-display text-lg font-semibold mt-3">Delivery</h2>
      <p>
        We deliver nationwide across South Africa via our courier partners, typically within 2–4
        working days of dispatch. Delivery times are estimates, not guarantees, and can be
        affected by courier delays outside our control.
      </p>

      <h2 className="font-display text-lg font-semibold mt-3">Returns and warranty</h2>
      <p>
        See our{" "}
        <a href="/returns" className="text-amberdeep hover:underline">
          Warranty & Returns
        </a>{" "}
        page for your rights under the Consumer Protection Act and the Electronic Communications
        and Transactions Act, and how manufacturer warranty claims work.
      </p>

      <h2 className="font-display text-lg font-semibold mt-3">Acceptable use</h2>
      <p>
        You agree not to use this site for any unlawful purpose, to attempt to interfere with its
        operation, or to place orders using false information.
      </p>

      <h2 className="font-display text-lg font-semibold mt-3">Limitation of liability</h2>
      <p>
        We supply cameras "as described" and aren't liable for indirect or consequential loss
        arising from their use — for example, footage not being captured due to a device fault.
        Nothing in these terms limits rights that can't lawfully be excluded under South African
        consumer law.
      </p>

      <h2 className="font-display text-lg font-semibold mt-3">Contact</h2>
      <p>
        Questions about these terms can be sent to{" "}
        <a href="support@guardpulse.co.za" className="text-amberdeep hover:underline">
          support@guardpulse.co.za
        </a>.
      </p>

      <p className="mt-4 text-xs text-muted">
        This page is a general summary and not legal advice. Have a professional review these
        terms before taking this store live.
      </p>
    </LegalPage>
  );
}
