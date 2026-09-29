import LegalPage from "./LegalPage";

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="September 2026">
      <p>
        GuardPulse ("we", "us") respects your privacy and handles personal information in line
        with South Africa's Protection of Personal Information Act (POPIA). This policy explains
        what we collect, why, and what rights you have over it.
      </p>

      <h2 className="font-display text-lg font-semibold mt-3">What we collect</h2>
      <p>
        When you place an order, we collect your name, email address, phone number, and delivery
        address. Payment card details are handled entirely by our payment gateway — we never see
        or store your card number. We also collect basic technical data (like which pages you
        visit) to keep the site working and improve it.
      </p>

      <h2 className="font-display text-lg font-semibold mt-3">Why we collect it</h2>
      <ul className="ml-5 list-disc grid gap-1.5">
        <li>To process and deliver your order</li>
        <li>To send order confirmation and shipping updates</li>
        <li>To handle warranty claims, returns, and customer support</li>
        <li>To meet our legal and tax record-keeping obligations</li>
      </ul>

      <h2 className="font-display text-lg font-semibold mt-3">Who we share it with</h2>
      <p>
        We share the minimum necessary information with: our courier partner (to deliver your
        order), our payment gateway (to process payment — they receive your payment details
        directly, not us), and, if required, regulators or law enforcement where we're legally
        obliged to. We do not sell your personal information to anyone.
      </p>

      <h2 className="font-display text-lg font-semibold mt-3">How long we keep it</h2>
      <p>
        We keep order records for as long as required by South African tax and consumer
        protection law (typically 5 years), after which they're securely deleted or anonymised.
      </p>

      <h2 className="font-display text-lg font-semibold mt-3">Your rights under POPIA</h2>
      <p>You have the right to:</p>
      <ul className="ml-5 list-disc grid gap-1.5">
        <li>Ask what personal information we hold about you</li>
        <li>Ask us to correct inaccurate information</li>
        <li>Ask us to delete your information, subject to our legal retention obligations</li>
        <li>Object to how your information is used</li>
        <li>Lodge a complaint with the Information Regulator of South Africa</li>
      </ul>
      <p>
        To exercise any of these rights, contact our Information Officer at{" "}
        <a href="mailto:support@guardpulse.co.za" className="text-amberdeep hover:underline">
         support@guardpulse.co.za
        </a>.
      </p>

      <h2 className="font-display text-lg font-semibold mt-3">Security</h2>
      <p>
        We use reasonable technical and organisational measures to protect your information,
        including encrypted connections (HTTPS) and restricted access to order data.
      </p>

      <p className="mt-4 text-xs text-muted">
        This page is a general summary and not legal advice. Before taking this store live, have
        a professional review this policy and confirm your registered Information Officer details
        with the Information Regulator, as required under POPIA.
      </p>
    </LegalPage>
  );
}
