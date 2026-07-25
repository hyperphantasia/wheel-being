/**
 * chart/centerInfo.ts
 * Author: github.com/hyperphantasia
 * ---------------------------------------------------------------------------
 * Animates the year / country name / score text displayed in the middle of
 * the wheel.
 */

import { dom } from "../dom.js";
import { state } from "../state.js";
import { STAGE } from "../config.js";
import type { CountryRow } from "../types.js";

// Animation durations and timings (milliseconds)
const YEAR_FADE_OUT_DURATION_MS = 220;
const YEAR_FADE_IN_DURATION_BALTIC_MS = 520;
const YEAR_FADE_IN_DURATION_DEFAULT_MS = 320;
const YEAR_FADE_IN_DELAY_BALTIC_MS = 120;

// Animation distances (pixels)
const YEAR_SLIDE_DISTANCE_PX = 8;

// Formatting precision
const HAPPINESS_INDEX_DECIMAL_PLACES = 3;

/**
 * Updates the center display (year, country name, score) based on the current stage and selection state.
 * Clears all text in intro stage, shows only year in Baltic story, and conditionally focuses the panel based on stage or selection.
 */
export function updateCenterInfo(year: number, data: CountryRow[]): void {
  if (state.stageIndex === STAGE.INTRO) {
    dom.selectedCenter.classed("focus", false);
    dom.centerYear.text("");
    dom.centerName.text("");
    dom.centerScore.text("");
    return;
  }

  animateYearText(year);

  if (state.stageIndex === STAGE.BALTIC_PARADOX) {
    // The Baltic-paradox story only ever shows the year, never a pinned country.
    dom.selectedCenter.classed("focus", true);
    dom.centerName.text("");
    dom.centerScore.text("");
    return;
  }

  // Covid story keeps the center panel visually "focused" at all times;
  // the dashboard only focuses it once a country is selected.
  const alwaysFocused = state.stageIndex === STAGE.COVID_IMPACT;
  dom.selectedCenter.classed(
    "focus",
    alwaysFocused || Boolean(state.selectedCountry),
  );
  setFocusCountryText(data);
}

/**
 * Animates the year text with a fade-out and slide down, updates the content, then fades in with a slide up.
 * Uses different durations and delays for the Baltic story stage versus other stages.
 */
function animateYearText(year: number): void {
  const isBalticsStory = state.stageIndex === STAGE.BALTIC_PARADOX;
  const fadeInDuration = isBalticsStory
    ? YEAR_FADE_IN_DURATION_BALTIC_MS
    : YEAR_FADE_IN_DURATION_DEFAULT_MS;
  const fadeInDelay = isBalticsStory ? YEAR_FADE_IN_DELAY_BALTIC_MS : 0;

  dom.centerYear
    .interrupt()
    .transition()
    .duration(YEAR_FADE_OUT_DURATION_MS)
    .ease(d3.easeCubicOut)
    .style("opacity", 0)
    .style("transform", `translateY(${YEAR_SLIDE_DISTANCE_PX}px)`)
    .on("end", () => {
      dom.centerYear.text(String(year || ""));
      dom.centerYear
        .transition()
        .duration(fadeInDuration)
        .delay(fadeInDelay)
        .ease(d3.easeCubicOut)
        .style("opacity", 1)
        .style("transform", "translateY(0)");
    });
}

/**
 * Updates the center panel's country name and happiness score text based on the selected country.
 * Looks up the country row in the data and displays the score, or clears text if no selection exists.
 */
function setFocusCountryText(data: CountryRow[]): void {
  if (!state.selectedCountry) {
    dom.centerName.text("");
    dom.centerScore.text("");
    return;
  }
  const focusRow = data.find((row) => row["Pays"] === state.selectedCountry);
  dom.centerName.text(focusRow ? focusRow["Pays"] : state.selectedCountry);
  dom.centerScore.text(
    focusRow
      ? `Bonheur: ${focusRow.Happiness_Index.toFixed(HAPPINESS_INDEX_DECIMAL_PLACES)}`
      : "No data for this year",
  );
}
