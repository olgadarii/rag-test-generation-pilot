# Rezultate experiment

Generat: 2026-11-08T19:44:12.368Z

## login

Regăsire BGE-M3: top-1 = `test/cypress/e2e/totpSetup.spec.ts` · ținta pe locul 3 · setup.ts pe locul 33 din corpus

| Condiție | Rulări | Teste trecute / total | Rată pe rulare | Rulări cu ≥1 trecut | Cauze principale de eșec |
|---|---|---|---|---|---|
| A · fără regăsire | 3 | 0 / 15 (0%) | 0/5, 0/5, 0/5 | 0 / 3 | selector_not_found (15) |
| B · parțială (retriever) | 3 | 0 / 17 (0%) | 0/5, 0/5, 0/7 | 0 / 3 | overlay_blocked (9), selector_not_found (8) |
| C · completă (retriever + dependențe) | 3 | 0 / 12 (0%) | 0/6, 0/0, 0/6 | 0 / 3 | overlay_blocked (10), selector_not_found (2), api_or_syntax_error (1) |
| B · parțială (aleasă manual, ca în pilot) | 3 | 0 / 44 (0%) | 0/15, 0/14, 0/15 | 0 / 3 | overlay_blocked (32), other (11), selector_not_found (1) |
| C · completă (aleasă manual, ca în pilot) | 3 | 0 / 15 (0%) | 0/15, 0/0, 0/0 | 0 / 3 | other (11), overlay_blocked (4), api_or_syntax_error (2) |

## search

Regăsire BGE-M3: top-1 = `test/cypress/e2e/search.spec.ts` · ținta pe locul 1 · setup.ts pe locul 31 din corpus

| Condiție | Rulări | Teste trecute / total | Rată pe rulare | Rulări cu ≥1 trecut | Cauze principale de eșec |
|---|---|---|---|---|---|
| A · fără regăsire | 3 | 0 / 5 (0%) | 0/2, 0/2, 0/1 | 0 / 3 | selector_not_found (5) |
| B · parțială (retriever) | 3 | 0 / 13 (0%) | 0/7, 0/3, 0/3 | 0 / 3 | selector_not_found (6), api_or_syntax_error (4), other (2), assertion_failed (1) |
| C · completă (retriever + dependențe) | 3 | 0 / 6 (0%) | 0/2, 0/2, 0/2 | 0 / 3 | selector_not_found (4), assertion_failed (1), api_or_syntax_error (1) |
| B · parțială (aleasă manual, ca în pilot) | 3 | 0 / 13 (0%) | 0/7, 0/3, 0/3 | 0 / 3 | selector_not_found (6), api_or_syntax_error (3), other (3), assertion_failed (1) |
| C · completă (aleasă manual, ca în pilot) | 3 | 0 / 8 (0%) | 0/3, 0/3, 0/2 | 0 / 3 | selector_not_found (4), assertion_failed (3), api_or_syntax_error (1) |
