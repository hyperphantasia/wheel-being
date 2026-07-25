/**
 * chart/grid.ts
 * Author: github.com/hyperphantasia
 * ---------------------------------------------------------------------------
 * Draws the faint concentric reference circles (and their value labels)
 * behind the radial chart.
 */

import type { ScaleLinear, Selection } from "d3";

// Grid configuration
const GRID_STEP_COUNT = 5;
const GRID_LABEL_DECIMAL_PLACES = 1;

/**
 * Renders concentric grid circles and their value labels evenly spaced across the radius scale domain.
 * Iterates through grid steps, maps each to a scaled radius, and appends a circle and centered text label.
 * @param maxValue - Domain maximum shared with the radius scale.
 */
export function drawGrid(
  gridLayer: Selection<SVGGElement, unknown, HTMLElement, unknown>,
  maxValue: number,
  radiusScale: ScaleLinear<number, number>,
): void {
  gridLayer.selectAll("*").remove();

  for (let step = 1; step <= GRID_STEP_COUNT; step += 1) {
    const value = (maxValue / GRID_STEP_COUNT) * step;
    const radius = radiusScale(value);

    gridLayer.append("circle").attr("class", "grid-ring").attr("r", radius);
    gridLayer
      .append("text")
      .attr("class", "grid-ring-label")
      .attr("y", -radius)
      .text(value.toFixed(GRID_LABEL_DECIMAL_PLACES));
  }
}
