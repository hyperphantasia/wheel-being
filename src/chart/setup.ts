/**
 * chart/setup.ts
 * Author: github.com/hyperphantasia
 * ---------------------------------------------------------------------------
 * Builds the persistent SVG structure - the centered root group, the three
 * stacked layers (grid / data / center), and the two glow filters used by
 * the perception overlay. Runs exactly once, at startup.
 */

import { CHART_DIMENSIONS } from "../config.js";
import type { ChartLayers } from "../types.js";
import type { Selection } from "d3";

// Glow filter configuration
const PERCEPTION_GLOW_BLUR_RADIUS = 4;
const PERCEPTION_GLOW_RED_CHANNEL = 0.15;
const PERCEPTION_GLOW_GREEN_CHANNEL = 0.2;
const PERCEPTION_GLOW_BLUE_CHANNEL = 0.5;

const PERCEPTION_GLOW_SOFT_BLUR_RADIUS = 3;
const PERCEPTION_GLOW_SOFT_MATRIX_VALUE = 0.03;

const PERCEPTION_GLOW_FILTER = `
  <feGaussianBlur stdDeviation="${PERCEPTION_GLOW_BLUR_RADIUS}" result="blur"></feGaussianBlur>
  <feColorMatrix in="blur" type="matrix"
    values="1 0 0 0 ${PERCEPTION_GLOW_RED_CHANNEL}
            0 1 0 0 ${PERCEPTION_GLOW_GREEN_CHANNEL}
            0 0 1 0 ${PERCEPTION_GLOW_BLUE_CHANNEL}
            0 0 0 1 0" result="blueGlow"></feColorMatrix>
  <feMerge>
    <feMergeNode in="blueGlow"></feMergeNode>
    <feMergeNode in="SourceGraphic"></feMergeNode>
  </feMerge>
`;

const PERCEPTION_GLOW_SOFT_FILTER = `
  <feGaussianBlur stdDeviation="${PERCEPTION_GLOW_SOFT_BLUR_RADIUS}" result="blur"></feGaussianBlur>
  <feColorMatrix in="blur" type="matrix"
    values="
      ${PERCEPTION_GLOW_SOFT_MATRIX_VALUE} ${PERCEPTION_GLOW_SOFT_MATRIX_VALUE} ${PERCEPTION_GLOW_SOFT_MATRIX_VALUE} 0 0
      ${PERCEPTION_GLOW_SOFT_MATRIX_VALUE} ${PERCEPTION_GLOW_SOFT_MATRIX_VALUE} ${PERCEPTION_GLOW_SOFT_MATRIX_VALUE} 0 0
      ${PERCEPTION_GLOW_SOFT_MATRIX_VALUE} ${PERCEPTION_GLOW_SOFT_MATRIX_VALUE} ${PERCEPTION_GLOW_SOFT_MATRIX_VALUE} 0 0
      0    0    0    1 0"
    result="darkGlow"></feColorMatrix>
  <feMerge>
    <feMergeNode in="darkGlow"></feMergeNode>
    <feMergeNode in="SourceGraphic"></feMergeNode>
  </feMerge>
`;

/**
 * Creates the chart's persistent SVG structure by appending a centered root group, three stacked layers, and two glow filter definitions to the SVG element.
 * @param svgSelection - The `#chart` <svg> selection.
 */
export function createChartLayers(
  svgSelection: Selection<SVGSVGElement, unknown, HTMLElement, unknown>,
): ChartLayers {
  const gRoot = svgSelection
    .append("g")
    .attr(
      "transform",
      `translate(${CHART_DIMENSIONS.cx},${CHART_DIMENSIONS.cy})`,
    );

  const defs = svgSelection.append("defs");
  defs
    .append("filter")
    .attr("id", "perceptionGlow")
    .html(PERCEPTION_GLOW_FILTER);
  defs
    .append("filter")
    .attr("id", "perceptionGlowSoft")
    .html(PERCEPTION_GLOW_SOFT_FILTER);

  return {
    gRoot,
    gridLayer: gRoot.append("g").attr("class", "grid-layer"),
    dataLayer: gRoot.append("g").attr("class", "data-layer"),
    centerLayer: gRoot.append("g").attr("class", "center-layer"),
  };
}
