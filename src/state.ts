/**
 * state.ts
 * github.com/hyperphantasia @Hackaviz26
 * ---------------------------------------------------------------------------
 * All mutable, cross-module state lives in this single object instead of
 * being scattered across many top-level `let` bindings.
 * Every other module imports `state` and reads/writes it directly.
 *
 * This is intentionally a plain object rather than a class or a full store
 * (Redux-style). The app is small enough that a lightweight shared object
 * keeps things easy to follow. If the app grows significantly, introducing
 * an event-driven store would be a reasonable next step (see README).
 */

import { STAGE, type StageIndex } from "./config.js";
import type { CountryRow } from "./types.js";

export interface AppState {
  /** Every parsed row from the CSV dataset. */
  allData: CountryRow[];
  /** Sorted, de-duplicated list of years present in the data. */
  yearList: number[];
  /**
   * Year -> rows for that year, pre-sorted by Happiness_Index (descending).
   * Pre-computed once at load time so the UI never has to re-filter/re-sort
   * the full dataset while navigating years or auto-playing.
   */
  dataByYear: Map<number, CountryRow[]>;
  /** Index into `yearList` for the year on screen. */
  currentYearIndex: number;
  /** Country currently pinned via click (dashboard only). */
  selectedCountry: string | null;
  /** Whether year auto-play is active. */
  playing: boolean;
  /** `setInterval` id for auto-play, so it can be cleared. */
  playTimerId: ReturnType<typeof setInterval> | null;
  /** Current STAGE (see config.ts). */
  stageIndex: StageIndex;
  /** Countries highlighted during a guided story stage. */
  focusSet: Set<string> | null;
  /** Country currently hovered (dashboard only). */
  hoverCountryName: string | null;
  /** Previous stage, used to detect stage transitions. */
  lastStageIndex: StageIndex;
  /** Whether cluster outlines are shown (dashboard only). */
  clusterMode: boolean;
  /** Whether the perceived-happiness overlay is shown. */
  perceptionMode: boolean;
  /** Rows currently rendered (mirrors the last renderYear call). */
  currentYearData: CountryRow[];
  /** Year associated with `currentYearData`. */
  currentYearForTooltip: number | null;
}

export const state: AppState = {
  allData: [],
  yearList: [],
  dataByYear: new Map(),
  currentYearIndex: 0,
  selectedCountry: null,
  playing: false,
  playTimerId: null,
  stageIndex: STAGE.INTRO,
  focusSet: null,
  hoverCountryName: null,
  lastStageIndex: STAGE.INTRO,
  clusterMode: false,
  perceptionMode: false,
  currentYearData: [],
  currentYearForTooltip: null,
};

/** Convenience accessor for the year currently selected by `currentYearIndex`. */
export function getCurrentYear(): number {
  return state.yearList[state.currentYearIndex];
}
