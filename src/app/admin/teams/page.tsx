import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCurrentOrganization } from "@/lib/auth";
import { createTeam } from "./actions";

export default async function AdminTeamsPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const org = await requireCurrentOrganization();

  const teams = await prisma.team.findMany({
    where: { organizationId: org.id },
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Teams</h1>
        <p className="text-muted">{org.name}</p>
      </div>

      {searchParams.error && (
        <p className="rounded border border-fire/30 bg-fire/10 p-3 text-sm text-fire">
          {searchParams.error}
        </p>
      )}

      <div className="rounded-lg border border-blush bg-white p-4">
        {teams.length === 0 ? (
          <p className="text-sm text-muted">No teams yet — create the first one below.</p>
        ) : (
          <ul className="divide-y divide-blush">
            {teams.map((team) => (
              <li key={team.id} className="flex items-center justify-between py-3">
                <div>
                  <Link href={`/admin/teams/${team.id}`} className="font-semibold text-brick hover:underline">
                    {team.name}
                  </Link>
                  <div className="text-sm text-muted">
                    {team._count.members} {team._count.members === 1 ? "member" : "members"}
                  </div>
                </div>
                <Link href={`/admin/teams/${team.id}`} className="text-sm font-semibold text-gold hover:underline">
                  Manage →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-blush bg-white p-4">
        <h2 className="font-display text-lg font-bold">Create a team</h2>
        <form action={createTeam} className="mt-3 flex gap-3">
          <input
            type="text"
            name="name"
            placeholder="Team name"
            required
            className="flex-1 rounded border border-blush px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
          <button
            type="submit"
            className="rounded bg-gold px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Create team
          </button>
        </form>
      </div>
    </div>
  );
}
