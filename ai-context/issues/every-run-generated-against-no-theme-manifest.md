# Every run generated against no theme manifest, and the token validator recorded a pass

> **Package:** `@webiny/api-component-extraction` (`themeManifest`, `PlanHandler`,
> `componentGeneration`)
> **Severity:** high — on all four demo sites, **every** component reports "theme manifest
> unavailable; token binding not checked", **every** Plan contract holds **zero** token bindings, and
> the `--wby-*` variables in the generated CSS were never checked against anything. One of the three
> validators has never run on any measured component.
> **Status:** open.

## What happens

Each job pins a theme by `{ themeEntryId, themeVersion }`. `ThemeManifestResolver` turns that into the
generation manifest — the bindable slot list with each slot's CSS variables and resolved values — and
fails when the theme has no resolved snapshot:

> A draft that was never published has no frozen snapshot — the manifest is a projection of that
> snapshot, so there is nothing to bind against yet.

**The four demo jobs are pinned to themes that are drafts.** Park city Palace's theme
(`6ab119a704782f0002001bd6`) has one revision, `status=draft`. So the resolve fails on every run.

Both callers are written to carry on without it, and both do so quietly:

- `PlanHandler` logs at **info** — "Planning without token bindings" — and proposes a contract with
  no `tokenBindings`.
- `componentGeneration` omits the allowed-variable list from the prompt, and then records the token
  validator as **passed**:

```ts
tokenBinding: manifestAvailable
  ? validateTokenBinding(output.css, validVariables)
  : { passed: true, failures: ["theme manifest unavailable; token binding not checked"] };
```

## Measured

| site             | components reporting "manifest unavailable" | components token-checked | plan token bindings |
| ---------------- | ------------------------------------------: | -----------------------: | ------------------: |
| Park city Palace |                                           7 |                        0 |                   0 |
| 2424 Tulane      |                                          12 |                        0 |                   0 |
| 71 Westland      |                                           8 |                        0 |                   0 |
| Freehill         |                                           6 |                        0 |                   0 |

Every component, every site, every run measured.

## What it means for what has been believed about the pipeline

- **The "hard constraint" was never applied.** The generation prompt's "Use ONLY these theme CSS
  variables — any other `var(--wby-*)` fails validation" is built from the manifest. With no manifest
  there is no list, so the model was never given one and never failed for inventing one.
- **The `--wby-*` variables in the generated CSS are the model's own.** Park city Palace's components
  reference 52 distinct ones, including `--wby-type-heading-1-size` and `--wby-color-text-primary`.
  Several are plausible and some may not exist in the theme at all. Nothing has checked.
- **Three validators were reported; two ran.** Every "Token binding ✓" pill on the Generate view, for
  every component on every site, is a validator that did not execute.

## It is the pattern again

This is `an-absent-input-is-an-error-not-an-empty-result`, and the sixth instance. The result is
shaped like the success case: `passed: true` with an explanatory note nobody reads, and a `failures`
array that is the only place the truth appears. A reviewer scanning the column sees a green pill.

Degrading gracefully is right here — a run against an unpublished theme should still produce
components. Recording the degradation as a **pass** is not. The outcome wanted is a third state, or
at minimum an error-level log and a validator result that does not read as a success.

## What it blocks

The proportion fix is specified as "fidelity, with the theme as the vocabulary": each measured type
size carries the typography role nearest it, and a plain value is the fallback where none is near. On
these runs **every** size falls back, because there are no roles at all.

That is also a correction worth keeping: the first reading of "0 of 16 measured sizes have a theme
token" was that theme extraction had missed the site's type scale. It had not. There is no manifest,
so there is no scale to miss — a count that was accurate and pointed at the wrong mechanism, which is
exactly the shape recorded in `a-component-must-contain-every-section-it-clusters-with`.
