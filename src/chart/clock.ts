/**
 * chart/clock.ts
 * Author: github.com/hyperphantasia
 * ---------------------------------------------------------------------------
 * Draws the small numbered "clock" ticks around the center hub, one per
 * country, ordered the same way as the surrounding arcs.
 */

import { CHART_DIMENSIONS } from "../config.js";
import type { CountryRow } from "../types.js";
import type { ScaleBand, Selection } from "d3";

// Positioning constants
const TICK_RADIUS_INSET = 18;
const ANGLE_ADJUSTMENT = Math.PI / 2; // Quarter turn offset for coordinate system conversion
const TICK_INDEX_BASE = 1; // Offset to display ticks as 1-indexed instead of 0-indexed

/**
 * Renders numbered tick labels positioned radially at the midpoint of each country's angular range.
 * Clears the layer, calculates Cartesian coordinates from polar angles, and appends centered text elements.
 */
export function drawClockTicks(
  centerLayer: Selection<SVGGElement, unknown, HTMLElement, unknown>,
  data: CountryRow[],
  angleScale: ScaleBand<string>,
): void {
  centerLayer.selectAll("*").remove();

  const radius = CHART_DIMENSIONS.innerRadius - TICK_RADIUS_INSET;
  const bandwidthMidpoint = angleScale.bandwidth() / 2;

  data.forEach((row, index) => {
    const angle = (angleScale(row["Pays"]) ?? 0) + bandwidthMidpoint;
    centerLayer
      .append("text")
      .attr("class", "clock-tick")
      .attr("x", Math.cos(angle - ANGLE_ADJUSTMENT) * radius)
      .attr("y", Math.sin(angle - ANGLE_ADJUSTMENT) * radius)
      .text(index + TICK_INDEX_BASE);
  });
}
