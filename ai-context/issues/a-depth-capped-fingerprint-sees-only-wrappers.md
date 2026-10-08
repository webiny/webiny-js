# A depth-capped fingerprint sees only wrappers, so unlike sections cluster together

> **Package:** `@webiny/api-component-extraction` (`features/stages/cluster/sectionShape.ts`,
> `toTypeTree`)
> **Severity:** high. Clustering is upstream of defects that have been fixed downstream: a component
> whose cluster mixes unlike sections gets a contract built for all of them, and every later stage
> faithfully carries props the section it reproduces does not have.
> **Status:** open. Found during the #1/#7 work on values merged across copies (2026-10-08,
> `packages/api-component-extraction/scripts/baseline/reports/2026-10-07/generate-prompt-diagnosis.md`).

## Read this before the fix list

Several passes have fixed symptoms of clusters that should not have been clusters: the union of every
copy's text in Plan's contract, other copies' values leaking into Generate's examples and defaults
(#2, #1/#7), and contracts carrying props the section does not have. Those fixes were right, and the
leakage was real: a migrated site was showing another property's address and phone number. What
changes is what the residual defect is. Where a cluster mixes unlike sections, the fixes stop the
wrong content reaching the component; they do not make the contract fit the section. A list of those
fixes is not a list of this problem solved.

## What happened

The check run's 2424 Tulane "Hero Section" cluster has 7 members. Its representative, on the home
page, is a photo carousel: an eyebrow, a heading, three circular photographs and two arrows. The other
six are an apply-now hero, an apply-now banner, a contact block, a contact form, a tour hero and a
tour form. Plan built one contract for all seven, so the carousel's contract carries an address, a
phone number, two CTAs and a lead form. Generate showed it other pages' values for those props, and
the component shipped another page's address, phone number and form text. The #1/#7 fix
(`95eb1116db`) stops those values reaching the component. It does not remove the props: the
contract still has them, empty.

## Why the threshold could not have separated them

Member similarity to the representative, computed with `sectionSimilarity` on the captured trees. The
token term is bounded rather than measured, since the theme manifest is not readable from a script:
the range is the score with token overlap 0 to 1.

| Member                                                                | Similarity to the carousel |
| --------------------------------------------------------------------- | -------------------------- |
| apply-now hero, apply-now banner, contact block, tour hero, tour form | 0.85–1.00                  |
| contact form                                                          | 0.775–0.925                |

The threshold is 0.85, and a member joins at `>=`. Five of the six score at least 0.85 even with no
token overlap at all, so no threshold up to 0.85 could separate them. Raising it above 0.85 splits them
only by also splitting every pair that differs in tokens alone. **The threshold was not the problem:
structurally, as the fingerprint describes them, these sections are identical.** Tree similarity is
1.00 for six of seven.

The reason is `toTypeTree(node, maxDepth = 6)`. In every member, the first content element (a
heading, paragraph or button) is at depth 8 or 9; the trees go to depth 13–22. Six levels in, there
is nothing but `div`s. The fingerprint is the wrapper stack, and every section on a G5 page shares it.

## Exposure

Representatives whose first content element sits deeper than the cap, over the 95 planned components
of the baseline and check runs:

| Site                                 | Components | Beyond depth 6 |
| ------------------------------------ | ---------- | -------------- |
| 2424 Tulane (baseline / check run)   | 11 / 11    | 6 / 7          |
| 71 Westland                          | 10         | 5              |
| Park City Place                      | 8          | 5              |
| Freehill (baseline / check / check4) | 8 / 8 / 8  | 3 / 3 / 3      |
| thevibe                              | 31         | 2              |

34 of 95. This is exposure, not a count of wrong groupings: a wrapper-only fingerprint still groups on
geometry and tokens, so some of these grouped correctly. The G5 template (four of the five sites) is
where it concentrates. thevibe uses a different template and is barely affected.

## Direction, not decided

Fingerprint from the first level that carries content, not from the section root: skip single-child
wrapper chains before applying the depth cap, or measure depth from the shallowest content element.
Either changes every signature, so overrides keyed by signature would need reattaching, and the
cluster count of every run would move. Verify it as a replay over every run's captured trees, and
report how each cluster splits and merges, before running anything.

Related: [an unresolved theme makes every section look alike](./an-unresolved-theme-makes-every-section-look-alike.md),
which inflated similarity from the token term. This one inflates it from the tree term.
