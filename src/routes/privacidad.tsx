import { createFileRoute, Link } from "@tanstack/react-router";
import { PrivacyContent } from "@/components/app/privacy-content";

export const Route = createFileRoute("/privacidad")({ component: Privacy });

function Privacy() {
  return (
    <main className="mx-auto min-h-screen max-w-lg px-5 py-8 pb-16">
      <Link to="/" className="inline-flex min-h-11 items-center text-sm text-clay">
        Volver a la app
      </Link>
      <h1 className="mt-2 font-display text-4xl text-fg">Privacidad</h1>
      <div className="mt-6">
        <PrivacyContent />
      </div>
    </main>
  );
}
