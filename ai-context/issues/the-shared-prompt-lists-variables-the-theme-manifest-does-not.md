# The shared component prompt lists variables the theme manifest does not

> **Package:** `@webiny/remote-components` (`buildComponentPrompt`, `tokenCatalogSection.ts`) and
> `@webiny/theme-common` (`getTokenCatalog`, `generateManifestArtifact`, `generateCssArtifact`)
> **Severity:** medium for every consumer that validates against the manifest; it cost component
> extraction a retry on every component (see below).
> **Status:** open. Fixed for component extraction only, by its own override of the shared prompt.
> Found 2026-10-08 (`packages/api-component-extraction/scripts/baseline/reports/2026-10-08/spacing-diagnosis.md`).

## What happens

Three lists describe which theme variables exist, and they disagree:

| List                                 | Variables                                    | Used by                                              |
| ------------------------------------ | -------------------------------------------- | ---------------------------------------------------- |
| `getTokenCatalog()`                  | 142: semantic slots and the primitive scales | the shared component prompt's "Theme Tokens" section |
| `generateCssArtifact` (`tokens.css`) | 139-141 of the 142, primitives included      | the browser                                          |
| `generateManifestArtifact`           | 110-111: semantic slots only                 | anything that validates or binds against a theme     |

The prompt introduces the catalog with "The active theme defines these CSS custom properties on
`:root` ... Do not invent other `--wby-` names", and its worked examples use the primitive spacing
scale: 13 declarations of `--wby-space-xs` to `--wby-space-3xl`, one of `--wby-space-gap`.

A consumer that validates generated CSS against the manifest rejects all 29-30 primitives: spacing,
text size, radius, shadow and border width. A model that follows the prompt fails that validation.

## Who it hits

Component extraction: in 9 of 9 measured first attempts, Generate used the catalog's spacing
primitives and failed its manifest-based token check. Every component paid a retry, about half of
Generate's spend. All 274 rejected names were in the catalog; none was invented.

The next consumer of the shared prompt that validates against a manifest meets the same contradiction,
and nothing in either list says why its components fail.

## Two further mismatches

- The catalog lists variables no theme defines (`--wby-shadow-none`, `--wby-shadow-sticky`, and on
  some themes `--wby-shadow-md`).
- The primitives' values in `tokens.css` are library defaults on every theme (`--wby-space-md: 1rem`).
  A site's measured spacing is in the semantic slots (`--wby-space-gap` 14-30px across five extracted
  themes). So the prompt's examples steer components towards library spacing over the site's.

## Not decided here

Whether primitives belong in the manifest, or out of the catalog the shared prompt shows, is a
platform question. Either way the prompt's examples should use what the prompt's consumers accept.
Extraction's override replaces the catalog with the manifest's vocabulary for its own calls.
