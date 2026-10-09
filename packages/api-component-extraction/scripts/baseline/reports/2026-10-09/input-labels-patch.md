# Input labels: the demo runs' page trees were patched

**These runs' stored page trees no longer match what their capture produced.** Read this before
comparing them against the capture code of their day. Diagnosis: `input-labels-diagnosis.md`.

## What was done (2026-10-09)

A new kind of operation here: everything before re-derived from source or replayed offline; this edits
stored capture output.

| Run                                               | Page   | Change                                                      |
| ------------------------------------------------- | ------ | ----------------------------------------------------------- |
| 71Westland Baseline 2 (`6ac4f6bd…#0001`)          | page-9 | the contact form's inputs typed; its submit labelled "Send" |
| FreehillStreetLofts Baseline 2 (`6ac50186…#0001`) | page-0 | the contact form's inputs typed; its submit labelled "Send" |

- **Source:** each page's stored `dom.html.gz`, from the same capture as its tree.
- **Backups:** the original beside each patched tree, `capture/page-N/tree.pre-input-label-patch.json`.
- **Record next to the trees:** `capture/INPUT-LABEL-PATCH.json` in each run, naming what changed and why.
- **How inputs were matched:** form by form. A page carries inputs the tree never saw (cookie and widget
  chrome hidden by CSS), so a labelled input's `<form>` is matched to the one tree form with the same
  number of inputs, and mapped by position. Anything ambiguous was left alone and listed: two hidden
  Freehill forms that are not in the tree at all.
- **Validated first** on the check run, re-captured with the fix: its fresh trees stripped of the new
  fields and patched from the same capture's HTML agree with the native capture on 3 of 3 labelled
  inputs, 0 disagreeing, 0 left unpatched.

## Plan: re-bound, not re-planned

`componentExtractionRegeneratePlan(rebind: true)`: no model call, the contract kept, observed values
bound again from the patched sections. What moved, compared against the stored plan with keys sorted:

| Component                           | Changed                                                                                        |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| Westland Contact Form               | `submitButton`: none → "Send"; `unboundImages`: absent → `[]`                                  |
| Freehill Contact Form with Map View | `submitButton`: "Please Call (346) 489-6939" (`tel:`) → "Send"; `unboundImages`: absent → `[]` |

Nothing else in either plan moved: same props, names, types, token bindings, texts. (`unboundImages`
postdates these plans; re-binding computes it, and there are none.) Freehill's `privacyLink` still
holds the phone link: an existing binder fault the re-bind reproduces and does not cause.

Re-applying Plan marked Generate, Assemble and Promote stale on both runs.

## Generate: regenerated, and what else moved

Both forms regenerated (medium effort, the current prompt). A fresh generation differs beyond what
changed in the plan, so each was compared with the stored component it replaced: rendered with its own
defaults, its section's own texts looked for in the render.

**Westland Contact Form: only what was meant to change.** Its "Submit" link is now a "Send" button. The
same 17 of 22 section texts are present before and after; nothing lost. The office hours are one line
each instead of two (same content). The stored component it replaced had failed text preservation
("Message (1750 character limit)" missing); the new one passes every check.

**Freehill Contact Form with Map View: the button is fixed; the rest of the section moved.** The four
"Please Call" phone links are gone from the form, and it submits with "Send". Beyond that, a different
half of an over-large section came out:

- **Better:** the form itself (labelled fields, a privacy-policy link, the Streets/Satellite toggle).
- **Worse:** the floor-plan card lost its "Floor plans coming soon / Call for Details" panel and its
  "Please Call" button (on the site, those calls to action are real; only the one bound as the form's
  submit was wrong), and is now an empty box.
- **Section texts:** lost "Contact Us", "First Name", the consent sentence, "Select Map View", "Meet
  Your Match"; gained "privacy policy", "Streets", "Satellite", "Reset Filters" and the icon-font names
  "event", "refresh", "add" (in the site's captured text; they render as words without the font).
  18 of 37 present after, 17 before: both versions render about half the section.
- Text preservation passed on both, so it does not check all of these.

The deeper problem is the component: one section holding a contact form, a map and a floor-plan list.
Neither generation renders all of it. That is clustering and segmentation, not the input labels.

Generate, Assemble and Promote remain marked stale on both runs.
