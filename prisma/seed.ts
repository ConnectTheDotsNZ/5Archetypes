/**
 * Seeds one demo organization/team/members with fictional data, mirroring
 * src/lib/sampleData.ts. Run with `npm run prisma:seed` once DATABASE_URL
 * points at a real Postgres instance.
 */
import { PrismaClient, AssessmentSource } from "@prisma/client";
import { demoTeam } from "../src/lib/sampleData";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.create({
    data: { name: "Acme Legal (demo)", region: "US" },
  });

  const team = await prisma.team.create({
    data: { name: "Leadership Team", organizationId: org.id },
  });

  for (const m of demoTeam) {
    await prisma.member.create({
      data: {
        teamId: team.id,
        name: m.name,
        roleTitle: m.roleTitle,
        assessments: {
          create: {
            source: AssessmentSource.MANUAL_ENTRY,
            wood: m.scores.Wood,
            fire: m.scores.Fire,
            earth: m.scores.Earth,
            metal: m.scores.Metal,
            water: m.scores.Water,
          },
        },
      },
    });
  }

  console.log(`Seeded org ${org.id} with ${demoTeam.length} members.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
