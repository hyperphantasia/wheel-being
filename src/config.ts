/**
 * config.ts
 * Author: github.com/hyperphantasia
 * ---------------------------------------------------------------------------
 * Single source of truth for every static/domain constant used across the
 * app: chart geometry, category colors, narrative "stages" (the guided
 * data-story copy), country/cluster lookups, and timing constants.
 *
 * Nothing in this file mutates at runtime and nothing in this file talks to
 * the DOM beyond reading CSS custom properties. It is pure data that makes
 * it safe to import from anywhere without side effects.
 */

import type { ClusterDefinition, LegendGroup, Stage } from "./types.js";

// ============================================================================
// DATA & PATHS
// ============================================================================

/** Path to the CSV dataset, relative to index.html. */
export const DATA_URL = "data/final_wellbeing_dataset.csv";

// ============================================================================
// NARRATIVE STAGES
// ============================================================================

/**
 * Named indices for the four narrative "stages" of the story, used instead
 * of raw numbers (0/1/2/3) throughout the codebase for readability and to
 * avoid magic-number bugs if stages are ever reordered.
 */
export const STAGE = Object.freeze({
  INTRO: 0,
  BALTIC_PARADOX: 1,
  COVID_IMPACT: 2,
  DASHBOARD: 3,
} as const);

export type StageIndex = (typeof STAGE)[keyof typeof STAGE];

/**
 * The guided data-story content. Array order must match the STAGE enum
 * (index 0 = STAGE.INTRO, etc).
 */
export const STAGES: readonly Stage[] = [
  {
    label: "Introduction",
    title: "Le bien-être, une statistique ?",
    copy: `Euphrosyne erre, perplexe : que signifie vraiment « être heureux » ? À l'échelle de quelques pays de l'Union européenne, la réponse n'est pas simple : malgré le marché commun qui nous unit, des différences sociales et structurelles persistent. Pour y voir plus clair, elle a consolidé plusieurs indicateurs afin de construire un score agrégé (une  <a href="https://github.com/hyperphantasia/wheel-being/blob/main/methodology.md" target="_blank" rel="noopener noreferrer" style="color: #9FBEDC;">note méthodologique</a> est disponible). Un bloc de pays clairement favorisés se dessine: la Finlande et les Pays-Bas dominent le classement, avec une stabilité remarquable entre 2004 et 2024. Mais le paysage est plus nuancé qu'il n'y paraît, curieuse, Euphrosyne décide d'approfondir : tendances temporelles, écarts régionaux, et indices subjectifs versus indicateurs socio-économiques révèlent des histoires contrastées. Prêts pour la suite de l'exploration ?
    <div class="legend-item">
        <span><br>🌬 Les stories défilent automatiquement, tu pourras ensuite les relire une par une.</span>
    </div>`,
    pills: ["bonheur", "data storytelling", "hackaviz 2026"],
    word: "INTRO",
  },
  {
    label: "Story n◦1",
    title: "Le paradoxe balte",
    copy: `Le « paradoxe balte » désigne un faible score agrégé (souvent parmi les trois derniers) mais un excellent classement selon l'indice de bien-être subjectif (halo coloré). Se sentir bien ne signifie donc pas nécessairement être bien classé selon les indicateurs socio-économiques. Comment l'expliquer ? Les Baltes sont-ils particulièrement optimistes, ou bien les méthodes de calcul des indices de bonheur les désavantagent-elles ?<br><br>
    <div class="legend-item">
      <span class="legend-swatch" style="background: var(--perceptionGood)"></span>
      <span>Bonheur subjectif supérieur : expansion couleur rouge cabernet</span>
    </div>`,
    pills: ["états baltes", "décalage", "bien-être perçu"],
    word: "PARADOXE",
    focusYear: 2006,
    focusCountries: ["Lituanie", "Estonie", "Lettonie"],
    perceptionActive: true,
  },
  {
    label: "Story n◦2",
    title: "Le Covid a rendu des fissures visibles",
    copy: `Des événements peuvent-ils influer massivement sur le bien-être ? Penchons-nous sur la crise du Covid, dont les effets sont particulièrement perceptibles en 2021. Certaines économies ont mieux résisté ; d'autres ont eu plus de mal à encaisser le choc.<br>Deux exemples :<ul>
    <li>Allemagne : 0,553 → 0,436</li>
    <li>Finlande : 0,630 → 0,550</li>
  </ul>`,
    pills: ["pandémie", "perturbations", "crise sanitaire"],
    word: "COVID",
    focusYear: 2021,
    focusCountries: ["Allemagne", "Finlande"],
  },
  {
    label: "La roue du bonheur",
    title: "À toi de jouer !",
    copy: "Tu peux maintenant faire tourner la roue du bonheur pour découvrir d'autres récits. Observe, par exemple, les conséquences de la crise financière de 2008 sur des pays fortement endettés comme la Grèce ou l'Italie: l'impact sur l'indice de bien-être y est manifeste.",
    pills: [
      "vue radiale interactive",
      "exploration par pays",
      " lecture par année",
    ],
    word: "EUROPA",
  },
];

export const AUTO_ADVANCE_SCHEDULE: ReadonlyArray<{
  stage: StageIndex;
  delayMs: number;
}> = [
  { stage: STAGE.BALTIC_PARADOX, delayMs: 10600 },
  { stage: STAGE.COVID_IMPACT, delayMs: 18600 },
  { stage: STAGE.DASHBOARD, delayMs: 24600 },
];

// ============================================================================
// CHART DIMENSIONS & GEOMETRY
// ============================================================================

/**
 * SVG canvas geometry for the radial chart. All dimensions in pixels.
 */
export const CHART_DIMENSIONS = Object.freeze({
  width: 1400,
  height: 1400,
  cx: 700,
  cy: 700,
  innerRadius: 130,
  outerRadius: 510,
  basePad: 0.006,
});

// ============================================================================
// TIMING CONSTANTS
// ============================================================================

/**
 * Millisecond intervals and delays controlling chart animation and auto-play.
 */
export const TIMING = Object.freeze({
  /** How long one "tick" lasts while the dashboard is auto-playing years. */
  playTickMs: 1800,
  /** Delay between the automatic COVID year jump (2020 → 2021). */
  covidJumpDelayMs: 1400,
});

export const PLAY_INTERVAL_MS = TIMING.playTickMs;
export const COVID_JUMP_DELAY_MS = TIMING.covidJumpDelayMs;

// ============================================================================
// WELLBEING INDICATORS
// ============================================================================

/** The ten secondary wellbeing indicators that make up each radial segment. */
export const SECONDARY_COLUMNS: readonly string[] = Object.freeze([
  "Engagement civique",
  "Equilibre travail-vie",
  "Liens sociaux",
  "Logement",
  "Qualité environnementale",
  "Revenu et patrimoine",
  "Santé",
  "Savoirs et compétences",
  "Sécurité",
  "Travail et qualité de l'emploi",
]);

/** Color assigned to each secondary indicator, grouped by conceptual theme. */
export const CATEGORY_COLORS: ReadonlyMap<string, string> = new Map([
  // Minéral (economy)
  ["Revenu et patrimoine", "#A1A6AC"],
  ["Travail et qualité de l'emploi", "#757B82"],

  // Nature (living conditions & health)
  ["Logement", "#1F5238"],
  ["Equilibre travail-vie", "#2A6546"],
  ["Santé", "#143B29"],
  ["Qualité environnementale", "#356F4E"],

  // Océan (social cohesion)
  ["Liens sociaux", "#255F8F"],
  ["Engagement civique", "#3F87C2"],
  ["Sécurité", "#184A72"],
  ["Savoirs et compétences", "#5FA8DD"],
]);

/** Legend grouping: which secondary indicators belong to which meta-category. */
export const LEGEND_GROUPS: readonly LegendGroup[] = Object.freeze([
  {
    title: "Économie et emploi",
    items: ["Revenu et patrimoine", "Travail et qualité de l'emploi"],
  },
  {
    title: "Conditions de vie et santé",
    items: [
      "Logement",
      "Equilibre travail-vie",
      "Santé",
      "Qualité environnementale",
    ],
  },
  {
    title: "Cohésion sociale",
    items: [
      "Liens sociaux",
      "Engagement civique",
      "Sécurité",
      "Savoirs et compétences",
    ],
  },
]);

// ============================================================================
// COUNTRY & CLUSTER DATA
// ============================================================================

type IsoCode =
  | "GRC"
  | "ITA"
  | "PRT"
  | "AUT"
  | "BEL"
  | "DEU"
  | "ESP"
  | "FIN"
  | "FRA"
  | "NLD"
  | "BGR"
  | "HRV"
  | "SVN"
  | "SVK"
  | "EST"
  | "LTU"
  | "LVA"
  | "IRL"
  | "LUX";

/** ISO-3 country code -> French display name, as used by the dataset. */
export const ISO_TO_FRENCH_NAME: Readonly<Record<IsoCode, string>> =
  Object.freeze({
    GRC: "Grèce",
    ITA: "Italie",
    PRT: "Portugal",
    AUT: "Autriche",
    BEL: "Belgique",
    DEU: "Allemagne",
    ESP: "Espagne",
    FIN: "Finlande",
    FRA: "France",
    NLD: "Pays-Bas",
    BGR: "Bulgarie",
    HRV: "Croatie",
    SVN: "Slovénie",
    SVK: "République slovaque",
    EST: "Estonie",
    LTU: "Lituanie",
    LVA: "Lettonie",
    IRL: "Irlande",
    LUX: "Luxembourg",
  });

/**
 * Cluster definitions used by "Identifier les groupes" mode. Colors are read
 * from the corresponding CSS custom properties so the palette stays defined
 * in one place (styles.css) rather than being duplicated here.
 */
export const CLUSTER_DEFINITIONS: readonly ClusterDefinition[] = [
  {
    id: 1,
    name: "Le Sud endetté",
    color: readClusterColor("--cluster1"),
    codes: ["GRC", "ITA", "PRT"],
  },
  {
    id: 2,
    name: "Noyau fiscal historique de l'UE",
    color: readClusterColor("--cluster2"),
    codes: ["AUT", "BEL", "DEU", "ESP", "FIN", "FRA", "NLD"],
  },
  {
    id: 3,
    name: "Europe centrale",
    color: readClusterColor("--cluster3"),
    codes: ["SVK"],
  },
  {
    id: 4,
    name: "Groupe balte à faible revenus fiscaux",
    color: readClusterColor("--cluster4"),
    codes: ["EST", "LTU", "LVA"],
  },
  {
    id: 5,
    name: "Économies ouvertes à revenus fiscaux élevés",
    color: readClusterColor("--cluster5"),
    codes: ["IRL", "LUX"],
  },
];

// Pre-indexed lookup: French country name -> cluster definition (O(1) access)
const COUNTRY_TO_CLUSTER = new Map<string, ClusterDefinition>();
CLUSTER_DEFINITIONS.forEach((cluster) => {
  cluster.codes.forEach((isoCode) => {
    COUNTRY_TO_CLUSTER.set(ISO_TO_FRENCH_NAME[isoCode as IsoCode], cluster);
  });
});

/**
 * Returns the cluster a country belongs to by looking up its French name.
 * Returns null if the country is not found in any cluster.
 */
export function getCountryCluster(
  countryFrenchName: string,
): ClusterDefinition | null {
  return COUNTRY_TO_CLUSTER.get(countryFrenchName) ?? null;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Reads a CSS custom property value from the document root, trimming whitespace.
 * Enables cluster colors to be defined centrally in styles.css rather than
 * duplicated here.
 */
function readClusterColor(cssVariableName: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(cssVariableName)
    .trim();
}
