/**
 * types.ts
 * github.com/hyperphantasia
 * ---------------------------------------------------------------------------
 * Shared domain types for the app: the parsed CSV row shape, narrative
 * "stage" content, cluster definitions, and the bundle of D3 scales passed
 * around the chart sub-renderers.
 */

import type {
  Arc,
  DefaultArcObject,
  ScaleBand,
  ScaleLinear,
  Selection,
} from "d3";

/**
 * One row of the wellbeing dataset, after parsing.
 *
 * The ten secondary indicator columns (see config.ts SECONDARY_COLUMNS) have
 * French names with accents/apostrophes and are accessed dynamically via
 * `row[key]` rather than as literal properties, so they're covered by the
 * index signature rather than being named individually here.
 */
export interface CountryRow {
  Pays: string;
  Année: number;
  Happiness_Index: number;
  Subjective_Index: number | null;
  /** The ten secondary wellbeing indicators, keyed by their French column name. */
  [secondaryIndicatorKey: string]: string | number | null;
}

/** One segment of a country's stacked arc, before or after radius geometry is computed. */
export interface IndicatorSegment {
  key: string;
  value: number;
}

/** A segment once its inner/outer radius has been computed (see chart/arcs.ts). */
export interface PositionedSegment extends IndicatorSegment {
  r0: number;
  r1: number;
}

/** Guided-narrative stage content (see config.ts STAGES). */
export interface Stage {
  label: string;
  title: string;
  copy: string;
  pills: string[];
  word: string;
  /** Fixed year this stage focuses on (guided stages only; absent on the dashboard). */
  focusYear?: number;
  /** Countries highlighted/interactive during this stage (guided stages only). */
  focusCountries?: string[];
  /** Whether the perceived-happiness overlay is active by default on this stage. */
  perceptionActive?: boolean;
}

/** An economic cluster used by "cluster mode" (see config.ts CLUSTER_DEFINITIONS). */
export interface ClusterDefinition {
  id: number;
  name: string;
  color: string;
  /** ISO-3 country codes belonging to this cluster. */
  codes: string[];
}

/** A legend meta-group: a themed set of secondary indicators shown together. */
export interface LegendGroup {
  title: string;
  items: string[];
}

/**
 * The shared D3 scales/generator computed once per `renderYear` call and
 * passed down to every chart sub-renderer (grid, clock, labels, arcs).
 */
export interface ChartScales {
  angleScale: ScaleBand<string>;
  radiusScale: ScaleLinear<number, number>;
  /** Angle bounds are pre-set; callers only ever set innerRadius/outerRadius before invoking it. */
  arcGenerator: Arc<unknown, DefaultArcObject>;
}

/** The three persistent SVG layers built once at startup (see chart/setup.ts). */
export interface ChartLayers {
  gRoot: Selection<SVGGElement, unknown, HTMLElement, unknown>;
  gridLayer: Selection<SVGGElement, unknown, HTMLElement, unknown>;
  dataLayer: Selection<SVGGElement, unknown, HTMLElement, unknown>;
  centerLayer: Selection<SVGGElement, unknown, HTMLElement, unknown>;
}
