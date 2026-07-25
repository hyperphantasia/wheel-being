/**
 * main.ts
 * Author: github.com/hyperphantasia
 * ---------------------------------------------------------------------------
 * Application entry point. Compiled to dist/main.js and loaded in index.html
 * as `<script type="module" src="dist/main.js">`. Responsible for, in order:
 *  1. Building the static SVG layer structure.
 *  2. Loading + indexing the dataset (with a user-facing error state on failure).
 *  3. Wiring every UI control to the story/chart modules.
 *  4. Kicking off the introductory guided tour.
 */

import { dom } from "./dom.js";
import { AUTO_ADVANCE_SCHEDULE, DATA_URL, STAGE } from "./config.js";
import { state } from "./state.js";
import { loadWellbeingDataset } from "./dataService.js";
import {
  drawLegend,
  renderClusterLegend,
  renderPerceptionLegend,
} from "./legend.js";
import { createChartLayers } from "./chart/setup.js";
import { initChartLayers } from "./chart/index.js";
import { gotoStage, setYear, togglePlay } from "./story.js";

// UI text strings
const ERROR_TITLE = "Erreur de chargement";
const ERROR_COPY =
  "Impossible de charger les données de bien-être. Vérifiez votre connexion, puis rechargez la page.";
const ERROR_STAGE_LABEL = "Erreur";
const ERROR_A11Y_STATUS = "Le chargement des données a échoué.";
const LEGEND_EXPAND_SYMBOL = "+";
const LEGEND_COLLAPSE_SYMBOL = "\u2212";
const LEGEND_EXPAND_LABEL = "Afficher la légende détaillée";
const LEGEND_COLLAPSE_LABEL = "Masquer la légende détaillée";

/**
 * Initializes the chart layers, loads the wellbeing dataset, binds all UI controls,
 * transitions to intro stage, and schedules auto-advance to subsequent stages on timers.
 */
async function bootstrap(): Promise<void> {
  initChartLayers(createChartLayers(dom.svg));

  try {
    const { allData, yearList, dataByYear } =
      await loadWellbeingDataset(DATA_URL);
    state.allData = allData;
    state.yearList = yearList;
    state.dataByYear = dataByYear;
  } catch (error) {
    console.error("Failed to load the wellbeing dataset:", error);
    showLoadError();
    return;
  }

  drawLegend();
  bindControls();

  gotoStage(STAGE.INTRO);
  AUTO_ADVANCE_SCHEDULE.forEach(({ stage, delayMs }) => {
    setTimeout(() => gotoStage(stage), delayMs);
  });
}

/**
 * Attaches click and change handlers to all UI buttons and toggles,
 * dispatching year/stage navigation, playback, and mode-switching logic.
 */
function bindControls(): void {
  dom.prevYearBtn.on("click", () => setYear(state.currentYearIndex - 1));
  dom.nextYearBtn.on("click", () => setYear(state.currentYearIndex + 1));
  dom.playPauseBtn.on("click", togglePlay);
  dom.prevStageBtn.on("click", () => gotoStage(state.stageIndex - 1));
  dom.nextStageBtn.on("click", () => gotoStage(state.stageIndex + 1));

  dom.clusterToggle.on("change", () => {
    const checked = Boolean(dom.clusterToggle.property("checked"));
    state.clusterMode = checked && state.stageIndex === STAGE.DASHBOARD;
    dom.clusterToggle.attr("aria-checked", String(state.clusterMode));
    dom.heroBox.classed("cluster-expanded", state.clusterMode);
    renderClusterLegend();
    setYear(state.currentYearIndex);
  });

  dom.perceptionToggle.on("change", () => {
    const checked = Boolean(dom.perceptionToggle.property("checked"));
    state.perceptionMode = checked && state.stageIndex === STAGE.DASHBOARD;
    dom.perceptionToggle.attr("aria-checked", String(state.perceptionMode));
    dom.heroBox.classed("perception-expanded", state.perceptionMode);
    renderPerceptionLegend();
    setYear(state.currentYearIndex);
  });

  dom.legendToggle.on("click", () => {
    const isExpanded = dom.hud.classed("expanded");
    dom.hud.classed("expanded", !isExpanded);
    dom.legendToggle
      .text(isExpanded ? LEGEND_EXPAND_SYMBOL : LEGEND_COLLAPSE_SYMBOL)
      .attr("aria-expanded", String(!isExpanded))
      .attr(
        "aria-label",
        isExpanded ? LEGEND_EXPAND_LABEL : LEGEND_COLLAPSE_LABEL,
      );
  });
}

/**
 * Populates the hero box with error messaging and updates accessibility status
 * when data loading fails.
 */
function showLoadError(): void {
  dom.heroTitle.text(ERROR_TITLE);
  dom.heroCopy.text(ERROR_COPY);
  dom.stageLabel.text(ERROR_STAGE_LABEL);
  dom.a11yStatus.text(ERROR_A11Y_STATUS);
}

bootstrap();
