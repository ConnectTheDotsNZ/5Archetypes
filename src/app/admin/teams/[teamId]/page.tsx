import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentOrganization } from "@/lib/auth";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { createMember, deleteMember } from "../actions";

export default async function AdminTeamPage({
  params,
  searchParams,
}: {
  params: { teamId: string };
  searchParams: { error?: string };
}) {
  const { organization: org } = await requireCurrentOrganization();

  const team = await prisma.team.findFirst({
    where: { id: params.teamId, organizationId: org.id },
    include: { members: { orderBy: { createdAt: "asc" } } },
  });
  if (!team) return notFound();

  const createMemberForTeam = createMember.bind(null, team.id);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/teams" className="text-sm font-semibold text-gold hover:underline">
          ← All teams
        </Link>
        <h1 className="font-display text-3xl font-bold">{team.name}</h1>
        <p className="text-muted">{org.name}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blush bg-white p-4">
        <div className="text-sm">
          <p className="font-semibold text-ink">Assessment scores</p>
          <p className="text-muted">
            Enter one member&apos;s five element scores by hand, or import the whole team from a CSV.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/admin/teams/${team.id}/scores`}
            className="rounded border border-gold px-4 py-2 text-sm font-semibold text-gold hover:bg-gold/10"
          >
            Manage scores
          </Link>
          <Link
            href={`/admin/teams/${team.id}/scores/upload`}
            className="rounded bg-gold px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Upload CSV
          </Link>
        </div>
      </div>

      {searchParams.error && (
        <p className="rounded border border-fire/30 bg-fire/10 p-3 text-sm text-fire">
          {searchParams.error}
        </p>
      )}

      <div className="rounded-lg border border-blush bg-white p-4">
        <h2 className="font-display text-lg font-bold">Members</h2>
        {team.members.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No members yet. Add the first one below.</p>
        ) : (
          <table className="mt-3 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-blush text-left">
                <th className="p-2">Name</th>
                <th className="p-2">Role title</th>
                <th className="p-2">Email</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {team.members.map((member) => {
                const deleteMemberById = deleteMember.bind(null, member.id);
                return (
                  <tr key={member.id} className="border-b border-blush last:border-0">
                    <td className="p-2 font-semibold">{member.name}</td>
                    <td className="p-2 text-muted">{member.roleTitle || "(none)"}</td>
                    <td className="p-2 text-muted">{member.email || "(none)"}</td>
                    <td className="p-2">
                      <div className="flex justify-end gap-3">
                        <Link
                          href={`/admin/teams/${team.id}/members/${member.id}/scores`}
                          className="font-semibold text-gold hover:underline"
                        >
                          Scores
                        </Link>
                        <Link
                          href={`/admin/teams/${team.id}/members/${member.id}/edit`}
                          className="font-semibold text-gold hover:underline"
                        >
                          Edit
                        </Link>
                        <form action={deleteMemberById}>
                          <ConfirmSubmitButton
                            confirmMessage={`Remove ${member.name} from ${team.name}?`}
                            className="font-semibold text-fire hover:underline"
                          >
                            Remove
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-lg border border-blush bg-white p-4">
        <h2 className="font-display text-lg font-bold">Add a member</h2>
        <form action={createMemberForTeam} className="mt-3 grid gap-3 sm:grid-cols-3">
          <input
            type="text"
            name="name"
            placeholder="Name"
            required
            className="rounded border border-blush px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
          <input
            type="text"
            name="roleTitle"
            placeholder="Role title"
            className="rounded border border-blush px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
          <input
            type="email"
            name="email"
            placeholder="Email (optional)"
            className="rounded border border-blush px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
          <button
            type="submit"
            className="sm:col-span-3 rounded bg-gold px-4 py-2 text-sm font-semibold text-white hover:opacity-90 sm:w-fit"
          >
            Add member
          </button>
        </form>
      </div>
    </div>
  );
}
