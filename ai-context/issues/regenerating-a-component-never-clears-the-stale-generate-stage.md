# Regenerating a component never clears a stale Generate stage

> **Package:** `@webiny/api-component-extraction` (`replaceGeneratedComponent`, the stage ledger)
> **Severity:** medium. An operator who corrects a plan and regenerates the affected component has no
> route to Assemble but re-running the whole Generate stage: model calls on every component.
> **Status:** open. Found 2026-10-09; worked around on two demo runs by a recorded, development-only
> mark (`componentExtractionMarkStageCurrent`). Not to be fixed before the demo.

## What happens

A plan correction (an override, a re-plan or a re-bind) re-applies Plan and marks every later stage
stale. "Generate again" on the corrected component replaces that component's result and its entry in
the stage's aggregate, but never touches the stage's status. Assemble refuses to run while Generate is
stale. So the only way on is a full Generate re-run, which regenerates every component, the corrected
one included, at full cost and with full variance.

## Why it cannot simply clear itself

The stage is current when every component was generated from its current plan. A generated result
records the plan artifact it read (`planRef`) but not which version of that component's contract it
was, so nothing can check "current" for a component; it can only be asserted. The 2026-10-09 mark
asserts it, with the reason recorded on the run.

## What a fix needs

Per-component staleness: a plan correction marks only the corrected components stale (by signature),
each result records the contract it was generated from (a hash of that component's planned entry),
and Generate is current when every component's result matches its current contract. Then a
per-component regenerate clears exactly what it fixed, and Assemble can run.
