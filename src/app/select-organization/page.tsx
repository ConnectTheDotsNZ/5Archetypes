import { redirect } from "next/navigation";
import { requireCurrentUser, getAvailableMemberships } from "@/lib/auth";
import { switchOrganization } from "@/app/organizations/actions";

/**
 * Shown only to a multi-org user with no resolvable active org yet — e.g.
 * their first login after being invited to a second org, or a cleared
 * cookie. requireCurrentOrganization() redirects here in that case; a
 * single-org user never sees this page.
 */
export default async function SelectOrganizationPage() {
  await requireCurrentUser();
  const memberships = await getAvailableMemberships();

  if (memberships.length <= 1) redirect("/admin/teams");

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Choose an organisation</h1>
        <p className="text-muted">You have access to more than one. Pick one to continue.</p>
      </div>

      <div className="space-y-2">
        {memberships.map((m) => (
          <form key={m.organization.id} action={switchOrganization}>
            <input type="hidden" name="organizationId" value={m.organization.id} />
            <button
              type="submit"
              className="flex w-full items-center justify-between rounded-lg border border-blush bg-white p-4 text-left shadow-sm transition hover:shadow-md"
            >
              <span className="font-semibold text-ink">{m.organization.name}</span>
              <span className="text-sm text-muted">{m.role === "ADMIN" ? "Admin" : "Manager"}</span>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
