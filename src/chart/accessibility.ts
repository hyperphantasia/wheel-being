/**
 * chart/accessibility.ts
 * Author: github.com/hyperphantasia
 * ---------------------------------------------------------------------------
 * The radial chart is a rich visual encoding that has no reasonable
 * screen-reader equivalent on its own (WCAG 1.1.1 / 1.3.1). This module
 * keeps a visually-hidden (.sr-only) data table in sync with whatever
 * year is on screen, and posts short aria-live status updates, so
 * assistive-technology users get the same information sighted users do.
 */

import { dom } from "../dom.js";
import type { CountryRow } from "../types.js";

/** @param data - Rows for the year being rendered, already sorted by rank. */
export function updateAccessibleSummary(
  data: CountryRow[],
  year: number,
): void {
  if (!data.length) return;

  const leader = data[0];
  dom.a11yCaption.text(`Classement du bien-être par pays pour l'année ${year}`);
  dom.a11yStatus.text(
    `Année ${year} affichée. ${leader["Pays"]} en-tête avec un indice de ${leader.Happiness_Index.toFixed(3)}.`,
  );

  const rows = dom.a11yTableBody
    .selectAll<HTMLTableRowElement, CountryRow>("tr")
    .data(data, (row) => row["Pays"]);
  rows.exit().remove();

  const rowsEnter = rows.enter().append("tr");
  rowsEnter.append("th").attr("scope", "row").attr("class", "a11y-rank");
  rowsEnter.append("td").attr("class", "a11y-country");
  rowsEnter.append("td").attr("class", "a11y-happiness");
  rowsEnter.append("td").attr("class", "a11y-subjective");

  const merged = rowsEnter.merge(rows);
  merged.select(".a11y-rank").text((row, index) => index + 1);
  merged.select(".a11y-country").text((row) => row["Pays"]);
  merged
    .select(".a11y-happiness")
    .text((row) => row.Happiness_Index.toFixed(3));
  merged
    .select(".a11y-subjective")
    .text((row) =>
      row.Subjective_Index != null && !Number.isNaN(row.Subjective_Index)
        ? row.Subjective_Index.toFixed(3)
        : "-",
    );
}
