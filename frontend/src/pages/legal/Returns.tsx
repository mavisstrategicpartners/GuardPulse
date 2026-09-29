import LegalPage from "./LegalPage";

export default function Returns() {
  return (
    <LegalPage title="Warranty & Returns" updated="September 2026">
      <p>
        We want you to be confident buying a security camera from us. This page explains your
        rights under South African consumer law, plus how our supplier warranty works in practice.
      </p>

      <h2 className="font-display text-lg font-semibold mt-3">7-day cooling-off period</h2>
      <p>
        Because this is an online purchase, the Electronic Communications and Transactions Act
        gives you the right to cancel your order within <strong>7 days</strong> of receiving it,
        for any reason, without penalty. To use this right, email us at{" "}
        <a href="mailto:support@guardpulse.co.za" className="text-amberdeep hover:underline">
          support@guardpulse.co.za
        </a>{" "}
        within 7 days of delivery. The camera must be unused, in its original packaging, with all
        accessories included. We'll refund your purchase price within a reasonable time once we've
        received and checked the returned item. You're responsible for return shipping costs unless
        the item arrived faulty or wasn't what you ordered.
      </p>

      <h2 className="font-display text-lg font-semibold mt-3">Faulty or defective items</h2>
      <p>
        Under the Consumer Protection Act, if a camera develops a defect or doesn't work as
        described within <strong>6 months</strong> of delivery, you can ask us to repair, replace,
        or refund it, your choice. Contact us with your order reference and a description of the
        issue and we'll arrange a courier collection at no cost to you.
      </p>

      <h2 className="font-display text-lg font-semibold mt-3">Manufacturer warranty</h2>
      <p>
        Every camera we sell carries a <strong>12-month warranty</strong> backed by the original
        manufacturer (Xiaomi or TP-Link) against manufacturing defects under normal use. This
        doesn't cover accidental damage, water ingress outside the unit's rated IP class, power
        surge damage, or wear from installation. If a fault falls under manufacturer warranty
        after the 6-month CPA period, we'll help coordinate the claim on your behalf.
      </p>

      <h2 className="font-display text-lg font-semibold mt-3">What's excluded</h2>
      <p>
        Change-of-mind returns outside the 7-day window, items damaged by misuse or incorrect
        installation, and MicroSD cards or other consumables once opened, aren't covered by this
        policy. This doesn't affect any other statutory rights you have.
      </p>

      <h2 className="font-display text-lg font-semibold mt-3">How to start a return or claim</h2>
      <p>
        Email <a href="mailto:support@guardpulse.co.za" className="text-amberdeep hover:underline">support@guardpulse.co.za</a>{" "}
        with your order reference (from your confirmation email), the item involved, and a short
        description of the issue. We aim to respond within 2 working days.
      </p>

      <p className="mt-4 text-xs text-muted">
        This page is a general summary and not legal advice. It doesn't limit any rights you have
        under South African law.
      </p>
    </LegalPage>
  );
}
