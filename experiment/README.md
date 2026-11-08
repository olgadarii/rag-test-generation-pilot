# Automated reproduction of the pilot (8 Nov 2026)

The pilot in the paper (`../tests/`) was produced by prompting the LLM directly with
**manually selected** context. This folder automates the whole procedure end to end and
repeats it, to check which findings hold without a human in the loop.

**Pipeline:** BGE-M3 retrieval (Ollama) → Qwen2.5-7B-Instruct generation (Ollama, T = 0.7,
seeds 1007/2007/3007) → Playwright specs executed against a live OWASP Juice Shop v20.3.0
(restarted, i.e. re-seeded, before every execution). Corpus: Juice Shop's own Cypress suite
at tag v20.3.0 (32 `.ts` files + `cypress.config.ts`).

| Code | Context given to the model |
|---|---|
| `A` | none (requirement only) |
| `B_auto` | top-1 file returned by BGE-M3 |
| `C_auto` | B_auto + its dependencies (supportFile, imports, custom commands) |
| `B_oracle` | the test file chosen manually, as in the paper's pilot |
| `C_oracle` | test file + `support/setup.ts`, as in the paper's pilot |

## Results (`results_v2/summary.md`)

30 runs (2 stories × 5 conditions × 3 repetitions), 148 executed tests, **0 passed**.

| Condition | Login | Product search |
|---|---|---|
| A | 0/15 | 0/5 |
| B_auto | 0/17 | 0/13 |
| C_auto | 0/12 | 0/6 |
| B_oracle | 0/44 | 0/13 |
| C_oracle | 0/15 | 0/8 |

- **Confirmed:** no-retrieval generation invents the route (`/login` vs `/#/login`);
  B_oracle fails in 3/3 runs because the welcome/cookie overlay intercepts the login click
  (the paper's 0/15); server-side `cy.task` logic is mistranslated into browser code.
- **Retrieval:** for login, BGE-M3 ranks `totpSetup.spec.ts` first and `login.spec.ts` third;
  `support/setup.ts` (the cookie fixture) ranks 33/33 (search: 31/33). Similarity alone does
  not surface the implicit dependency; the dependency expansion does.
- **Not reproduced:** in 0 of 6 C runs did the model translate `setup.ts` into
  `context.addCookies(...)`, so C fails; single-shot generation does not reach the pilot's
  14/15.
- **Pilot suite re-executed** (`../tests/login/03-complete-retrieval.spec.js`) on Juice Shop
  v20.3.0: **14/15**, same 2FA failure, when run with `APPLICATION_DOMAIN=juice-sh.op`
  (4/15 without it: 11 tests build e-mails from that variable).

Failure categories come from `lib/classify.mjs` (heuristic); raw messages are kept in each
run's `result.json` / `report.json`.

## Re-running

```bash
bash run-on-mac.sh            # macOS; installs what is missing under ./tools, resumable
RUNS=5 bash run-on-mac.sh     # more repetitions
```
