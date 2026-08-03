/**
 * The Individual Archetype Profile template.
 *
 * Presentational only — everything it shows comes from the model built by
 * src/lib/reports/individualProfile.ts. The same component renders the web
 * view and the PDF (via renderToStaticMarkup), which is what stops the
 * download drifting from what the admin previewed.
 */

import { ELEMENTS } from "@/lib/archetypes";
import type { ContentBlock } from "@/lib/content/individualProfile";
import type {
  IndividualProfileReportModel,
  ProfileSection,
} from "@/lib/reports/individualProfile";
import { REPORT_CSS } from "./reportStyles";

/** The marker docs/CLAUDE_CODE_KICKOFF.md Step 5 asks for, rendered verbatim. */
const PLACEHOLDER_MARKER = "[PLACEHOLDER: pending Carey's content library]";

function formatPercent(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function ContentBlockView({ label, block }: { label: string; block: ContentBlock }) {
  return (
    <div className="fa-field">
      <div className="fa-field-label">{label}</div>
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

function ElementCard({ section }: { section: ProfileSection }) {
  return (
    <div className={`fa-card fa-card-${section.element}`}>
      <div className="fa-card-head">
        <div>
          <div className="fa-rank">
            {section.label} · rank {section.rank} of {ELEMENTS.length}
          </div>
          <h3>
            {section.element}: <span className="fa-nickname">{section.nickname}</span>
          </h3>
        </div>
        <div className="fa-card-score">
          {formatPercent(section.score)} · {section.score.toFixed(3)}
        </div>
      </div>

      <p>{section.essence}</p>

      <div className="fa-field">
        <div className="fa-field-label">Under stress</div>
        <p>{section.stressState}</p>
      </div>

      <div className="fa-field">
        <div className="fa-field-label">Sequencing role</div>
        <p>{section.sequencingRole}</p>
      </div>

      <ContentBlockView label="What this archetype needs" block={section.content.needs} />
      <ContentBlockView label="Stress patterns" block={section.content.stressPatterns} />
      <ContentBlockView label="Self-care" block={section.content.selfCare} />
    </div>
  );
}

export function IndividualProfileReport({
  model,
  /** Rendered inside a full HTML document already carrying the stylesheet. */
  omitStyles = false,
}: {
  model: IndividualProfileReportModel;
  omitStyles?: boolean;
}) {
  const { subject, provenance, sections, primary, lowest, framing } = model;

  const subjectLine = [subject.roleTitle, subject.teamName, subject.organizationName]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="fa-report">
      {/* dangerouslySetInnerHTML so CSS combinators survive JSX escaping. */}
      {!omitStyles && <style dangerouslySetInnerHTML={{ __html: REPORT_CSS }} />}

      <header className="fa-header">
        <div className="fa-doc-kind">Individual Archetype Profile</div>
        <h1>{subject.name}</h1>
        {subjectLine && <div className="fa-subject">{subjectLine}</div>}
        <div className="fa-provenance">
          Generated {formatDate(model.generatedAt)}
          {provenance.takenAt && ` · scores recorded ${formatDate(provenance.takenAt)}`}
          {provenance.source && ` · source: ${provenance.source.toLowerCase().replace("_", " ")}`}
        </div>
      </header>

      {model.awaitingContentLibrary && (
        <div className="fa-section fa-note">
          <strong>Draft template.</strong> The structure below is final; the narrative copy is not.
          Every dashed block is content Carey still needs to author and approve, and no
          interpretation of your archetypes has been written by the platform.
        </div>
      )}

      <section className="fa-section">
        <h2>How to read this</h2>
        <p>{framing.structural.howToRead}</p>
        <p>{framing.structural.scoreNote}</p>
        <ContentBlockView label="Introduction" block={framing.introduction} />
      </section>

      <section className="fa-section">
        <h2>Your five scores</h2>
        <table className="fa-scores">
          <thead>
            <tr>
              <th>Element</th>
              <th></th>
              <th className="fa-num">Score</th>
              <th className="fa-num">Decimal</th>
              <th>Rank</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <tr key={section.element}>
                <td>{section.element}</td>
                <td>
                  <span className="fa-bar-track">
                    <span
                      className={`fa-bar-fill fa-el-${section.element}`}
                      style={{ width: `${Math.round(section.score * 100)}%` }}
                    />
                  </span>
                </td>
                <td className="fa-num">{formatPercent(section.score)}</td>
                <td className="fa-num">{section.score.toFixed(3)}</td>
                <td>{section.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="fa-section">
        <h2>
          Leading with {primary.element}: {primary.nickname}
        </h2>
        <ContentBlockView label="Your primary archetype" block={framing.primaryArchetype} />
        <div className="fa-field">
          <div className="fa-field-label">Natural allies</div>
          <p>
            {model.shengNeighboursOfPrimary.join(" and ")} sit either side of {primary.element}, so
            they tend to be low-strain to work with.
          </p>
        </div>
        <div className="fa-field">
          <div className="fa-field-label">Natural challengers</div>
          <p>
            {model.keChallengersOfPrimary.join(" and ")} are {primary.element}&apos;s
            button-pushers. Productive friction to notice, not a problem to fix.
          </p>
        </div>
      </section>

      <section className="fa-section">
        <h2>
          Your lowest element: {lowest.element} ({formatPercent(lowest.score)})
        </h2>
        <ContentBlockView label="Working with your lowest element" block={framing.lowestArchetype} />
      </section>

      <section className="fa-section">
        <h2>Profile in rank order</h2>
        {sections.map((section) => (
          <ElementCard key={section.element} section={section} />
        ))}
      </section>

      <section className="fa-section">
        <h2>Sequencing roles</h2>
        <ContentBlockView label="How sequencing works" block={framing.sequencing} />
        <table className="fa-scores">
          <thead>
            <tr>
              <th>Element</th>
              <th>Role</th>
              <th>Your rank</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <tr key={section.element}>
                <td>{section.element}</td>
                <td>{section.sequencingRole}</td>
                <td>{section.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="fa-provenance">
          Sequencing roles are coded per element. Whether they attach to the element or to its rank
          position is an open question with Carey (docs/BUILD_PLAN.md Section 11, item 2).
        </p>
      </section>

      <section className="fa-section">
        <ContentBlockView label="Where to go next" block={framing.closing} />
      </section>

      <footer className="fa-footer">
        <div>
          Five Archetypes profile for {subject.name}
          {subject.organizationName ? ` · ${subject.organizationName}` : ""} · generated{" "}
          {formatDate(model.generatedAt)}
        </div>
        <div>
          Built on Carey Davidson&apos;s Five Archetypes system. Narrative content pending Carey&apos;s
          approved content library.
          {provenance.rawImportRef && ` · import ref: ${provenance.rawImportRef}`}
        </div>
      </footer>
    </div>
  );
}
