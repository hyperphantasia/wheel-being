/**
 * chart/labels.ts
 * Author: github.com/hyperphantasia
 * ---------------------------------------------------------------------------
 * Draws (and keeps in sync via a proper enter/update/exit join) the rotated
 * country name labels around the outside of the wheel.
 */

import { CHART_DIMENSIONS } from "../config.js";
import { state } from "../state.js";
import type { CountryRow } from "../types.js";
import type { ScaleBand, Selection } from "d3";

// Label positioning and animation configuration
const LABEL_RADIUS_OFFSET = 72;
const LABEL_ANIMATION_DURATION_MS = 500;
const ANGLE_QUARTER_CIRCLE = Math.PI / 2;
const DEGREES_PER_SEMICIRCLE = 180;
const LABEL_ROTATION_OFFSET = 90;

/**
 * Updates country name labels around the chart perimeter via D3 enter/update/exit join, positioning and rotating each based on angle scale and applying opacity based on focus/selection state.
 * @param angleScale - Shared angle scale (see chart/index.ts).
 */
export function drawCountryNames(
  dataLayer: Selection<SVGGElement, unknown, HTMLElement, unknown>,
  data: CountryRow[],
  angleScale: ScaleBand<string>,
): void {
  const labelRadius = CHART_DIMENSIONS.outerRadius + LABEL_RADIUS_OFFSET;
  const labels = dataLayer
    .selectAll<SVGTextElement, CountryRow>(".country-name")
    .data(data, (row) => row["Pays"]);

  labels
    .enter()
    .append("text")
    .attr("class", "country-name")
    .style("opacity", 0)
    .merge(labels)
    .interrupt()
    .transition()
    .duration(LABEL_ANIMATION_DURATION_MS)
    .style("opacity", (row) => labelOpacity(row))
    .attr("transform", (row) => labelTransform(row, angleScale, labelRadius))
    .attr("text-anchor", (row) =>
      isLeftSide(midAngle(row, angleScale)) ? "end" : "start",
    )
    .text((row) => row["Pays"]);

  labels.exit().remove();
}

/**
 * Computes the midpoint angle of a country's angular band.
 */
function midAngle(row: CountryRow, angleScale: ScaleBand<string>): number {
  return (angleScale(row["Pays"]) ?? 0) + angleScale.bandwidth() / 2;
}

/**
 * Checks whether an angle falls in the left hemisphere (for text anchor and rotation adjustment).
 */
function isLeftSide(angle: number): boolean {
  return angle > ANGLE_QUARTER_CIRCLE && angle < 3 * ANGLE_QUARTER_CIRCLE;
}

/**
 * Returns label opacity based on focus set or selected country state, with full opacity as default.
 */
function labelOpacity(row: CountryRow): number {
  if (state.focusSet) return state.focusSet.has(row["Pays"]) ? 1 : 0.08;
  if (state.selectedCountry)
    return row["Pays"] === state.selectedCountry ? 1 : 0.18;
  return 1;
}

/**
 * Builds a translate-rotate transform string positioning the label at the computed radius and angle, with text flip on the left side for readability.
 */
function labelTransform(
  row: CountryRow,
  angleScale: ScaleBand<string>,
  labelRadius: number,
): string {
  const angle = midAngle(row, angleScale);
  const x = Math.cos(angle - ANGLE_QUARTER_CIRCLE) * labelRadius;
  const y = Math.sin(angle - ANGLE_QUARTER_CIRCLE) * labelRadius;
  const rotation =
    (angle * DEGREES_PER_SEMICIRCLE) / Math.PI -
    LABEL_ROTATION_OFFSET +
    (isLeftSide(angle) ? DEGREES_PER_SEMICIRCLE : 0);
  return `translate(${x},${y}) rotate(${rotation})`;
}
