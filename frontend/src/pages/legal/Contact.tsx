import LegalPage from "./LegalPage";

export default function Contact() {
  return (
    <LegalPage title="Contact Us">
      <p>Questions about a product, an existing order, or a warranty claim? We're here to help.</p>

      <h2 className="font-display text-lg font-semibold mt-3">General enquiries</h2>
      <p>
        <a href="tel:+27842996061" className="text-amberdeep hover:underline">
          +27 84 299 6061
        </a>
      </p>

      <h2 className="font-display text-lg font-semibold mt-3">Returns & warranty claims</h2>
      <p>
        <a href="mailto:support@guardpulse.co.za" className="text-amberdeep hover:underline">
          support@guardpulse.co.za
        </a>
      </p>

      <h2 className="font-display text-lg font-semibold mt-3">Privacy requests</h2>
      <p>
        <a href="mailto:support@guardpulse.co.za" className="text-amberdeep hover:underline">
          support@guardpulse.co.za
        </a>
      </p>

      <p className="mt-4 text-xs text-muted">
        We aim to respond to all enquiries within 2 working days.
      </p>
    </LegalPage>
  );
}