# api-drift

**The problem:** your app depends on a third-party API. One day they rename a field, change a type, or start returning `null` where they used to return a number — and you find out from a production error, not a test.

**The solution:** a small contract suite that hits the **live** API and asserts the shape your code relies on. Run it in CI on a schedule; when the provider drifts, the suite goes red before your users do.

The target here is [Frankfurter](https://www.frankfurter.app/) (free ECB exchange rates, no API key).

## Run it

```bash
npm test
```

Needs Node 18+ (for built-in `fetch` and `node:test`). No dependencies, no install step.

Point it at a different host without touching code:

```bash
API_BASE=https://api.frankfurter.dev npm test
```

## How it's built

- `lib/schema.js` — a ~30-line shape checker (`checkShape(value, spec)`); `spec` values are a `typeof` string, a `RegExp`, or a predicate function.
- `test/contract.test.js` — five tests: the `/latest` shape, `from`/`to` filtering, the historical endpoint, error handling for an unknown currency, and a loose "rates in a sane band" drift guard.

## Contribute

- **Add a `/currencies` contract test** (see the open issue).
- Add a test that fails loudly if a rate moves more than 20% from a checked-in snapshot (real drift detection).
- Wrap `fetch` with a 1-retry-on-5xx helper and test it against `https://httpstat.us/503`.

---

Scaffolded by an automated weekly pipeline, then refined by hand — see the factory repo for how it works.
