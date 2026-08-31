/**
 * The Workplace Pairwise Relationship Report template.
 *
 * Structure follows the merged template in docs/BUILD_PLAN.md Section 3.2 —
 * Core Dynamic, In Practice, Score Impact, Predictable Escalation Loop, Risks,
 * Calibration Tools, Direct Script — with the Fields layer (Blame Loop, Bridge
 * element, Water Doorway, Distortions) shown where it applies.
 *
 * Presentational only. Facts come from the computed model; interpretation
 * comes from content blocks Carey owns. Same component renders the web view
 * and the PDF.
 */

import type { ContentBlock } from "@/lib/content/blocks";
import type { ElementComparison, PairPerson, PairwiseReportModel } from "@/lib/reports/pairwiseReport";
import { REPORT_CSS } from "./reportStyles";

const PLACEHOLDER_MARKER = "[PLACEHOLDER: pending Carey's content library]";

function formatPercent(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatDelta(delta: number): string {
  return `${delta > 0 ? "+" : ""}${delta.toFixed(3)}`;
}

function ContentBlockView({ label, block }: { label?: string; block: ContentBlock }) {
  return (
    <div className="fa-field">
      {label && <div className="fa-field-label">{label}</div>}
      {block.status === "PLACEHOLDER" ? (
        <div className="fa-placeholder">
          <span className="fa-placeholder-marker">{PLACEHOLDER_MARKER}</span>
          {block.awaiting}
        </div>
      ) : (
        <>
          {block.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {block.bullets && block.bullets.length > 0 && (
            <ul className="fa-inline-list">
              {block.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function PersonCard({ person }: { person: PairPerson }) {
  return (
    <div className="fa-pair-person">
      <div className="fa-pair-name">{person.name}</div>
      {person.roleTitle && <div className="fa-pair-role">{person.roleTitle}</div>}
      <div className="fa-pair-lead">
        Leads with <strong>{person.primary}</strong>: {person.primaryNickname}
        <br />
        Lowest: {person.lowest} ({formatPercent(person.scores[person.lowest])})
      </div>
    </div>
  );
}

function DeltaCell({ comparison, nameA, nameB }: { comparison: ElementComparison; nameA: string; nameB: string }) {
  if (comparison.higher === null) {
    return <span className="fa-delta-zero">level</span>;
  }
  const className = comparison.higher === "A" ? "fa-delta-pos" : "fa-delta-neg";
  const who = comparison.higher === "A" ? nameA : nameB;
  return (
    <span className={className}>
      {formatDelta(comparison.delta)} · {who}
    </span>
  );
}

export function PairwiseRelationshipReport({
  model,
  omitStyles = false,
}: {
  model: PairwiseReportModel;
  omitStyles?: boolean;
}) {
  const { a, b, framing } = model;
  const contextLine = [model.teamName, model.organizationName].filter(Boolean).join(" · ");

  return (
    <div className="fa-report">
      {!omitStyles && <style dangerouslySetInnerHTML={{ __html: REPORT_CSS }} />}

      <header className="fa-header">
        <div className="fa-doc-kind">Workplace Relationship Report</div>
        <h1>
          {a.name} &amp; {b.name}
        </h1>
        {contextLine && <div className="fa-subject">{contextLine}</div>}
        <div className="fa-provenance">Generated {formatDate(model.generatedAt)}</div>
      </header>

      {model.awaitingContentLibrary && (
        <div className="fa-section fa-note">
          <strong>Draft template.</strong> The structure and every number below are final; the
          narrative copy is not. Each dashed block is content Carey still needs to author for this
          archetype pairing ({model.pairKey.replace("+", " / ")}), and the platform has written no
          interpretation of its own.
        </div>
      )}

      <section className="fa-section">
        <h2>The two of you</h2>
        <div className="fa-pair-grid">
          <PersonCard person={a} />
          <PersonCard person={b} />
        </div>

        <div className="fa-flags">
          {model.sameLead && <span className="fa-flag fa-flag-same">Same primary archetype</span>}
          {model.shengNeighbours && (
            <span className="fa-flag fa-flag-ally">Natural allies</span>
          )}
          {model.keChallengers && (
            <span className="fa-flag fa-flag-friction">Natural challengers: button-pushers</span>
          )}
          {model.bridgeElement && (
            <span className="fa-flag">Bridge element: {model.bridgeElement}</span>
          )}
          {model.sharedStrengths.length > 0 && (
            <span className="fa-flag">Shared strength: {model.sharedStrengths.join(", ")}</span>
          )}
          {model.sharedBlindSpots.length > 0 && (
            <span className="fa-flag">Shared blind spot: {model.sharedBlindSpots.join(", ")}</span>
          )}
        </div>

        <p className="fa-section-purpose">{framing.structural.frictionNote}</p>
      </section>

      <section className="fa-section">
        <h2>Sequencing comparison</h2>
        <p className="fa-sequence-chain">
          {a.name}: {a.ranked.map((r) => r.element).join(" → ")}
        </p>
        <p className="fa-sequence-chain">
          {b.name}: {b.ranked.map((r) => r.element).join(" → ")}
        </p>
        <ContentBlockView
          label="What a sequencing comparison shows"
          block={framing.sequencingComparisonExplainer}
        />
        <div className="fa-field">
          <div className="fa-field-label">Shared lead</div>
          <p>
            {model.sharedStrengths.length > 0
              ? `${a.name} and ${b.name} both carry ${model.sharedStrengths.join(
                  " and "
                )} among their top two elements, so those functions tend to be available to the pairing early and on both sides.`
              : `${a.name} and ${b.name} don't share either of their top two elements — their sequences lead in different directions, so the functions each of them reaches for first are likely to come from different places.`}
          </p>
        </div>
        <div className="fa-field">
          <div className="fa-field-label">Sharpest sequencing contrast</div>
          <p>
            {model.biggestSequenceGap.element} is the widest gap in rank position between you: it's{" "}
            {a.name}&apos;s {model.biggestSequenceGap.labelA} (rank {model.biggestSequenceGap.rankA})
            but {b.name}&apos;s {model.biggestSequenceGap.labelB} (rank{" "}
            {model.biggestSequenceGap.rankB}). Whichever side leads there, that person&apos;s{" "}
            {model.biggestSequenceGap.sequencingRole.toLowerCase()} function is arriving earlier and
            more instinctively in this pairing — the other will need to draw on it more deliberately.
          </p>
        </div>
      </section>

      <section className="fa-section">
        <h2>How to read this</h2>
        <p>{framing.structural.howToRead}</p>
        <p>{framing.structural.fieldNote}</p>
        <ContentBlockView label="Introduction" block={framing.introduction} />
        <ContentBlockView label="What the Field is" block={framing.fieldExplainer} />
      </section>

      <section className="fa-section">
        <h2>Score comparison</h2>
        <table className="fa-scores">
          <thead>
            <tr>
              <th>Element</th>
              <th className="fa-num">{a.name}</th>
              <th className="fa-num">{b.name}</th>
              <th>Gap</th>
              <th>{a.name}&apos;s rank</th>
              <th>{b.name}&apos;s rank</th>
              <th>Sequencing role</th>
            </tr>
          </thead>
          <tbody>
            {model.comparisons.map((comparison) => (
              <tr key={comparison.element}>
                <td>{comparison.element}</td>
                <td className="fa-num">{formatPercent(comparison.scoreA)}</td>
                <td className="fa-num">{formatPercent(comparison.scoreB)}</td>
                <td>
                  <DeltaCell comparison={comparison} nameA={a.name} nameB={b.name} />
                </td>
                <td>{comparison.labelA}</td>
                <td>{comparison.labelB}</td>
                <td>{comparison.sequencingRole}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="fa-section-purpose">
          Widest gaps:{" "}
          {model.widestGaps
            .map((gap) => `${gap.element} (${formatDelta(gap.delta)})`)
            .join(", ")}
          . A gap says the two of you bring different amounts of that element, not that either
          amount is wrong.
        </p>
      </section>

      {model.sections.map((section) => (
        <section key={section.key} className="fa-section">
          <h2>{section.heading}</h2>
          <p className="fa-section-purpose">{section.purpose}</p>
          <ContentBlockView block={section.content} />
        </section>
      ))}

      <section className="fa-section">
        <h2>The Fields layer</h2>
        <ContentBlockView label="Understand" block={model.fields.understand} />
        <ContentBlockView label="Tend" block={model.fields.tend} />
        <ContentBlockView label="Regulate" block={model.fields.regulate} />
        <ContentBlockView label="Blame Loop for this pairing" block={model.fields.blameLoop} />

        {model.bridgeElement ? (
          <ContentBlockView
            label={`Tending the Bridge (${model.bridgeElement})`}
            block={model.fields.bridgeTending!}
          />
        ) : (
          <div className="fa-field">
            <div className="fa-field-label">Bridge element</div>
            <p>
              {model.sameLead
                ? "Both of you lead with the same archetype, so there is no element sitting between you on the cycle."
                : "These two archetypes sit next to each other on the cycle, so there is no bridge element between them."}
            </p>
          </div>
        )}
      </section>

      <section className="fa-section">
        <h2>Each of you</h2>
        <div className="fa-card">
          <h3>{a.name}</h3>
          <ContentBlockView label={`${a.primary} distortion under stress`} block={a.distortion} />
          <ContentBlockView label="Water Doorway" block={a.waterDoorway} />
        </div>
        <div className="fa-card">
          <h3>{b.name}</h3>
          <ContentBlockView label={`${b.primary} distortion under stress`} block={b.distortion} />
          <ContentBlockView label="Water Doorway" block={b.waterDoorway} />
        </div>
      </section>

      <section className="fa-section">
        <ContentBlockView label="Where to go next" block={framing.closing} />
      </section>

      <footer className="fa-footer">
        <div>
          Workplace relationship report for {a.name} and {b.name}
          {model.organizationName ? ` · ${model.organizationName}` : ""} · generated{" "}
          {formatDate(model.generatedAt)}
        </div>
        <div>
          Built on Carey Davidson&apos;s Five Archetypes system and Fields theory. Narrative content
          pending Carey&apos;s approved content library.
        </div>
      </footer>
    </div>
  );
}
