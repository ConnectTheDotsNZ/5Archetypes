/**
 * Fictional demo data — NOT real client or Norling Law data. Used to drive
 * the demo pages under /teams/demo so the archetype logic in
 * src/lib/archetypes.ts is visibly exercised without a database connection.
 * Replace with real Prisma-backed data once ingestion (CSV/manual entry) is
 * wired up — see docs/CLAUDE_CODE_KICKOFF.md.
 */
import type { ScoreProfile } from "./archetypes";

export type DemoMember = {
  id: string;
  name: string;
  roleTitle: string;
  scores: ScoreProfile;
};

export const demoTeam: DemoMember[] = [
  {
    id: "avery",
    name: "Avery Chen",
    roleTitle: "Managing Partner",
    scores: { Wood: 0.86, Fire: 0.58, Earth: 0.41, Metal: 0.63, Water: 0.39 },
  },
  {
    id: "priya",
    name: "Priya Nair",
    roleTitle: "Operations Lead",
    scores: { Wood: 0.44, Fire: 0.52, Earth: 0.81, Metal: 0.57, Water: 0.49 },
  },
  {
    id: "sam",
    name: "Sam Okafor",
    roleTitle: "Senior Associate",
    scores: { Wood: 0.61, Fire: 0.39, Earth: 0.47, Metal: 0.79, Water: 0.55 },
  },
  {
    id: "lena",
    name: "Lena Fischer",
    roleTitle: "Client Services",
    scores: { Wood: 0.35, Fire: 0.83, Earth: 0.66, Metal: 0.42, Water: 0.37 },
  },
];

export function getDemoMember(id: string): DemoMember | undefined {
  return demoTeam.find((m) => m.id === id);
}
