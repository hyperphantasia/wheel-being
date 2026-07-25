/**
 * dataService.ts
 * github.com/hyperphantasia
 * ---------------------------------------------------------------------------
 * Loads and parses the wellbeing CSV, then pre-computes a year -> sorted-rows
 * index (`dataByYear`).
 *
 * Why pre-index? Building the index once turns every subsequent year
 * lookup into an O(1) Map access.
 */

import { SECONDARY_COLUMNS } from "./config.js";
import type { CountryRow } from "./types.js";
import type { DSVRowString } from "d3";

export interface WellbeingDataset {
  allData: CountryRow[];
  yearList: number[];
  dataByYear: Map<number, CountryRow[]>;
}

/**
 * Loads CSV from the given URL, parses rows (coercing numeric fields),
 * and pre-indexes them by year for O(1) lookups; returns the raw data, sorted year list, and index.
 */
export async function loadWellbeingDataset(
  url: string,
): Promise<WellbeingDataset> {
  const rows = await d3.csv<CountryRow>(url, parseRow);
  const yearList = [...new Set(rows.map((row) => row.Année))].sort(
    d3.ascending,
  );
  const dataByYear = indexRowsByYear(rows, yearList);
  return { allData: rows, yearList, dataByYear };
}

/**
 * d3.csv row accessor: coerces numeric fields (`Année`, `Happiness_Index`, `Subjective_Index`, and all secondary indicators)
 * while treating empty subjective indices as null; leaves all other fields as strings.
 */
function parseRow(rawRow: DSVRowString<string>): CountryRow {
  const EMPTY_SECONDARY_DEFAULT = 0;
  const row = rawRow as unknown as CountryRow;
  row["Année"] = +rawRow["Année"];
  row["Happiness_Index"] = +rawRow["Happiness_Index"];
  row["Subjective_Index"] =
    rawRow["Subjective_Index"] === "" || rawRow["Subjective_Index"] == null
      ? null
      : +rawRow["Subjective_Index"];
  SECONDARY_COLUMNS.forEach((column) => {
    row[column] =
      +(rawRow[column] ?? EMPTY_SECONDARY_DEFAULT) || EMPTY_SECONDARY_DEFAULT;
  });
  return row;
}

/**
 * Builds a year -> rows lookup by filtering and sorting rows by year in descending happiness order;
 * enables O(1) retrieval of a year's data after one-time O(n log n) indexing.
 */
function indexRowsByYear(
  rows: CountryRow[],
  yearList: number[],
): Map<number, CountryRow[]> {
  const index = new Map<number, CountryRow[]>();
  yearList.forEach((year) => {
    const rowsForYear = rows
      .filter((row) => row["Année"] === year)
      .sort((a, b) => d3.descending(a.Happiness_Index, b.Happiness_Index));
    index.set(year, rowsForYear);
  });
  return index;
}
