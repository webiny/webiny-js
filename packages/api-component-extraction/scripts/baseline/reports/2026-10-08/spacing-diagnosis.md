# Spacing variables: diagnosis

Diagnosis only; nothing is fixed. The defect: in the ablation's base arm, 9 of 9 first attempts failed
on "unknown token variable: --wby-space-*", so every component paid at least one retry (mean 2.00
attempts), roughly half of Generate's spend.

## The hypothesis, tested

The hypothesis was that the model writes `--wby-space-sm/md/lg` because that is the conventional
scale, and these themes name spacing `gap`, `section` and `container-padding` instead: a convention
applied where it does not fit.

It is half right. The convention is real, but the model did not bring it: the prompt did.

- **The shared system prompt's token catalog lists the t-shirt scale as defined.** Its "Theme Tokens"
  section, built from `getTokenCatalog()` in `@webiny/theme-common`, lists `--wby-space-3xs` through
  `--wby-space-3xl` beside the five semantic spacing variables, under "The active theme defines these
  CSS custom properties on `:root`... Do not invent other `--wby-` names."
- **Its worked examples use them.** Thirteen declarations across the examples
  (`padding: var(--wby-space-3xl, 80px) var(--wby-space-lg, 24px)` and so on), and one use of
  `--wby-space-gap`.
- **Nothing was invented.** All 274 rejected names on first attempts across the 54 runs are in the
  catalog: `--wby-space-lg` 48, `-sm` 42, `-md` 42, `-xl` 41, `-2xl` 40, `-xs` 27, the rest small, two
  `--wby-text-*`.

## Two layers disagree about what exists

| Layer                                                       | What it holds                                              | Used by                                              |
| ----------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------- |
| Catalog (`getTokenCatalog`)                                 | 142 variables: the semantic slots and the primitive scales | the shared system prompt                             |
| Runtime CSS (`generateCssArtifact`, served as `tokens.css`) | 139-141 of the 142, primitives included                    | the browser                                          |
| Manifest (`generateManifestArtifact`)                       | 110-111: the semantic slots only                           | extraction's validator and its "Use ONLY these" list |

29-30 variables per theme are defined at runtime but absent from the manifest: the whole primitive
scale for space, text size, radius, shadow and border width. Extraction rejects all of them. A few
catalog entries are defined by no theme (`--wby-shadow-none`, `-sticky`, `-md`); rejecting those is
correct.

So the first attempt was not wrong about what exists. It used variables the system prompt told it
exist, which `tokens.css` defines, and the validator rejected them against a narrower list.

## What it is given instead

The validator's rejection is right about intent, though. The primitives carry **library defaults**,
not the site's values: `--wby-space-md` is 1rem and `--wby-space-lg` 1.5rem on every theme. The site's
spacing is in the five semantic slots, which theme extraction measured: `--wby-space-gap` is 20px on
thevibe, 14px on Westland, 20px on Park City, 17px on Freehill, 30px on Tulane, and
`--wby-space-container-padding` ranges from 20px to 50px. A component that keeps `--wby-space-lg` spaces
itself like the library, not like the site.

The same gap as colour and type:

- **No measured spacing reaches the model.** Capture records `paddingTop`, `paddingLeft`, `marginTop`
  and `gap` on every element. Nothing after Capture reads them. The layout lines give element
  positions and sizes, from which spacing could be inferred, but no padding or gap values, and no
  variable for them.
- **The variables are listed without saying what each is for.** The extraction prompt's "Use ONLY
  these" line is 110 bare names. The semantic slots' descriptions ("the gap between items in a stack
  or group") exist only in the system prompt's catalog, next to the primitives with no descriptions.
- **The retry is where the vocabulary gets corrected.** The validator's feedback lists the allowed
  variables, and the second attempt swaps the primitives for semantic slots or literal values. That
  correction is what every component pays for.

## Line 5's second clause

"Use ONLY these theme CSS variables — any other var(--wby-*) fails validation; for anything without a
suitable variable, use a plain CSS value." It contradicts the system prompt's catalog, which says the
primitives exist, and the model follows the catalog: first attempts fail at the same rate with the
line and without it. Removing it raised hex literals, failed runs and cost in the ablation. This
diagnosis does not explain that; it does show the line sits on the faultline between the two layers,
so what it does should be measured after the layers agree, not before.

## Directions, for a decision

1. **Make the layers agree for extraction.** In extraction's override of the shared prompt, give the
   token catalog as the manifest's vocabulary (the semantic slots with what each is for, and the
   site's measured value), and leave out the worked examples' primitive spacing. The model is then
   told what the validator accepts.
2. **Give it the measured spacing**, as with colour and type: the section's dominant gaps and paddings
   from the captured styles, each mapped to the semantic slot it matches, or a px value where none
   does.
3. **Accept runtime-defined primitives in the validator.** This removes the false failures and the
   retry at once, but endorses library-default spacing over the site's, so it is not recommended
   alone.

Recommended: 1 and 2 together, verified by first-attempt failure rate and attempts in dry-run mode,
plus a spacing-fidelity check against the captured values so the fix is not only cheaper but closer.

Upstream of extraction: the catalog lists 142 variables as defined on `:root` for every caller of the
shared prompt, while the manifest that describes a theme lists 110. Whether primitives belong in the
manifest is a platform question, not settled here.
