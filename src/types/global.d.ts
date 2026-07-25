/**
 * global.d.ts
 * Author: github.com/hyperphantasia
 * ---------------------------------------------------------------------------
 * d3 is loaded at runtime via a classic `<script src="https://d3js.org/d3.v7.min.js">`
 * tag (see index.html) rather than an ES module import, so at runtime it
 * exists as a global. This declares that global *value* for the type
 * checker using the real `@types/d3` definitions.
 *
 * Note: this only covers *value* usage (calling `d3.select(...)`, `d3.arc()`,
 * etc). TypeScript doesn't allow a UMD-global namespace to be used for
 * *type* positions (e.g. `d3.ScaleBand<string>`) from within a module file
 * without an explicit import - so files that need d3's types import them
 * directly instead, e.g. `import type { ScaleBand } from "d3";`. Those
 * imports are type-only and erased at compile time, so they don't produce
 * a runtime `import "d3"` in the compiled output.
 */

import type * as D3 from "d3";

declare global {
  const d3: typeof D3;
}

export {};
