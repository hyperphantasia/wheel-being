/**
 * chart/arcs.ts
 * Author: github.com/hyperphantasia
 * ---------------------------------------------------------------------------
 * The core of the visualization: for each country, draws a stack of
 * indicator segments from `innerRadius` out to a radius proportional to its
 * Happiness_Index, plus (conditionally) a cluster outline and a
 * perceived-happiness overlay arc.
 *
 * Performance notes:
 *  - Hover/click/keyboard listeners are bound once, on the `enter` selection
 *    only, not re-bound on every render. `currentAngleScale` is kept as module state so
 *    listeners always read the current geometry without needing to be re-bound when it changes.
 *  - Segment opacity logic (focus/selection dimming) is a single shared helper.
 */

import {
  CATEGORY_COLORS,
  CHART_DIMENSIONS,
  SECONDARY_COLUMNS,
  STAGE,
  STAGES,
  getCountryCluster,
} from "../config.js";
import { state } from "../state.js";
import { canInteractWithCountry } from "../utils.js";
import { hideTooltip, positionTooltip, showTooltip } from "../tooltip.js";
import type { ChartScales, CountryRow, PositionedSegment } from "../types.js";
import type {
  Arc,
  DefaultArcObject,
  ScaleBand,
  ScaleLinear,
  Selection,
} from "d3";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** A country's <g> element, with the two custom properties used to tween from its previous state. */
interface CountryGroupElement extends SVGGElement {
  _angle?: number;
  _focusScale?: number;
}

/** A segment's <path> element, with the custom property used to tween its previous radii. */
interface SegmentPathElement extends SVGPathElement {
  _prevArc?: { r0: number; r1: number };
}

/**
 * Selection type used once a country's <g> has been individually re-selected
 * via `d3.select(this)` inside an `.each()`/event callback. The parent
 * element/datum generics are irrelevant past that point (none of these
 * helpers touch the parent) so they're left as `any` rather than chasing
 * an exact type through every call site.
 */
type CountryGroupSelection = Selection<
  CountryGroupElement,
  CountryRow,
  any,
  any
>;

// ============================================================================
// CONSTANTS
// ============================================================================

// Interactive scaling factors
const HOVER_SCALE = 1.06;
const HOVER_SCALE_DIRECT = 1.12;
const SELECTED_SCALE = 1.1;

// Animation durations and delays (milliseconds)
const HOVER_TRANSFORM_DURATION_MS = 160;
const COUNTRY_POSITION_ANIMATION_MS = 900;
const COUNTRY_POSITION_DELAY_STEP_MS = 5;
const SEGMENT_ANIMATION_MS = 1000;
const SEGMENT_DELAY_STEP_MS = 8;
const SEGMENT_EXIT_DURATION_MS = 300;
const SEGMENT_HOVER_DURATION_MS = 140;

// Geometry offsets for cluster outline
const CLUSTER_OUTLINE_INNER_OFFSET = 2.5;
const CLUSTER_OUTLINE_OUTER_OFFSET = 8.5;

// ============================================================================
// MODULE STATE
// ============================================================================

// Kept as module-level state so that event listeners bound once on `enter`
// can always read the current geometry, even though they're never re-bound on subsequent renders.
// Definite-assignment (`!`) is used because these are always populated by
// `renderCountryArcs` before any other function in this module can run.
let currentAngleScale!: ScaleBand<string>;
let currentRadiusScale!: ScaleLinear<number, number>;
let currentArcGenerator!: Arc<unknown, DefaultArcObject>;

// ============================================================================
// PUBLIC ENTRY POINT
// ============================================================================

/**
 * Renders all country arcs, binding interactions and animating segments based on the happiness index.
 * Caches scale objects for reuse by event listeners, performs data join, and calls segment/overlay rendering for each country.
 * @param onSelectionChange - Called after a country is clicked/activated, so the caller can re-render.
 */
export function renderCountryArcs(
  dataLayer: Selection<SVGGElement, unknown, HTMLElement, unknown>,
  data: CountryRow[],
  scales: ChartScales,
  onSelectionChange: () => void,
): void {
  currentAngleScale = scales.angleScale;
  currentRadiusScale = scales.radiusScale;
  currentArcGenerator = scales.arcGenerator;

  const isDashboard = state.stageIndex === STAGE.DASHBOARD;
  const focusName = isDashboard ? state.selectedCountry : null;

  const countrySelection = dataLayer
    .selectAll<CountryGroupElement, CountryRow>(".country")
    .data(data, (row) => row["Pays"]);

  const countryEnter = countrySelection
    .enter()
    .append<CountryGroupElement>("g")
    .attr("class", "country")
    .attr("role", "button")
    .attr("tabindex", "0")
    .each(function assignInitialAngle(row) {
      this._angle = currentAngleScale(row["Pays"]);
      this._focusScale = 1;
    });

  countrySelection
    .exit()
    .interrupt()
    .transition()
    .duration(400)
    .style("opacity", 0)
    .remove();

  bindCountryInteractions(countryEnter, onSelectionChange);

  const countryGroups = countryEnter.merge(countrySelection);
  countryGroups.interrupt();
  countryGroups.attr(
    "aria-label",
    (row) =>
      `${row["Pays"]}, indice de bien-être ${row.Happiness_Index.toFixed(3)}`,
  );

  animateCountryPositions(countryGroups, focusName);
  countryGroups.each(function drawOneCountry(row) {
    drawCountrySegmentsAndOverlays(
      d3.select<CountryGroupElement, CountryRow>(this),
      row,
      focusName,
    );
  });
}

// ============================================================================
// INTERACTION LAYER
// ============================================================================

/**
 * Attaches hover and keyboard event handlers to newly created country groups to enable interactive scaling and selection.
 * Listeners are bound only once on enter (not re-bound on updates) since scales are cached in module state.
 */
function bindCountryInteractions(
  countryEnter: Selection<
    CountryGroupElement,
    CountryRow,
    SVGGElement,
    unknown
  >,
  onSelectionChange: () => void,
): void {
  countryEnter
    .on(
      "mouseenter",
      function handleMouseEnter(event: MouseEvent, row: CountryRow) {
        if (
          state.stageIndex !== STAGE.DASHBOARD ||
          state.selectedCountry === row["Pays"]
        )
          return;
        state.hoverCountryName = row["Pays"];
        applyGroupTransform(
          d3.select<CountryGroupElement, CountryRow>(this).raise(),
          row,
          HOVER_SCALE_DIRECT,
          HOVER_TRANSFORM_DURATION_MS,
        );
      },
    )
    .on(
      "mouseleave",
      function handleMouseLeave(event: MouseEvent, row: CountryRow) {
        if (state.stageIndex !== STAGE.DASHBOARD) return;
        if (state.hoverCountryName === row["Pays"])
          state.hoverCountryName = null;
        applyGroupTransform(
          d3.select<CountryGroupElement, CountryRow>(this),
          row,
          1,
          HOVER_TRANSFORM_DURATION_MS,
        );
      },
    )
    .on("click", (event: MouseEvent, row: CountryRow) =>
      selectCountry(row, onSelectionChange),
    )
    .on("keydown", (event: KeyboardEvent, row: CountryRow) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      selectCountry(row, onSelectionChange);
    });
}

/**
 * Toggles the selected country in state when activated, triggering a re-render callback.
 * Operates only in dashboard mode and deselects if the same country is clicked twice.
 */
function selectCountry(row: CountryRow, onSelectionChange: () => void): void {
  if (state.stageIndex !== STAGE.DASHBOARD) return;
  state.selectedCountry =
    state.selectedCountry === row["Pays"] ? null : row["Pays"];
  onSelectionChange();
}

/**
 * Applies a rotated and scaled transform to a country group with smooth easing animation.
 * Converts the angle scale value to degrees and combines it with the scale factor in the transform.
 */
function applyGroupTransform(
  selection: CountryGroupSelection,
  row: CountryRow,
  scale: number,
  durationMs: number,
): void {
  const angleDegrees = ((currentAngleScale(row["Pays"]) ?? 0) * 180) / Math.PI;
  selection
    .interrupt()
    .transition()
    .duration(durationMs)
    .ease(d3.easeCubicOut)
    .attr("transform", `rotate(${angleDegrees}) scale(${scale})`);
}

// ============================================================================
// ANIMATION LAYER
// ============================================================================

/**
 * Animates all country groups' rotation and scale based on focus and hover state using interpolated tweens.
 * Staggers the animation start with a per-index delay and adjusts opacity for focus dimming.
 */
function animateCountryPositions(
  countryGroups: Selection<
    CountryGroupElement,
    CountryRow,
    SVGGElement,
    unknown
  >,
  focusName: string | null,
): void {
  countryGroups
    .transition()
    .duration(COUNTRY_POSITION_ANIMATION_MS)
    .delay((row, index) => index * COUNTRY_POSITION_DELAY_STEP_MS)
    .ease(d3.easeCubicInOut)
    .attrTween("transform", function tweenPosition(row) {
      const previousAngle = this._angle ?? currentAngleScale(row["Pays"]) ?? 0;
      const nextAngle = currentAngleScale(row["Pays"]) ?? 0;
      const interpolateAngle = d3.interpolate(previousAngle, nextAngle);
      this._angle = nextAngle;

      const startScale = this._focusScale || 1;
      const targetScale = getTargetScale(row, focusName);
      const interpolateScale = d3.interpolateNumber(startScale, targetScale);
      this._focusScale = targetScale;

      return (t: number) =>
        `rotate(${(interpolateAngle(t) * 180) / Math.PI}) scale(${interpolateScale(t)})`;
    })
    .attr("opacity", (row) => dimmingOpacity(row, focusName));
}

/**
 * Determines the target scale for a country based on hover or selected focus state.
 * Returns the direct hover scale if hovered, selected scale if selected, otherwise 1.
 */
function getTargetScale(row: CountryRow, focusName: string | null): number {
  if (state.hoverCountryName === row["Pays"]) return HOVER_SCALE;
  if (focusName && row["Pays"] === focusName) return SELECTED_SCALE;
  return 1;
}

/**
 * Computes opacity for dimming based on focus set or selected country state.
 * Returns full opacity for focused items, reduced opacity for unfocused items, or full opacity if no focus is active.
 */
function dimmingOpacity(row: CountryRow, focusName: string | null): number {
  if (state.focusSet) return state.focusSet.has(row["Pays"]) ? 1 : 0.08;
  if (focusName) return row["Pays"] === focusName ? 1 : 0.18;
  return 1;
}

// ============================================================================
// DRAWING LAYER
// ============================================================================

/**
 * Renders a country's stacked indicator segments, cluster outline, and perception overlay.
 * Splits happiness into segments, then delegates drawing of each visual component.
 */
function drawCountrySegmentsAndOverlays(
  group: CountryGroupSelection,
  row: CountryRow,
  focusName: string | null,
): void {
  const outerRadius = currentRadiusScale(row.Happiness_Index);
  const segments = buildSegments(row, outerRadius);

  drawSegments(group, segments, row, focusName);
  drawClusterOutline(group, row, outerRadius);
  drawPerceptionOverlay(group, row, outerRadius);
}

/**
 * Divides a country's total happiness radius into ordered stacked segments proportional to indicator values.
 * Sorts indicators by value and stacks them radially from inner to outer radius.
 */
function buildSegments(
  row: CountryRow,
  outerRadius: number,
): PositionedSegment[] {
  const ordered = SECONDARY_COLUMNS.map((key) => ({
    key,
    value: +(row[key] ?? 0) || 0,
  })).sort((a, b) => a.value - b.value);
  const total = d3.sum(ordered, (segment) => segment.value) || 1;

  let radius: number = CHART_DIMENSIONS.innerRadius;
  return ordered.map((segment) => {
    const segmentSpan =
      (outerRadius - CHART_DIMENSIONS.innerRadius) * (segment.value / total);
    const r0 = radius;
    const r1 = radius + segmentSpan;
    radius = r1;
    return { ...segment, r0, r1 };
  });
}

/**
 * Creates or updates stacked arc segments for a country with hover effects and tooltips.
 * Animates segment radii with tweens and applies opacity based on focus state, with tooltip on hover.
 */
function drawSegments(
  group: CountryGroupSelection,
  segments: PositionedSegment[],
  row: CountryRow,
  focusName: string | null,
): void {
  const segmentSelection = group
    .selectAll<SegmentPathElement, PositionedSegment>("path.seg")
    .data(segments, (segment) => segment.key);

  const segmentEnter = segmentSelection
    .enter()
    .append<SegmentPathElement>("path")
    .attr("class", "seg")
    .attr(
      "fill",
      (segment) => CATEGORY_COLORS.get(segment.key) ?? "transparent",
    )
    .attr("opacity", 0)
    .attr("d", () =>
      currentArcGenerator
        .innerRadius(CHART_DIMENSIONS.innerRadius)
        .outerRadius(CHART_DIMENSIONS.innerRadius)(
        undefined as unknown as DefaultArcObject,
      ),
    )
    .on(
      "mouseenter",
      function handleSegmentMouseEnter(
        event: MouseEvent,
        segment: PositionedSegment,
      ) {
        if (!canInteractWithCountry(row["Pays"])) return;
        d3.select(this)
          .interrupt()
          .raise()
          .transition()
          .duration(SEGMENT_HOVER_DURATION_MS)
          .style("filter", "var(--seg-hover-filter)");
        showTooltip(
          event,
          row,
          segment,
          state.currentYearForTooltip,
          isPerceptionActive(),
        );
      },
    )
    .on("mousemove", (event: MouseEvent) => {
      if (!canInteractWithCountry(row["Pays"])) return;
      positionTooltip(event);
    })
    .on("mouseleave", function handleSegmentMouseLeave() {
      if (!canInteractWithCountry(row["Pays"])) return;
      d3.select(this)
        .interrupt()
        .transition()
        .duration(SEGMENT_HOVER_DURATION_MS)
        .style("filter", "none");
      hideTooltip();
    });

  segmentSelection
    .exit()
    .interrupt()
    .transition()
    .duration(SEGMENT_EXIT_DURATION_MS)
    .style("opacity", 0)
    .remove();

  segmentEnter
    .merge(segmentSelection)
    .interrupt()
    .transition()
    .duration(SEGMENT_ANIMATION_MS)
    .delay((segment, index) => index * SEGMENT_DELAY_STEP_MS)
    .ease(d3.easeCubicInOut)
    .attr(
      "fill",
      (segment) => CATEGORY_COLORS.get(segment.key) ?? "transparent",
    )
    .attr("opacity", dimmingOpacity(row, focusName))
    .style("filter", "none")
    .attrTween("d", function tweenArc(segment) {
      const previous = this._prevArc ?? {
        r0: CHART_DIMENSIONS.innerRadius,
        r1: CHART_DIMENSIONS.innerRadius,
      };
      const interpolateR0 = d3.interpolateNumber(previous.r0, segment.r0);
      const interpolateR1 = d3.interpolateNumber(previous.r1, segment.r1);
      this._prevArc = { r0: segment.r0, r1: segment.r1 };
      return (t: number) =>
        currentArcGenerator
          .innerRadius(interpolateR0(t))
          .outerRadius(interpolateR1(t))(
          undefined as unknown as DefaultArcObject,
        ) ?? "";
    });
}

/**
 * Draws a decorative ring outline around a country's arc if cluster mode is enabled.
 * Creates an arc path with fixed offsets from the country's outer radius and applies cluster styling.
 */
function drawClusterOutline(
  group: CountryGroupSelection,
  row: CountryRow,
  outerRadius: number,
): void {
  group.selectAll("path.cluster-outline").remove();
  if (state.stageIndex !== STAGE.DASHBOARD || !state.clusterMode) return;

  const cluster = getCountryCluster(row["Pays"]);
  if (!cluster) return;

  const clusterArc = d3
    .arc()
    .startAngle(CHART_DIMENSIONS.basePad)
    .endAngle(currentAngleScale.bandwidth() - CHART_DIMENSIONS.basePad)
    .innerRadius(outerRadius + CLUSTER_OUTLINE_INNER_OFFSET)
    .outerRadius(outerRadius + CLUSTER_OUTLINE_OUTER_OFFSET);

  group
    .append("path")
    .attr("class", `cluster-outline visible c${cluster.id}`)
    .attr("d", clusterArc(undefined as unknown as DefaultArcObject));
}

/**
 * Renders a band showing the difference between subjective and objective happiness as an outward/inward arc.
 * Calculates the radius difference and applies CSS class styling (`.good` for better, `.bad` for worse) to control appearance.
 */
function drawPerceptionOverlay(
  group: CountryGroupSelection,
  row: CountryRow,
  outerRadius: number,
): void {
  group.selectAll("path.perception-ext").remove();
  if (!isPerceptionActive()) return;

  const subjective = row.Subjective_Index;
  if (subjective == null || Number.isNaN(subjective)) return;

  const subjectiveRadius = currentRadiusScale(subjective);
  const better = subjectiveRadius >= outerRadius;
  const r0 = Math.min(outerRadius, subjectiveRadius);
  const r1 = Math.max(outerRadius, subjectiveRadius);
  if (r1 <= r0) return;

  const extentArc = d3
    .arc()
    .startAngle(CHART_DIMENSIONS.basePad)
    .endAngle(currentAngleScale.bandwidth() - CHART_DIMENSIONS.basePad)
    .innerRadius(r0)
    .outerRadius(r1);

  group
    .append("path")
    .attr("class", `perception-ext ${better ? "good" : "bad"}`)
    .attr("d", extentArc(undefined as unknown as DefaultArcObject));
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Determines if the perceived happiness overlay should be visible based on current stage and mode settings.
 * Returns true if perception mode is active on the dashboard or in the Baltic story stage.
 */
function isPerceptionActive(): boolean {
  const activeOnDashboard =
    state.stageIndex === STAGE.DASHBOARD && state.perceptionMode;
  const activeInBalticStory =
    state.stageIndex === STAGE.BALTIC_PARADOX &&
    Boolean(STAGES[STAGE.BALTIC_PARADOX].perceptionActive);
  return activeOnDashboard || activeInBalticStory;
}
