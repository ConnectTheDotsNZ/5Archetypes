import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCurrentOrganization } from "@/lib/auth";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { inviteMember, removeMember } from "./actions";

export default async function OrganizationMembersPage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string };
}) {
  const { organization, role } = await requireCurrentOrganization();

  const memberships = await prisma.organizationMembership.findMany({
    where: { organizationId: organization.id },
    include: { user: { select: { email: true } }, invitedBy: { select: { email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/teams" className="text-sm font-semibold text-gold hover:underline">
          ← Manage teams
        </Link>
        <h1 className="font-display text-3xl font-bold">People with access</h1>
        <p className="text-muted">{organization.name}</p>
      </div>

      {searchParams.saved && (
        <p className="rounded border border-wood/30 bg-wood/10 p-3 text-sm text-wood">
          {searchParams.saved}
        </p>
      )}
      {searchParams.error && (
        <p className="rounded border border-fire/30 bg-fire/10 p-3 text-sm text-fire">
          {searchParams.error}
        </p>
      )}

      <div className="rounded-lg border border-blush bg-white p-4">
        <h2 className="font-display text-lg font-bold">Members</h2>
        <table className="mt-3 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-blush text-left">
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">Invited by</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {memberships.map((m) => {
              const removeThis = removeMember.bind(null, m.id);
              return (
                <tr key={m.id} className="border-b border-blush last:border-0">
                  <td className="p-2 font-semibold">{m.user.email}</td>
                  <td className="p-2 text-muted">{m.role === "ADMIN" ? "Admin" : "Manager"}</td>
                  <td className="p-2 text-muted">{m.invitedBy?.email ?? "(sign-up)"}</td>
                  <td className="p-2 text-right">
                    {role === "ADMIN" && (
                      <form action={removeThis}>
                        <ConfirmSubmitButton
                          confirmMessage={`Remove ${m.user.email}'s access to ${organization.name}?`}
                          className="font-semibold text-fire hover:underline"
                        >
                          Remove
                        </ConfirmSubmitButton>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {role === "ADMIN" && (
        <div className="rounded-lg border border-blush bg-white p-4">
          <h2 className="font-display text-lg font-bold">Invite someone</h2>
          <p className="mt-1 text-sm text-muted">
            Gives them access to {organization.name} the next time they log in. If they already
            have an account elsewhere on the platform, this just adds this organisation to it.
          </p>
          <form action={inviteMember} className="mt-3 flex flex-wrap gap-3">
            <input
              type="email"
              name="email"
              placeholder="Email address"
              required
              className="flex-1 rounded border border-blush px-3 py-2 text-sm focus:border-gold focus:outline-none"
            />
            <select
              name="role"
              defaultValue="ADMIN"
              className="rounded border border-blush px-3 py-2 text-sm focus:border-gold focus:outline-none"
            >
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
            </select>
            <button
              type="submit"
              className="rounded bg-gold px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Invite
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
