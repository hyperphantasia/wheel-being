/**
 * tooltip.ts
 * Author: github.com/hyperphantasia
 * ---------------------------------------------------------------------------
 * Owns the floating tooltip. Deliberately has no knowledge of "stages" or
 * "dashboard mode". Callers decide whether to show/move the tooltip
 * (via utils.canInteractWithCountry). This module only knows how.
 *
 * Performance note: `mousemove` only repositions the existing element.
 * `showTooltip` (content + timer) only runs on `mouseenter`.
 */

import { dom } from "./dom.js";
import { state } from "./state.js";
import { formatPercent } from "./utils.js";
import type { CountryRow, IndicatorSegment } from "./types.js";

const AUTO_HIDE_DELAY_MS = 2000;
const CURSOR_OFFSET_PX = 10;
const DECIMAL_PLACES = 3;

let hideTimerId: ReturnType<typeof setTimeout> | undefined;

/**
 * Displays tooltip with country data by building HTML content, positioning it near the cursor,
 * and scheduling auto-hide after a delay.
 */
export function showTooltip(
  event: MouseEvent,
  countryRow: CountryRow,
  segment: IndicatorSegment | null,
  year: number | null,
  showPerceivedHappiness: boolean,
): void {
  clearTimeout(hideTimerId);

  // Prefer the live row for the current year (in case the bound datum is stale).
  const liveRow =
    state.currentYearData.find((row) => row["Pays"] === countryRow["Pays"]) ??
    countryRow;
  const happiness = liveRow.Happiness_Index;
  const subjective =
    liveRow.Subjective_Index != null && !Number.isNaN(liveRow.Subjective_Index)
      ? liveRow.Subjective_Index
      : null;

  dom.tooltip.style("opacity", 1).html(
    buildTooltipHtml({
      country: liveRow["Pays"],
      happiness,
      subjective,
      segment,
      year,
      showPerceivedHappiness,
    }),
  );

  positionTooltip(event);
  hideTimerId = setTimeout(hideTooltip, AUTO_HIDE_DELAY_MS);
}

/** Moves the tooltip element to follow the cursor with a fixed offset. */
export function positionTooltip(event: MouseEvent): void {
  dom.tooltip
    .style("left", `${event.pageX + CURSOR_OFFSET_PX}px`)
    .style("top", `${event.pageY + CURSOR_OFFSET_PX}px`);
}

/** Clears the auto-hide timer and fades out the tooltip by setting opacity to 0. */
export function hideTooltip(): void {
  clearTimeout(hideTimerId);
  dom.tooltip.style("opacity", 0);
}

interface TooltipContent {
  country: string;
  happiness: number;
  subjective: number | null;
  segment: IndicatorSegment | null;
  year: number | null;
  showPerceivedHappiness: boolean;
}

/** Constructs the tooltip's HTML string, formatting happiness metrics and optional segment data. */
function buildTooltipHtml({
  country,
  happiness,
  subjective,
  segment,
  year,
  showPerceivedHappiness,
}: TooltipContent): string {
  let html = `<b>${country}</b><br/>Année: ${year}<br/>Bonheur: ${happiness.toFixed(DECIMAL_PLACES)}`;
  if (showPerceivedHappiness && subjective != null) {
    html += `<br/>Bonheur perçu: ${subjective.toFixed(DECIMAL_PLACES)}`;
  }
  if (segment) {
    html += `<br/>${segment.key}: ${formatPercent(segment.value)}`;
  }
  return html;
}
