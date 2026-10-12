# A component records the run's instructions, not its own prompt's

> **Package:** `@webiny/api-component-extraction` (Generate), read by `@webiny/api-page-composition-poc`
> (`siteResult`) and the Site step.
> **Severity:** medium once the quality instructions are turned on; invisible before, because every
> count was zero.
> **Status:** open. Found 2026-10-12 while scoping the Site step redesign.

## What is recorded

`componentGeneration.ts` records `qualityInstructions` on each generated component as
`QUALITY_PROMPT_LINE_IDS.filter(id => include.includes(id))`: the instruction ids the run turned on.
The prompt itself is narrower. `qualityLines` adds the alt-input and image-size lines only when the
component has images (`hasImages`), and the form-labels line only when it has form fields
(`hasFormFields`). So a component without images records `quality.image-size` although its prompt never
carried the line.

## Two consequences, one cause

1. **The applied count overstates.** `carriesPass` reads the recorded ids, so a run with the
   instructions on reads "Performance pass applied to 13 of 13 components" when only the components with
   images had the image-size line. The accessibility count overstates the same way, through alt-input and
   form-labels.
2. **"0 of N" with the pass on cannot occur.** With the pass on for the run, every component records it;
   with it off, none does. A per-page "0 of N" therefore always means "the pass was off", never "the pass
   ran and no component on the page carried it". The redesign's legend described that second state; it
   was left out of the build because it does not exist.

## The fix

Record the ids `qualityLines` actually emitted for the component (the prompt's lines, not the run's
include list), and record separately which passes the run had on. The Site step can then say three
things per pass and page: not on for the run, on and carried by k of N, on and not applicable.

Older records keep the run's list and cannot be corrected after the fact; they read as now.
