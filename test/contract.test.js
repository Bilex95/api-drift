const test = require("node:test");
const assert = require("node:assert/strict");
const {
  checkShape,
  isCurrencyCode,
  isIsoDate,
  isPositiveNumber,
} = require("../lib/schema");

// Frankfurter — free, no key, ECB reference rates. Override if the host moves.
const API_BASE = process.env.API_BASE || "https://api.frankfurter.app";

async function get(path) {
  const res = await fetch(API_BASE + path);
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* leave body null for non-JSON error responses */
  }
  return { res, body };
}

test("GET /latest matches the documented shape", async () => {
  const { res, body } = await get("/latest");
  assert.ok(res.ok, `expected 2xx, got ${res.status}`);

  const problems = checkShape(body, {
    amount: isPositiveNumber,
    base: isCurrencyCode,
    date: isIsoDate,
    rates: (v) => typeof v === "object" && v !== null,
  });
  assert.deepEqual(problems, [], problems.join("; "));

  for (const [code, rate] of Object.entries(body.rates)) {
    assert.ok(isCurrencyCode(code), `bad currency code: ${code}`);
    assert.ok(isPositiveNumber(rate), `bad rate for ${code}: ${rate}`);
  }
});

test("GET /latest honours from/to and returns only the requested pair", async () => {
  const { res, body } = await get("/latest?from=USD&to=GBP");
  assert.ok(res.ok, `expected 2xx, got ${res.status}`);
  assert.equal(body.base, "USD");
  assert.deepEqual(Object.keys(body.rates), ["GBP"]);
});

test("historical endpoint returns the exact day requested", async () => {
  const { res, body } = await get("/2020-01-02?to=USD");
  assert.ok(res.ok, `expected 2xx, got ${res.status}`);
  assert.equal(body.date, "2020-01-02");
});

test("an unknown currency is rejected with a non-2xx", async () => {
  const { res } = await get("/latest?from=ZZZ");
  assert.ok(!res.ok, `expected an error status, got ${res.status}`);
  assert.ok(res.status >= 400 && res.status < 500);
});

test("rates stay within a sane band (drift guard)", async () => {
  const { body } = await get("/latest?from=EUR");
  const values = Object.values(body.rates);
  assert.ok(values.length > 5, "expected a basket of rates");
  for (const rate of values) {
    assert.ok(rate > 0 && rate < 100000, `rate out of band: ${rate}`);
  }
});
