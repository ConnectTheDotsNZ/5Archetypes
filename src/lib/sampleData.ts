/**
 * Demo data for the unauthenticated /teams/demo pages, so the archetype
 * logic in src/lib/archetypes.ts is visibly exercised without a database
 * connection.
 *
 * "LawFam" is a fictional stand-in name: the roles and the five element
 * scores below are drawn from a real small-law-firm team's assessment
 * results (used with the firm's permission), but every person's name has
 * been replaced with a fake one and the firm's real name does not appear
 * anywhere. This route is public and unauthenticated by design (see
 * CLAUDE.md), so nothing identifying a real person or business belongs here.
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
    id: "anna",
    name: "Anna Whitfield",
    roleTitle: "Leadership & Legal Team",
    scores: { Wood: 0.504, Fire: 0.657, Earth: 0.666, Metal: 0.765, Water: 0.639 },
  },
  {
    id: "owen",
    name: "Owen Pratt",
    roleTitle: "Leadership & Legal Team",
    scores: { Wood: 0.9, Fire: 0.828, Earth: 0.729, Metal: 0.702, Water: 0.603 },
  },
  {
    id: "brooke",
    name: "Brooke Ashworth",
    roleTitle: "Admin Support (Sales)",
    scores: { Wood: 0.603, Fire: 0.747, Earth: 0.792, Metal: 0.693, Water: 0.54 },
  },
  {
    id: "marcus",
    name: "Marcus Halloran",
    roleTitle: "Chief Operating Officer",
    scores: { Wood: 0.837, Fire: 0.648, Earth: 0.693, Metal: 0.585, Water: 0.639 },
  },
  {
    id: "renee",
    name: "Renee Castillo",
    roleTitle: "Legal Team",
    scores: { Wood: 0.61, Fire: 0.67, Earth: 0.71, Metal: 0.72, Water: 0.68 },
  },
  {
    id: "natalie",
    name: "Natalie Byrne",
    roleTitle: "Admin Support (EA to COO)",
    scores: { Wood: 0.531, Fire: 0.77, Earth: 0.765, Metal: 0.657, Water: 0.666 },
  },
  {
    id: "paige",
    name: "Paige Sutherland",
    roleTitle: "Admin Support",
    scores: { Wood: 0.58, Fire: 0.84, Earth: 0.8, Metal: 0.63, Water: 0.49 },
  },
  {
    id: "isla",
    name: "Isla Fontaine",
    roleTitle: "Leadership & Admin Support",
    scores: { Wood: 0.675, Fire: 0.6666, Earth: 0.729, Metal: 0.837, Water: 0.693 },
  },
  {
    id: "theo",
    name: "Theo Bergman",
    roleTitle: "Legal Team - Supervisor",
    scores: { Wood: 0.621, Fire: 0.603, Earth: 0.567, Metal: 0.756, Water: 0.657 },
  },
  {
    id: "simone",
    name: "Simone Carter",
    roleTitle: "Legal Team",
    scores: { Wood: 0.765, Fire: 0.729, Earth: 0.549, Metal: 0.729, Water: 0.549 },
  },
  {
    id: "diane",
    name: "Diane Foster",
    roleTitle: "Legal Team",
    scores: { Wood: 0.594, Fire: 0.729, Earth: 0.693, Metal: 0.756, Water: 0.711 },
  },
  {
    id: "nathan",
    name: "Nathan Reeves",
    roleTitle: "Legal Team",
    scores: { Wood: 0.576, Fire: 0.666, Earth: 0.63, Metal: 0.63, Water: 0.684 },
  },
  {
    id: "felix",
    name: "Felix Tanaka",
    roleTitle: "Legal Team",
    scores: { Wood: 0.738, Fire: 0.603, Earth: 0.594, Metal: 0.747, Water: 0.729 },
  },
  {
    id: "harriet",
    name: "Harriet Nolan",
    roleTitle: "Legal Team",
    scores: { Wood: 0.441, Fire: 0.531, Earth: 0.45, Metal: 0.855, Water: 0.711 },
  },
  {
    id: "leon",
    name: "Leon Vasquez",
    roleTitle: "Legal Team - Supervisor",
    scores: { Wood: 0.72, Fire: 0.693, Earth: 0.783, Metal: 0.702, Water: 0.549 },
  },
  {
    id: "riley",
    name: "Riley Chapman",
    roleTitle: "Admin Support",
    scores: { Wood: 0.657, Fire: 0.585, Earth: 0.747, Metal: 0.81, Water: 0.567 },
  },
  {
    id: "megan",
    name: "Megan Ellis",
    roleTitle: "Admin Support",
    scores: { Wood: 0.65, Fire: 0.64, Earth: 0.7, Metal: 0.71, Water: 0.5 },
  },
  {
    id: "ruby",
    name: "Ruby Sanders",
    roleTitle: "Admin Support",
    scores: { Wood: 0.63, Fire: 0.693, Earth: 0.72, Metal: 0.657, Water: 0.495 },
  },
];

export function getDemoMember(id: string): DemoMember | undefined {
  return demoTeam.find((m) => m.id === id);
}
