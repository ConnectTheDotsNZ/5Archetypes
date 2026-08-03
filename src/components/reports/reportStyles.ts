/**
 * Stylesheet for the report templates.
 *
 * Plain CSS rather than Tailwind classes, deliberately: the PDF is rendered by
 * Chromium from `renderToStaticMarkup` output, which has no Tailwind build
 * step attached. Keeping the report's styles in one string that both the web
 * view and the PDF inline is what guarantees the download looks like what the
 * admin previewed. The surrounding app chrome still uses Tailwind.
 *
 * Colours mirror the brand tokens in tailwind.config.ts — provisional until
 * Carey signs the palette off (docs/BUILD_PLAN.md Section 8).
 */

export const REPORT_CSS = `
.fa-report {
  --brick: #8C2B1E;
  --gold: #B8925A;
  --cream: #FBF7F2;
  --blush: #F1E3DC;
  --ink: #1F1F1F;
  --muted: #5A5A5A;
  --wood: #5B7B4F;
  --fire: #C1502E;
  --earth: #C7A24C;
  --metal: #8C8C94;
  --water: #3E6E8E;

  color: var(--ink);
  font-family: system-ui, Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.55;
  max-width: 46rem;
}
.fa-report h1, .fa-report h2, .fa-report h3 {
  font-family: Georgia, "Playfair Display", serif;
  margin: 0;
}
.fa-report h1 { font-size: 1.9rem; }
.fa-report h2 { font-size: 1.25rem; margin-top: 0; }
.fa-report h3 { font-size: 1.05rem; }
.fa-report p { margin: 0.5rem 0; }

.fa-doc-kind {
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--gold);
}
.fa-header { border-bottom: 2px solid var(--blush); padding-bottom: 0.9rem; }
.fa-subject { color: var(--muted); margin-top: 0.15rem; }
.fa-provenance { font-size: 0.72rem; color: var(--muted); margin-top: 0.5rem; }

.fa-section { margin-top: 1.6rem; }
.fa-note {
  background: var(--cream);
  border: 1px solid var(--blush);
  border-radius: 6px;
  padding: 0.7rem 0.9rem;
  font-size: 0.85rem;
  color: var(--muted);
}

.fa-scores { width: 100%; border-collapse: collapse; margin-top: 0.6rem; }
.fa-scores th, .fa-scores td {
  text-align: left;
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid var(--blush);
  font-size: 0.85rem;
}
.fa-scores th { color: var(--muted); font-weight: 600; }
.fa-scores td.fa-num { text-align: right; font-variant-numeric: tabular-nums; }
/* inline-block with an explicit width: an inline span ignores width entirely,
   which silently collapses the bars to the width of their fill. */
.fa-bar-track {
  display: inline-block;
  vertical-align: middle;
  background: var(--blush);
  border-radius: 999px;
  height: 8px;
  width: 10rem;
  overflow: hidden;
}
.fa-bar-fill { height: 8px; border-radius: 999px; display: block; }

.fa-el-Wood { background: var(--wood); }
.fa-el-Fire { background: var(--fire); }
.fa-el-Earth { background: var(--earth); }
.fa-el-Metal { background: var(--metal); }
.fa-el-Water { background: var(--water); }

.fa-card {
  border: 1px solid var(--blush);
  border-left: 4px solid var(--gold);
  border-radius: 6px;
  padding: 0.9rem 1rem;
  margin-top: 0.8rem;
  background: #fff;
  break-inside: avoid;
  page-break-inside: avoid;
}
.fa-card-Wood { border-left-color: var(--wood); }
.fa-card-Fire { border-left-color: var(--fire); }
.fa-card-Earth { border-left-color: var(--earth); }
.fa-card-Metal { border-left-color: var(--metal); }
.fa-card-Water { border-left-color: var(--water); }

.fa-card-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
}
.fa-rank {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.66rem;
  font-weight: 700;
  color: var(--muted);
}
.fa-nickname { color: var(--brick); font-weight: 600; }
.fa-card-score { font-variant-numeric: tabular-nums; color: var(--muted); font-size: 0.85rem; }

.fa-field { margin-top: 0.6rem; }
.fa-field-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: var(--muted);
}

.fa-placeholder {
  border: 1px dashed var(--gold);
  border-radius: 5px;
  background: rgba(184, 146, 90, 0.08);
  padding: 0.5rem 0.7rem;
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: #6b5326;
}
.fa-placeholder-marker { font-weight: 700; display: block; }

.fa-inline-list { margin: 0.3rem 0 0; padding-left: 1.1rem; }
.fa-inline-list li { margin: 0.15rem 0; }

/* --- pairwise report --------------------------------------------------- */

.fa-pair-grid {
  display: flex;
  gap: 0.8rem;
  margin-top: 0.6rem;
}
.fa-pair-person {
  flex: 1 1 0;
  border: 1px solid var(--blush);
  border-radius: 6px;
  padding: 0.7rem 0.8rem;
  background: #fff;
}
.fa-pair-name { font-weight: 700; }
.fa-pair-role { color: var(--muted); font-size: 0.78rem; }
.fa-pair-lead { margin-top: 0.35rem; font-size: 0.85rem; }

.fa-flags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.7rem; }
.fa-flag {
  border: 1px solid var(--blush);
  border-radius: 999px;
  padding: 0.15rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--muted);
  background: var(--cream);
}
.fa-flag-ally { border-color: var(--wood); color: var(--wood); }
.fa-flag-friction { border-color: var(--fire); color: var(--fire); }
.fa-flag-same { border-color: var(--gold); color: #6b5326; }

.fa-delta-pos { color: var(--wood); font-weight: 600; }
.fa-delta-neg { color: var(--water); font-weight: 600; }
.fa-delta-zero { color: var(--muted); }

.fa-section-purpose { color: var(--muted); font-size: 0.8rem; margin-top: 0.1rem; }

.fa-footer {
  margin-top: 2rem;
  border-top: 1px solid var(--blush);
  padding-top: 0.7rem;
  font-size: 0.7rem;
  color: var(--muted);
}

@media print {
  .fa-report { max-width: none; font-size: 11.5px; }
  .fa-no-print { display: none !important; }
}
`;

/** Page geometry for the PDF. Kept next to the stylesheet it belongs to. */
export const REPORT_PRINT_CSS = `
@page { size: A4; margin: 16mm 15mm 18mm; }
html, body { margin: 0; padding: 0; background: #fff; }
body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
`;
