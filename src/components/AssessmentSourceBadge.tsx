import { AssessmentSource } from "@prisma/client";

const SOURCE_LABELS: Record<AssessmentSource, string> = {
  MANUAL_ENTRY: "Manual entry",
  CSV_UPLOAD: "CSV upload",
  CONNECTOR: "Connector",
};

const SOURCE_STYLES: Record<AssessmentSource, string> = {
  MANUAL_ENTRY: "border-gold/40 bg-gold/10 text-gold",
  CSV_UPLOAD: "border-water/40 bg-water/10 text-water",
  CONNECTOR: "border-metal/40 bg-metal/10 text-metal",
};

/** Shows where a stored Assessment's scores came from (Assessment.source). */
export function AssessmentSourceBadge({ source }: { source: AssessmentSource }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded border px-2 py-0.5 text-xs font-semibold ${SOURCE_STYLES[source]}`}
    >
      {SOURCE_LABELS[source]}
    </span>
  );
}
