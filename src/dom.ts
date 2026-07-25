/**
 * dom.ts
 * github.com/hyperphantasia
 * ---------------------------------------------------------------------------
 * Caches every d3 selection the app needs, once, at module load time.
 * Other modules import `dom` instead of repeatedly calling `d3.select(...)`
 * for the same element, which keeps lookups cheap and gives a single place
 * to see every DOM hook the app relies on.
 *
 * Each selection is parametrized with its real element type (rather than the
 * generic default) so that calling e.g. `.property("checked")` on a
 * non-`<input>` selection is caught at compile time.
 *
 * Note: d3 is loaded globally via <script src="https://d3js.org/d3.v7.min.js">
 * in index.html (not as an ES module), so it is available here as the
 * global `d3` without an explicit import (see src/types/global.d.ts).
 */

export const dom = {
  svg: d3.select<SVGSVGElement, unknown>("#chart"),
  tooltip: d3.select<HTMLDivElement, unknown>("#tooltip"),
  hud: d3.select<HTMLDivElement, unknown>("#hud"),
  legendToggle: d3.select<HTMLButtonElement, unknown>("#legendToggle"),
  wrap: d3.select<HTMLDivElement, unknown>(".wrap"),
  selectedCenter: d3.select<HTMLDivElement, unknown>("#selectedCenter"),
  heroBox: d3.select<HTMLDivElement, unknown>("#heroBox"),
  clusterToggleRow: d3.select<HTMLDivElement, unknown>("#clusterToggleRow"),
  clusterToggle: d3.select<HTMLInputElement, unknown>("#clusterToggle"),
  clusterLegend: d3.select<HTMLDivElement, unknown>("#clusterLegend"),
  perceptionToggleRow: d3.select<HTMLDivElement, unknown>(
    "#perceptionToggleRow",
  ),
  perceptionToggle: d3.select<HTMLInputElement, unknown>("#perceptionToggle"),
  perceptionLegend: d3.select<HTMLDivElement, unknown>("#perceptionLegend"),

  heroTitle: d3.select<HTMLHeadingElement, unknown>("#heroTitle"),
  heroCopy: d3.select<HTMLParagraphElement, unknown>("#heroCopy"),
  stageLabel: d3.select<HTMLSpanElement, unknown>("#stageLabel"),
  heroPills: d3.select<HTMLDivElement, unknown>("#heroPills"),
  bigWord: d3.select<HTMLDivElement, unknown>("#bigWord"),

  centerYear: d3.select<HTMLDivElement, unknown>("#centerYear"),
  centerName: d3.select<HTMLDivElement, unknown>("#centerName"),
  centerScore: d3.select<HTMLDivElement, unknown>("#centerScore"),

  yearControls: d3.select<HTMLDivElement, unknown>(".year-controls"),
  prevYearBtn: d3.select<HTMLButtonElement, unknown>("#prevYear"),
  nextYearBtn: d3.select<HTMLButtonElement, unknown>("#nextYear"),
  playPauseBtn: d3.select<HTMLButtonElement, unknown>("#playPause"),
  prevStageBtn: d3.select<HTMLButtonElement, unknown>("#prevStage"),
  nextStageBtn: d3.select<HTMLButtonElement, unknown>("#nextStage"),

  legend: d3.select<HTMLDivElement, unknown>("#legend"),

  a11yStatus: d3.select<HTMLDivElement, unknown>("#a11yStatus"),
  a11yCaption: d3.select<HTMLTableCaptionElement, unknown>("#a11yTableCaption"),
  a11yTableBody: d3.select<HTMLTableSectionElement, unknown>("#a11yTableBody"),
};
