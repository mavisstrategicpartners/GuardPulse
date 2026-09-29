import LegalPage from "./LegalPage";

export default function Delivery() {
  return (
    <LegalPage title="Delivery Info">
      <p>We deliver nationwide across South Africa. Here's what to expect.</p>

      <h2 className="font-display text-lg font-semibold mt-3">Delivery times</h2>
      <p>
        Most orders arrive within <strong>2–4 working days</strong> of dispatch, depending on your
        location. Major metros (Johannesburg, Pretoria, Cape Town, Durban) are typically on the
        faster end; more remote areas can take a little longer.
      </p>

      <h2 className="font-display text-lg font-semibold mt-3">Delivery cost</h2>
      <p>
        Delivery cost is calculated at checkout based on your order and location. We'll always
        show you the final cost before you pay — no surprises.
      </p>

      <h2 className="font-display text-lg font-semibold mt-3">Tracking your order</h2>
      <p>
        Once your order ships, we'll email you a tracking link. You can also check your order
        status any time using the reference number from your confirmation email.
      </p>

      <h2 className="font-display text-lg font-semibold mt-3">Something wrong with delivery?</h2>
      <p>
        If your order hasn't arrived within the expected window, or arrived damaged, email{" "}
        <a href="mailto:support@guardpulse.co.za" className="text-amberdeep hover:underline">
          support@guardpulse.co.za
        </a>{" "}
        with your order reference and we'll sort it out.
      </p>
    </LegalPage>
  );
}
