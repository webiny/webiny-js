# Workflows: open questions

Produced by reviewing `decisions.md` (D1-D17) against the brief and discovery docs. Ordered by importance, blocking design first. Answered questions move into `decisions.md`.

## Questions

1. ~~Answered in D19.~~
2. ~~Answered in D20.~~
3. ~~Answered in D21.~~
4. ~~Answered in D22.~~
5. ~~Answered in D23.~~
6. ~~Answered in D24 (WB revision support to check).~~
7. ~~Answered in D25.~~
8. ~~Answered in D26.~~
9. ~~Answered in D27.~~
10. ~~Answered in D28.~~
11. ~~Answered in D29.~~
12. ~~Answered in D30.~~
13. ~~Answered in D31.~~
14. ~~Answered in D32.~~
15. ~~Answered in D33.~~
16. ~~Answered in D34.~~
17. ~~Answered in D35.~~
18. ~~Answered in D36.~~
19. ~~Answered in D37.~~
20. ~~Answered in D38.~~
21. ~~Answered in D39, D40.~~
22. ~~Answered in D41.~~
23. ~~Answered in D42.~~
24. ~~Answered in D43.~~
25. ~~Answered in D44.~~
26. ~~Answered in D45.~~
27. ~~Answered in D46 (WB folder delete guard: bug B1 in bugs.md).~~
28. ~~Answered in D47.~~
29. ~~Answered in D48.~~
30. ~~Answered in D18.~~

## Contradictions

- D12 drops locale; routing.md lists it as a condition. Accepted deviation; record it in the spec.
- D1 (no migration) breaks routing.md "nothing changes for existing workflows, no migration needed". Accepted: next is unreleased (D1).
- D2 "manual" vs routing.md "manual selection". Resolved by D49.
- D11 owner = assignee vs routing.md reassignment. Resolved by D33.
- D14 built-ins vs D13 no-editing. Resolved by D36, D39.
- D10 vs cancel flow and developer-mode "Remove Review Request". Resolved by D25.
- D14 "per app" scope vs D15. Resolved by D35.

## Second pass: admin findings (2026-10-02)

A1. ~~Answered in D54.~~
A2. ~~Answered in D55.~~
A3. ~~Answered in D66.~~
A4. ~~Answered in D67.~~
A5. ~~Answered in D56.~~
A6. ~~Answered in D68.~~
A7. ~~Answered in D60.~~
A8. ~~Answered in D69.~~
A9. ~~Answered in D54.~~
A10. ~~Answered in D70.~~
A11. ~~Answered in D71.~~
A12. ~~Answered in D72.~~
A13. ~~Answered in D73.~~

## Second pass: API findings (2026-10-02)

P1. ~~Answered in D53.~~
P2. ~~Answered in D52.~~
P3. ~~Answered in D54.~~
P4. ~~Answered in D65.~~
P5. ~~Answered in D55.~~
P6. ~~Answered in D56.~~
P7. ~~Answered in D57.~~
P8. ~~Answered in D59.~~
P9. ~~Answered in D60.~~
P10. ~~Answered in D61.~~
P11. ~~Answered in D62.~~
P12. ~~Answered in D63.~~
P13. ~~Answered in D64.~~
P14. ~~Answered in D57, D58.~~

## Spec review (2026-10-05)

Applied directly to the spec: guard on failure writes, reach-time failure and restart semantics, empty narrowed sets, round-robin fallback, resolution errors go to pool, lenient submit validation, rule target validation on save, human action checks, exclusions do not affect held work, log pool start and take-over, pool notification recipients, stuck detection on single reads only, editor reload, secret field display, brief overrides noted.

Still open:

S1. ~~Answered in D74.~~
S2. ~~Answered in D75.~~
S3. ~~Answered in D76.~~
S4. ~~Answered in D77.~~
S5. ~~Answered in D78.~~
S6. ~~Answered in D79.~~
S7. ~~Answered in D80.~~
S8. ~~Answered in D81.~~
S9. ~~Answered in D82.~~
S10. ~~Answered in D83.~~
S11. ~~Answered in D84.~~
