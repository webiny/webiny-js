# Why Park City's greys rendered blue

Diagnosis only, no fix. Run `6aca03006edf6700023d80ce#0001` ("ParkCity - Take 3"), read through Generate.
No model spend: every value below comes from the stored prompts, the Generate and Cluster artifacts, the
job's theme and the captured pages.

## The prompts said blue; the model did as told

These are View prompt's colour lines, and what the generated CSS did with them.

| Component                       | The prompt's background line                                           | Generated CSS                                              |
| ------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------- |
| Site Navigation Header          | `background #f7f7f9 — use var(--wby-color-feedback-info-background)`   | uses `feedback-info-background`                            |
| Apartment Intro Hero            | same                                                                   | uses `feedback-info-background`                            |
| Contact Us Form                 | same                                                                   | uses `feedback-info-background`                            |
| Accessibility Statement         | same (in Cluster's bindings; not opened in the admin)                  | not checked                                                |
| Site Footer                     | `background #f2f2f2 — use var(--wby-color-feedback-danger-background)` | uses `feedback-danger-background`                          |
| Hero Banner (top carousel)      | `background #363f54 — use var(--wby-color-surface-sunken)`             | `surface-sunken`, plus its own `rgba(0,0,0,.45)` darkening |
| Hero Banner ("Park City Place") | no background line at all; only white text and the button              | photo, no overlay                                          |

On this theme, `feedback.info.background` is `#EFF6FF` (pale blue) and `feedback.danger.background` is
`#FEF2F2` (pale pink). Every variable the prompts named is in the CSS, with the measured hex only as its
fallback. **The prompt said blue, and the model followed it.** The binding was made upstream, in Cluster:
its stored `resolvedColours` already carry these tokens.

## 1. A token for the greys exists. The matcher cannot read it

- **The theme has the header grey.** Extraction set `color.surface.raised` to `#f7f7f9f2`: the site's
  `#f7f7f9` written with an alpha byte (95% opaque).
- **The matcher only reads 6-digit hex.** `themeColourRoles` (`cluster/resolvedColours.ts`) accepts a
  theme colour only if it matches `^#[0-9a-f]{6}$`. `#f7f7f9f2` has 8 digits, so `surface.raised` is never
  a candidate.
- **What is left wins.** Among the remaining "background" candidates, the nearest to `#f7f7f9` is
  `feedback.info.background` (distance 10, against a threshold of 24). `surface.page` is 12.8 away. For
  the footer's `#f2f2f2`, the nearest is `feedback.danger.background` (12.0).
- **The theme-fit figure inherits it.** Colours fit at **57 of 57 (100%)** on this run, because the fit
  counts a colour as fitted whenever it has a token of an allowed family. The "26 of 206 colours with no
  token" is the earlier cross-site figure quoted in `themeFit.ts`, not this run's. This run's figure is
  wrong the same way the bindings are.

## 2. Yes, a crossing the exclusion does not cover

- **Feedback colours count as surfaces.** `familyOf` classes any path containing `background` as
  "surface", so `color.feedback.info.background` is a surface. A page background bound to it is surface
  → surface to the exclusion, and passes both the prompt's crossing check and the validator.
- **The same rule makes them preferred.** `FAMILY.background` (`/surface|background/`) puts
  `feedback.*.background` and `action.*.background` in the preferred set for a background. That is why a
  status colour beat `surface.page` here.
- **The real crossing is background → status colour**, which neither list names.

## 3. The hero overlay is not measured at all

- **The overlay is a pseudo-element.** The "Park City Place" hero in the source is a photo under a
  slate wash. The site draws that wash with
  `.row-37554295::before { background-color: #363f54; opacity: .9 }`, a pseudo-element.
- **Capture records no pseudo-elements.** It also records no `opacity`. In the hero's box the tree holds
  only the section `div`, carrying the photo as its CSS background image over a terracotta `#a65f46` it
  hides, and the button.
- **The section reports neither layer.** It reports neither the photo's colour nor the overlay. Its
  measured colours are the white text and the button, so Generate had no colour for the wash and
  rendered the bare photo.
- **This is the opposite case to the translucency work.** That handled a translucent image over a
  colour; this is a translucent colour over an image, drawn on a layer Capture never sees. The same
  `::before` overlays are on other rows of this page (opacity 0.9 and 0.05).
- **The top carousel hero is a different case.** Capture records slate `#363f54` painted under its
  three photos and reports it at the section's full area, though the photos cover it, so the prompt
  names it as the background. Its own left-side darkening is not measured either; the model drew one
  from the crop.

## "Our ideal location": confirmed the filed wrong-slot class, not chased

- **On the source,** the phrase is an inline link inside the Neighborhood/Location Highlight paragraph.
- **Plan made it a standalone `imageLink` prop** (Link), with the observed values "our ideal location",
  "your new home" and "in-home features". It renders again as its own element below the paragraph.
- **It is the same family as the doubled copyright** (`a-fifth-of-derived-props-show-another-slots-text.md`).

## Where each defect sits

| Defect                                  | Where                                                    | Stage   |
| --------------------------------------- | -------------------------------------------------------- | ------- |
| 8-digit hex theme colours never matched | `themeColourRoles`, `cluster/resolvedColours.ts`         | Cluster |
| Status colours treated as surfaces      | `FAMILY.background` (matcher) and `familyOf` (exclusion) | Cluster |
| Theme fit counts those as fitted        | `themeFit.ts`, via `crossesFamily`                       | Plan    |
| Pseudo-element overlays not captured    | Capture's tree (no `::before`/`::after`, no `opacity`)   | Capture |
| Inline link made a standalone prop      | Plan (filed)                                             | Plan    |
