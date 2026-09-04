import type { Metadata } from "next";
import { MatchDashboard } from "@/components/match-dashboard";
import { requireAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Partidos | Falta Uno", description: "Encontrá, creá y gestioná tus partidos de pádel." };

export default function MatchesPage({ searchParams }: { searchParams: Promise<{ join?: string; private?: string; tab?: string }> }) {
  return <AuthenticatedMatches searchParams={searchParams} />;
}

async function AuthenticatedMatches({ searchParams }: { searchParams: Promise<{ join?: string; private?: string; tab?: string }> }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.join) query.set("join", params.join);
  if (params.private) query.set("private", params.private);
  if (params.tab === "create") query.set("tab", "create");
  const returnTo = query.size ? `/partidos?${query.toString()}` : "/partidos";
  await requireAuthUser(returnTo);
  return <MatchDashboard />;
}
