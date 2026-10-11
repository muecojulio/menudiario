import { createFileRoute, Link } from "@tanstack/react-router";
import { PrivacyContent } from "@/components/privacy-content";

export const Route = createFileRoute("/privacidad")({ component: Privacy });

function Privacy() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-8 pb-16 sm:px-8">
      <Link to="/" className="back-link">
        ← Volver a Menú Diario
      </Link>
      <PrivacyContent />
    </main>
  );
}
