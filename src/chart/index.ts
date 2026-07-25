/**
 * chart/index.ts
 * Author: github.com/hyperphantasia
 * ---------------------------------------------------------------------------
 * Orchestrates a single "render this year" pass. This is the one place that
 * computes the angle/radius scales and the arc generator.
 */

import { CHART_DIMENSIONS } from "../config.js";
import { state } from "../state.js";
import { drawGrid } from "./grid.js";
import { drawClockTicks } from "./clock.js";
import { updateCenterInfo } from "./centerInfo.js";
import { drawCountryNames } from "./labels.js";
import { renderCountryArcs } from "./arcs.js";
import { updateAccessibleSummary } from "./accessibility.js";
import type { ChartLayers, CountryRow } from "../types.js";

// Scale and layout configuration
const ANGLE_FULL_CIRCLE = 2 * Math.PI;
const ANGLE_SCALE_PADDING = 0.05;

let layers: ChartLayers | null = null;

/**
 * Stores the persistent SVG layers built at startup for use by all subsequent render calls.
 */
export function initChartLayers(builtLayers: ChartLayers): void {
  layers = builtLayers;
}

/**
 * Renders one year of data by computing angle/radius scales and the arc generator, then updating all chart sub-components and binding interaction callbacks.
 * @param data - Rows for this year (already sorted by rank).
 */
export function renderYear(data: CountryRow[], year: number): void {
  if (!layers) throw new Error("renderYear() called before initChartLayers()");

  state.currentYearData = data;
  state.currentYearForTooltip = year;

  const maxHappiness = d3.max(data, (row) => row.Happiness_Index) || 1;
  const maxSubjective =
    d3.max(data, (row) =>
      row.Subjective_Index != null && !Number.isNaN(row.Subjective_Index)
        ? row.Subjective_Index
        : 0,
    ) || 1;
  const maxRadiusValue = Math.max(maxHappiness, maxSubjective);

  const angleScale = d3
    .scaleBand<string>()
    .domain(data.map((row) => row["Pays"]))
    .range([0, ANGLE_FULL_CIRCLE])
    .padding(ANGLE_SCALE_PADDING);

  const radiusScale = d3
    .scaleLinear()
    .domain([0, maxRadiusValue])
    .range([CHART_DIMENSIONS.innerRadius, CHART_DIMENSIONS.outerRadius]);

  const arcGenerator = d3
    .arc()
    .startAngle(CHART_DIMENSIONS.basePad)
    .endAngle(angleScale.bandwidth() - CHART_DIMENSIONS.basePad);

  drawGrid(layers.gridLayer, maxRadiusValue, radiusScale);
  drawClockTicks(layers.centerLayer, data, angleScale);
  updateCenterInfo(year, data);
  drawCountryNames(layers.dataLayer, data, angleScale);
  renderCountryArcs(
    layers.dataLayer,
    data,
    { angleScale, radiusScale, arcGenerator },
    rerenderCurrentYear,
  );
  updateAccessibleSummary(data, year);
}

/**
 * Re-renders whatever year is currently on screen, using the freshest data
 * from `state` rather than data/year captured in a closure.
 *
 * This is passed into `renderCountryArcs` as the "a country was
 * clicked/activated" callback. Country click/keydown listeners are bound
 * only once, on each country's first render (see arcs.ts), so a callback
 * that closed over this call's `data`/`year` would stay frozen to whatever
 * year was on screen the first time that country was drawn - typically the
 * Intro stage's first year - instead of the year the user is actually
 * looking at when they click. Reading `state.currentYearData` /
 * `state.currentYearForTooltip` at call time avoids that.
 */
function rerenderCurrentYear(): void {
  if (state.currentYearForTooltip == null) return;
  renderYear(state.currentYearData, state.currentYearForTooltip);
}
