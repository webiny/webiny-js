# Nothing could name which composition it was looking at

> **Package:** `@webiny/api-page-composition-poc` (`pageMapKey`, `ComposePagesService`)
> **Severity:** medium — no data was lost and no page was wrong, but every artefact derived from a
> composition was unattributable, including the harness output shown in the demo.
> **Status:** fixed. `PageMap.composeVersion` was added in `092e118bd1`. Recorded because the gap
> stood for the whole life of the package and explains a class of confusion that already happened.

## What was missing

The page map lived at one key per run:

```ts
export const pageMapKey = (runId: string): string => `pageCompositionPoc:pageMap:${runId}`;
```

Every composition of a run overwrote it. The only thing distinguishing one composition from the next
was `composedOn`, a timestamp written by the composer and read by nobody — no counter, no version, and
nothing on the map that anything downstream could compare.

The pipeline's own stages have had this since the beginning. A stage artifact's key carries its stage
version:

```ts
`componentExtraction:artifact:${runId}:${stage}:v${stageVersion}:${name}`;
```

Composition, being outside the nine stages, inherited none of it.

## Why it mattered

**Anything derived from a composition could not say which composition it described.** Not a
hypothetical: the four demo sites were recomposed on the order of a dozen times while the image
binding, the SDK name mismatch, the scalar-list 500s and the prop alignment were worked through. Each
recompose silently replaced the map. So:

- The comparison harness's screenshots, and the HTML reports built beside them, described _a_
  composition of a run with no way to say which one. Re-running the harness after a recompose and
  re-running it without one produced output that looked identical.
- The same is true of every measurement taken by reading the page map — the text-coverage figures, the
  link and image reconciliations, the prop-alignment counts. Each was correct about the composition it
  read and unable to name it.
- Nothing could detect that a comparison had gone out of date. A screenshot taken before a recompose
  and one taken after were indistinguishable, and the earlier one read as current.

The measurements in this project were taken and reported within single sessions, so in practice the
attribution held by sequence rather than by evidence. That is the thing that was wrong: it held
because someone was keeping track, not because the data said so.

## The fix

`PageMap.composeVersion`, incremented per composition by reading the previous map before writing the
new one. Maps written before it read as 0, so the first composition afterwards is version 1 whatever
preceded it — the earlier compositions stay unattributable, which is the honest outcome rather than a
backfilled guess.

Composed screenshots are keyed by it:

```
component-extraction/{runId}/composed/v{composeVersion}/page-{index}-{slug}.png
```

and the record carries the version it photographed, so the admin compares the two numbers and says
current or stale. Verified: recomposing 2424tulane left its record at v1 against a map at v2.

## What is still unversioned

The page map is still at one key per run — the **version names** a composition, it does not **keep**
one. An earlier composition's map is gone as soon as the next one is written, so the version answers
"is this the current composition?" and not "what did composition 1 contain?". That is the right
trade for a PoC: the screenshots that reference a version are immutable and survive, and keeping every
map would be storage for a question nobody has asked yet.

Worth knowing before anyone tries to diff two compositions of a run. They cannot, today.

## The general shape of it

This is the third time a derived artefact has been found sharing a key with the thing that replaces
it — after the capture screenshot keys and the reference-image file ids. The pattern is the same each
time: a key that identifies _what_ an artefact is about but not _which version_ of it, which is
invisible until something reruns.
