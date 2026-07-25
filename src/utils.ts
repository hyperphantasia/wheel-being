/**
 * utils.ts
 * Author: githb.com/hyperphantasia
 * ---------------------------------------------------------------------------
 * Small, dependency-light helper functions shared by multiple modules.
 * Keeping them here (instead of copy-pasted inline) is what lets the rest
 * of the codebase stay DRY.
 */

import { STAGE } from "./config.js";
import { state } from "./state.js";

/** Shared d3 percentage formatter (e.g. 0.234 -> "23.4%"). */
export const formatPercent = d3.format(".1%");

/** True if the user's OS/browser is set to reduce motion. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Returns a motion-safe transition duration: the requested duration normally,
 * or a near-instant one when the user has asked their OS to reduce motion.
 */
export function motionSafeDuration(durationMs: number): number {
  return prefersReducedMotion() ? 1 : durationMs;
}

/**
 * Whether hover/click/tooltip interactions should be active for a given
 * country in the current story stage:
 *  - Dashboard stage: every country is interactive.
 *  - Guided story stages (Baltic paradox / Covid): only the countries the
 *    story is focused on are interactive.
 *  - Intro stage: nothing is interactive.
 *
 * Centralizing this check avoids repeating the same three-line condition in
 * every mouse/keyboard handler.
 */
export function canInteractWithCountry(countryName: string): boolean {
  const isDashboard = state.stageIndex === STAGE.DASHBOARD;
  const isGuidedStory =
    state.stageIndex === STAGE.BALTIC_PARADOX ||
    state.stageIndex === STAGE.COVID_IMPACT;
  const isFocusedInStory =
    isGuidedStory && state.focusSet != null && state.focusSet.has(countryName);
  return isDashboard || isFocusedInStory;
}
