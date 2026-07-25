/**
 * legend.ts
 * Author: github.com/hyperphantasia
 * ---------------------------------------------------------------------------
 * Renders the three legend panels: the main indicator legend (HUD, bottom
 * right), the cluster legend, and the perception-mode legend.
 *
 * All visual styling (colors aside) lives in styles.css, rather than
 * being set inline via dozens of `.style(...)` calls -
 * JS here only sets the data-driven bits (text, swatch colors).
 */

import { dom } from "./dom.js";
import {
  CATEGORY_COLORS,
  CLUSTER_DEFINITIONS,
  ISO_TO_FRENCH_NAME,
  LEGEND_GROUPS,
  STAGE,
} from "./config.js";
import { state } from "./state.js";

// CSS class names for legend structure
const LEGEND_META_CLASS = "legend-meta";
const LEGEND_META_TITLE_CLASS = "legend-meta-title";
const LEGEND_META_ROW_CLASS = "legend-meta-row";
const LEGEND_META_ITEM_CLASS = "legend-meta-item";
const LEGEND_DOT_CLASS = "legend-dot";
const LEGEND_ITEM_CLASS = "legend-item";
const LEGEND_SWATCH_CLASS = "legend-swatch";

/**
 * Clears and redraws the main indicator legend (grouped by conceptual theme).
 * Hides the entire HUD during the intro stage, otherwise shows and populates it with legend groups and their items.
 */
export function drawLegend(): void {
  dom.legend.selectAll("*").remove();

  if (state.stageIndex === STAGE.INTRO) {
    dom.hud.style("display", "none");
    return;
  }
  dom.hud.style("display", "block");

  const groups = dom.legend
    .selectAll(`.${LEGEND_META_CLASS}`)
    .data(LEGEND_GROUPS)
    .enter()
    .append("div")
    .attr("class", LEGEND_META_CLASS);

  groups
    .append("div")
    .attr("class", LEGEND_META_TITLE_CLASS)
    .text((group) => group.title);

  groups.each(function renderGroupItems(group) {
    const row = d3
      .select(this)
      .append("div")
      .attr("class", LEGEND_META_ROW_CLASS);
    group.items.forEach((indicatorKey) => {
      const item = row.append("div").attr("class", LEGEND_META_ITEM_CLASS);
      item
        .append("span")
        .attr("class", LEGEND_DOT_CLASS)
        .style("background", CATEGORY_COLORS.get(indicatorKey) ?? "");
      item.append("span").text(indicatorKey);
    });
  });
}

/**
 * Clears and redraws the cluster legend showing cluster names and member countries.
 * Only displays when cluster mode is active and in dashboard stage.
 */
export function renderClusterLegend(): void {
  dom.clusterLegend.selectAll("*").remove();
  if (!state.clusterMode || state.stageIndex !== STAGE.DASHBOARD) return;

  CLUSTER_DEFINITIONS.forEach((cluster) => {
    const row = dom.clusterLegend
      .append("div")
      .attr("class", LEGEND_ITEM_CLASS);
    row
      .append("span")
      .attr("class", LEGEND_SWATCH_CLASS)
      .style("background", cluster.color);
    const countryNames = cluster.codes
      .map(
        (code) => ISO_TO_FRENCH_NAME[code as keyof typeof ISO_TO_FRENCH_NAME],
      )
      .join(", ");
    row
      .append("span")
      .text(`Cluster ${cluster.id}: ${cluster.name} - ${countryNames}`);
  });
}

/**
 * Clears and redraws the perception-mode legend showing color meanings for subjective happiness deviation.
 * Only displays when perception mode is active.
 */
export function renderPerceptionLegend(): void {
  dom.perceptionLegend.selectAll("*").remove();
  if (!state.perceptionMode) return;

  dom.perceptionLegend
    .append("div")
    .attr("class", LEGEND_ITEM_CLASS)
    .html(
      `<span class="${LEGEND_SWATCH_CLASS}" style="background: var(--perceptionGood)"></span>` +
        `<span>Bonheur subjectif supérieur : expansion couleur rouge cabernet</span>`,
    );
  dom.perceptionLegend
    .append("div")
    .attr("class", LEGEND_ITEM_CLASS)
    .html(
      `<span class="${LEGEND_SWATCH_CLASS}" style="background: var(--perceptionBad)"></span>` +
        `<span>Bonheur subjectif inférieur: incrustation sombre</span>`,
    );
}
