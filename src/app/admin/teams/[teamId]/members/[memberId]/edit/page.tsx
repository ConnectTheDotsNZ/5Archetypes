import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentOrganization } from "@/lib/auth";
import { updateMember } from "@/app/admin/teams/actions";

export default async function EditMemberPage({
  params,
  searchParams,
}: {
  params: { teamId: string; memberId: string };
  searchParams: { error?: string };
}) {
  const org = await requireCurrentOrganization();

  const member = await prisma.member.findFirst({
    where: { id: params.memberId, teamId: params.teamId, team: { organizationId: org.id } },
  });
  if (!member) return notFound();

  const updateThisMember = updateMember.bind(null, member.id);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/teams/${params.teamId}`} className="text-sm font-semibold text-gold hover:underline">
          ← Back to team
        </Link>
        <h1 className="font-display text-3xl font-bold">Edit member</h1>
      </div>

      {searchParams.error && (
        <p className="rounded border border-fire/30 bg-fire/10 p-3 text-sm text-fire">
          {searchParams.error}
        </p>
      )}

      <form action={updateThisMember} className="max-w-md space-y-3 rounded-lg border border-blush bg-white p-4">
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-ink">Name</span>
          <input
            type="text"
            name="name"
            required
            defaultValue={member.name}
            className="w-full rounded border border-blush px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-ink">Role title</span>
          <input
            type="text"
            name="roleTitle"
            defaultValue={member.roleTitle ?? ""}
            className="w-full rounded border border-blush px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-ink">Email (optional)</span>
          <input
            type="email"
            name="email"
            defaultValue={member.email ?? ""}
            className="w-full rounded border border-blush px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-gold px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Save changes
        </button>
      </form>
    </div>
  );
}
