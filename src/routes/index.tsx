import { createFileRoute } from "@tanstack/react-router";
import { MenuApp } from "@/components/menu-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <MenuApp />;
}
