const WHATSAPP_NUMBER = "27842996061"; // +27 84 299 6061, international format, no + or spaces

export default function WhatsAppButton() {
  const message = encodeURIComponent("Hi GuardPulse, I'd like help choosing a camera kit.");
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-105"
    >
      <svg viewBox="0 0 24 24" fill="white" className="h-7 w-7">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.48 1.32 5l-1.4 5.12 5.25-1.37c1.47.8 3.12 1.22 4.8 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C22 6.45 17.55 2 12.04 2zm5.83 14.15c-.25.69-1.24 1.26-2.01 1.42-.53.11-1.23.2-3.57-.77-2.99-1.24-4.92-4.27-5.07-4.47-.15-.2-1.2-1.6-1.2-3.04 0-1.45.75-2.15 1.03-2.45.25-.28.56-.35.75-.35h.54c.17 0 .4-.02.62.47.25.57.85 1.98.93 2.12.08.15.13.32.03.52-.1.2-.15.32-.3.49-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.3.77 1.27 1.65 2.06 1.14 1.02 2.1 1.33 2.4 1.48.3.15.47.13.65-.08.18-.2.76-.89.96-1.19.2-.3.4-.25.68-.15.28.1 1.78.84 2.08.99.3.15.5.22.57.35.08.13.08.72-.17 1.41z" />
      </svg>
    </a>
  );
}