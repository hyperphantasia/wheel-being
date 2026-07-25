/**
 * story.ts
 * Author: github.com/hyperphantasia
 * Drives the guided data-story: stage navigation, year control, Covid animation, and dashboard auto-play.
 */

import { dom } from "./dom.js";
import { PLAY_INTERVAL_MS, STAGE, STAGES, type StageIndex } from "./config.js";
import { state, getCurrentYear } from "./state.js";
import {
  drawLegend,
  renderClusterLegend,
  renderPerceptionLegend,
} from "./legend.js";
import { renderYear } from "./chart/index.js";
import type { Stage } from "./types.js";

// ============================================================================
// CONSTANTS: Visual Filters & Effects (by stage)
// ============================================================================

const INTRO_BLUR_FILTER = "blur(3px) brightness(0.72) grayscale(1)";
const INTRO_BLUR_DURATION_MS = 1200;

const BALTIC_BLUR_FILTER = "blur(1px) brightness(0.92) grayscale(0.25)";
const BALTIC_BLUR_DURATION_MS = 600;
const BALTIC_UNBLUR_DURATION_MS = 350;

const DEFAULT_UNBLUR_DURATION_MS = 1000;
const NO_BLUR_FILTER = "none";

const EASING_FUNCTION = d3.easeCubicInOut;

// ============================================================================
// CONSTANTS: Covid Story Animation
// ============================================================================

const COVID_BEFORE_YEAR = 2020;
const COVID_AFTER_YEAR = 2021;

// ============================================================================
// TYPES
// ============================================================================

export interface StageConfig {
  stage: Stage;
  isDashboard: boolean;
  focusYear: number;
  focusCountries: Set<string> | null;
}

// ============================================================================
// STAGE CONFIGURATION & QUERIES
// ============================================================================

/**
 * Resolves the current stage's effective configuration by extracting the stage definition,
 * determining if it's the dashboard, computing the focus year, and creating a set of countries to highlight.
 */
export function getStageConfig(): StageConfig {
  const stage = STAGES[state.stageIndex];
  const isDashboard = state.stageIndex === STAGE.DASHBOARD;

  const focusYear =
    stage.focusYear && state.yearList.includes(stage.focusYear)
      ? stage.focusYear
      : isDashboard
        ? state.yearList[state.currentYearIndex]
        : state.yearList[0];

  const focusCountries = stage.focusCountries
    ? new Set(stage.focusCountries)
    : null;

  return { stage, isDashboard, focusYear, focusCountries };
}

// ============================================================================
// STAGE TRANSITIONS
// ============================================================================

/**
 * Transitions to a stage (wrapping), updates the hero panel, applies stage-specific visuals/controls,
 * and triggers the Covid jump animation if entering the Covid-impact stage for the first time.
 */
export function gotoStage(index: number): void {
  state.lastStageIndex = state.stageIndex;
  state.stageIndex = ((index + STAGES.length) % STAGES.length) as StageIndex;

  updateHero();
  clearCountrySelection();
  applyStageMode();

  if (
    state.stageIndex === STAGE.COVID_IMPACT &&
    state.lastStageIndex !== STAGE.COVID_IMPACT
  ) {
    animateCovidJump();
  } else {
    setYear(state.currentYearIndex);
  }
}

/**
 * Updates the hero panel (title, copy, pills, big word) and toggles visibility of cluster/perception controls
 * based on whether the current stage is the dashboard.
 */
function updateHero(): void {
  const stage = STAGES[state.stageIndex];
  dom.stageLabel.text(stage.label);
  dom.heroTitle.text(stage.title);
  dom.heroCopy.html(stage.copy);

  dom.heroPills.selectAll("*").remove();
  stage.pills.forEach((pillText) =>
    dom.heroPills.append("div").attr("class", "pill").text(pillText),
  );
  dom.bigWord.text(stage.word);

  const isDashboard = state.stageIndex === STAGE.DASHBOARD;
  updateDashboardControls(isDashboard);
  renderClusterLegend();
  renderPerceptionLegend();
}

/**
 * Toggles visibility and state of cluster/perception controls based on dashboard mode.
 */
function updateDashboardControls(isDashboard: boolean): void {
  dom.clusterToggleRow.classed("visible", isDashboard);
  dom.perceptionToggleRow.classed("visible", isDashboard);

  if (!isDashboard) {
    state.clusterMode = false;
    state.perceptionMode = false;
    dom.clusterToggle.property("checked", false).attr("aria-checked", "false");
    dom.perceptionToggle
      .property("checked", false)
      .attr("aria-checked", "false");
    dom.heroBox
      .classed("cluster-expanded", false)
      .classed("perception-expanded", false);
  } else {
    const stage = STAGES[state.stageIndex];
    state.perceptionMode = Boolean(stage.perceptionActive);
    dom.perceptionToggle
      .property("checked", state.perceptionMode)
      .attr("aria-checked", String(state.perceptionMode));
    dom.heroBox.classed("perception-expanded", state.perceptionMode);
  }
}

/**
 * Applies stage-specific visual filters (blur, brightness, grayscale), control visibility,
 * and CSS classes; sets the focus year and country set for highlighting.
 */
function applyStageMode(): void {
  const { focusYear, focusCountries } = getStageConfig();
  state.focusSet = focusCountries;

  updateControlVisibility();
  applyStageClasses();
  applyStageFilter();
  setFocusYear(focusYear);
  drawLegend();
}

/**
 * Shows year controls only in dashboard mode.
 */
function updateControlVisibility(): void {
  dom.yearControls.style(
    "display",
    state.stageIndex === STAGE.DASHBOARD ? "flex" : "none",
  );
}

/**
 * Applies CSS stage classes to the main SVG wrapper.
 */
function applyStageClasses(): void {
  dom.wrap
    .classed("stage-intro", state.stageIndex === STAGE.INTRO)
    .classed(
      "stage-story",
      state.stageIndex === STAGE.BALTIC_PARADOX ||
        state.stageIndex === STAGE.COVID_IMPACT,
    )
    .classed("stage-dashboard", state.stageIndex === STAGE.DASHBOARD);
}

/**
 * Applies and animates the appropriate blur/brightness filter based on the current stage.
 */
function applyStageFilter(): void {
  dom.svg.interrupt();

  if (state.stageIndex === STAGE.INTRO) {
    dom.svg
      .transition()
      .duration(INTRO_BLUR_DURATION_MS)
      .ease(EASING_FUNCTION)
      .style("filter", INTRO_BLUR_FILTER);
  } else if (state.stageIndex === STAGE.BALTIC_PARADOX) {
    dom.svg
      .transition()
      .duration(BALTIC_BLUR_DURATION_MS)
      .ease(EASING_FUNCTION)
      .style("filter", BALTIC_BLUR_FILTER)
      .transition()
      .duration(BALTIC_UNBLUR_DURATION_MS)
      .style("filter", NO_BLUR_FILTER);
  } else {
    dom.svg
      .transition()
      .duration(DEFAULT_UNBLUR_DURATION_MS)
      .ease(EASING_FUNCTION)
      .style("filter", NO_BLUR_FILTER);
  }
}

/**
 * Clears selected country and hover state.
 */
function clearCountrySelection(): void {
  state.selectedCountry = null;
  state.hoverCountryName = null;
}

/**
 * Sets the year index and updates the chart render.
 */
function setFocusYear(focusYear: number): void {
  const focusIndex = state.yearList.indexOf(focusYear);
  if (focusIndex !== -1) state.currentYearIndex = focusIndex;
}

// ============================================================================
// YEAR & PLAYBACK NAVIGATION
// ============================================================================

/**
 * Moves to a given year index with wrapping in dashboard mode. In story modes,
 * locks to the stage's focus year if one is defined, then re-renders the chart.
 */
export function setYear(index: number): void {
  if (state.stageIndex === STAGE.DASHBOARD) {
    state.currentYearIndex =
      (index + state.yearList.length) % state.yearList.length;
  } else {
    const fixedYear = STAGES[state.stageIndex].focusYear;
    if (fixedYear && state.yearList.includes(fixedYear)) {
      state.currentYearIndex = state.yearList.indexOf(fixedYear);
    }
  }

  const year = getCurrentYear();
  renderYear(state.dataByYear.get(year) ?? [], year);
}

/**
 * Renders Covid before/after years with a delay between them to create dramatic visual contrast.
 * Falls back to normal year render if either year is missing.
 */
export function animateCovidJump(): void {
  const hasCovidBefore = state.yearList.includes(COVID_BEFORE_YEAR);
  const hasCovidAfter = state.yearList.includes(COVID_AFTER_YEAR);

  if (!hasCovidBefore || !hasCovidAfter) {
    setYear(state.currentYearIndex);
    return;
  }

  state.currentYearIndex = state.yearList.indexOf(COVID_BEFORE_YEAR);
  renderYear(state.dataByYear.get(COVID_BEFORE_YEAR) ?? [], COVID_BEFORE_YEAR);

  setTimeout(() => {
    state.currentYearIndex = state.yearList.indexOf(COVID_AFTER_YEAR);
    renderYear(state.dataByYear.get(COVID_AFTER_YEAR) ?? [], COVID_AFTER_YEAR);
  }, PLAY_INTERVAL_MS);
}

/**
 * Toggles dashboard year auto-play on/off by starting/stopping a timer that advances
 * the year index at regular intervals. Only works in dashboard stage.
 */
export function togglePlay(): void {
  const { isDashboard } = getStageConfig();
  if (!isDashboard) return;

  state.playing = !state.playing;
  dom.playPauseBtn
    .text(state.playing ? "Pause" : "Démarrer")
    .attr("aria-pressed", String(state.playing));

  if (state.playing) {
    state.playTimerId = setInterval(
      () => setYear(state.currentYearIndex + 1),
      PLAY_INTERVAL_MS,
    );
  } else {
    if (state.playTimerId != null) clearInterval(state.playTimerId);
  }
}
