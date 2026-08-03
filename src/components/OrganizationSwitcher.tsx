"use client";

import { usePathname } from "next/navigation";
import type { CurrentMembership } from "@/lib/auth";
import { switchOrganization } from "@/app/organizations/actions";

/**
 * A single-membership user (the common case) sees the same plain org-name
 * text this always rendered — no dropdown, no visible change. Only a user
 * with 2+ memberships (consultant, coach, platform staff, Carey) sees a
 * switcher at all.
 */
export function OrganizationSwitcher({
  memberships,
  currentOrganizationId,
}: {
  memberships: CurrentMembership[];
  currentOrganizationId: string | null;
}) {
  const pathname = usePathname();

  if (memberships.length === 0) return null;
  if (memberships.length === 1) {
    return <span className="font-normal text-muted">{memberships[0].organization.name}</span>;
  }

  return (
    <form action={switchOrganization} className="flex items-center gap-2">
      <input type="hidden" name="returnTo" value={pathname} />
      <select
        name="organizationId"
        defaultValue={currentOrganizationId ?? ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded border border-blush bg-white px-2 py-1 text-sm font-normal text-ink"
      >
        {!currentOrganizationId && (
          <option value="" disabled>
            Choose an organisation…
          </option>
        )}
        {memberships.map((m) => (
          <option key={m.organization.id} value={m.organization.id}>
            {m.organization.name} ({m.role === "ADMIN" ? "Admin" : "Manager"})
          </option>
        ))}
      </select>
    </form>
  );
}
