/**
 * The unit of report copy, shared by every content library.
 *
 * A block is either copy Carey has approved or an explicit placeholder naming
 * what's still owed. Report templates render both, so approving content is a
 * data change in a library file rather than a change to a template — the
 * direction docs/BUILD_PLAN.md Section 7.3 sets out.
 */

export type ContentBlock =
  | {
      status: "PLACEHOLDER";
      /** What Carey still owes us, shown verbatim in the rendered report. */
      awaiting: string;
    }
  | {
      status: "APPROVED";
      paragraphs?: string[];
      bullets?: string[];
      /** Where the approved copy came from, for audit (e.g. "content-library v1"). */
      sourceRef?: string;
    };

export function pending(awaiting: string): ContentBlock {
  return { status: "PLACEHOLDER", awaiting };
}

/** True when nothing in the given set has been approved yet. */
export function allPlaceholders(blocks: ContentBlock[]): boolean {
  return blocks.every((block) => block.status === "PLACEHOLDER");
}
