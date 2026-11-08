# RAG Test-Generation Pilot

Playwright test suites generated under three retrieval conditions, executed against a live
local instance of [OWASP Juice Shop](https://github.com/juice-shop/juice-shop) (an open-source,
intentionally vulnerable web application). This is the pilot reported in:

> Darii, O., Beldiga, M., & Brăgaru, T. (2026). *Retrieval-Augmented AI Agents for Web
> Application Test Generation: A Fine-Tuned Embedding Approach.* IRI 2026.

A locally hosted LLM (Qwen2.5-7B-Instruct, served via Ollama) generated the tests. Juice Shop's
own Cypress end-to-end test suite served as the source of retrieved context.

## Contents

```
tests/
  login/
    01-no-retrieval.spec.js                          baseline: generation from the requirement alone
    02-partial-retrieval.spec.js                      single most relevant retrieved test file only
    03-complete-retrieval.spec.js                     + the shared test-setup fixture
  product-search/
    01-no-retrieval.spec.js                           baseline
    02-complete-retrieval-before-cookie-fix.spec.js   complete retrieval, before the cookie-consent fix
    03-complete-retrieval.spec.js                     complete retrieval, after the fix
```

## Results summary

| Condition | Tests | Passed |
|---|---|---|
| Login — no retrieval | 2 | 0/2 |
| Login — partial retrieval | 15 | 0/15 (blocked by an unretrieved shared cookie-consent fixture) |
| Login — complete retrieval | 15 | 14/15 (incl. 9 reproduced authentication-bypass payloads) |
| Product search — no retrieval | 3 | 0/3 |
| Product search — complete retrieval | 6 | 0/6 (implementation-level API error + a server-side-only test hook) |

Full methodology, discussion, and interpretation are in the paper.

## Reproducing

```bash
npm install
npx playwright install
# run OWASP Juice Shop locally on http://localhost:3000, then:
npx playwright test
```

## Note on scope

This repository contains the generated test suites as executed for the pilot, not a
generation pipeline or software framework — there is no retriever, agent, or application
source code here. The pilot's tests were produced by prompting a locally hosted LLM directly
with the retrieved context for each condition, not by a packaged tool. The retriever +
generation agent described in the paper's Methodology as the target architecture belongs to
the planned full-scale study (fine-tuned retriever vs. non-fine-tuned baseline, controlled
injected defects), which is tracked separately and not part of this repository.

## Automated reproduction (8 Nov 2026)

`experiment/` contains an end-to-end automated pipeline (BGE-M3 retrieval → Qwen2.5-7B-Instruct →
Playwright against live Juice Shop v20.3.0) and its results: the failure mechanisms reported in the
paper reproduce, the complete-retrieval success (14/15) does not under single-shot automated
generation, and the pilot suite above re-executes at 14/15. See `experiment/README.md`.
