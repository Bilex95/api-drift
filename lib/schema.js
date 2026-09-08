// Tiny shape checker — enough to assert an API response hasn't drifted,
// without pulling in a schema library.

// spec is an object of { key: checker }. A checker is one of:
//   "string" | "number" | "boolean" | "object"   (typeof check)
//   a RegExp                                       (tested against String(value))
//   a function (value) => boolean                  (custom predicate)
// Returns an array of human-readable problems; empty means it matches.
function checkShape(value, spec, path = "") {
  const problems = [];
  if (typeof value !== "object" || value === null) {
    return [`${path || "value"} is not an object`];
  }
  for (const [key, checker] of Object.entries(spec)) {
    const here = path ? `${path}.${key}` : key;
    if (!(key in value)) {
      problems.push(`missing key: ${here}`);
      continue;
    }
    const v = value[key];
    if (typeof checker === "string") {
      if (typeof v !== checker) problems.push(`${here}: expected ${checker}, got ${typeof v}`);
    } else if (checker instanceof RegExp) {
      if (!checker.test(String(v))) problems.push(`${here}: ${JSON.stringify(v)} fails ${checker}`);
    } else if (typeof checker === "function") {
      if (!checker(v)) problems.push(`${here}: ${JSON.stringify(v)} fails predicate`);
    }
  }
  return problems;
}

const isCurrencyCode = (v) => /^[A-Z]{3}$/.test(v);
const isIsoDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v);
const isPositiveNumber = (v) => typeof v === "number" && Number.isFinite(v) && v > 0;

module.exports = { checkShape, isCurrencyCode, isIsoDate, isPositiveNumber };
