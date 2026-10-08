# Clustering: the depth-capped fingerprint, diagnosis and proposal

Diagnosis and proposal only; no code changed. Issue:
`ai-context/issues/a-depth-capped-fingerprint-sees-only-wrappers.md`.

## Diagnosis

`toTypeTree(node, maxDepth = 6)` fingerprints a section by its first six levels of tags. On the G5
template (four of the five demo sites) a section's first heading, paragraph or button sits at depth 8 or
9, so the fingerprint is the wrapper `div`s, and every section on a page shares it. Tree similarity is
then 1.00 between a photo carousel, an apply-now hero, a contact block and a tour form, and the
threshold (0.85, joined at `>=`) cannot separate them: with no token overlap at all they still score
0.85.

Clusters that mix unlike sections give one contract to all of them. That is upstream of the union text,
the per-copy leakage and the contracts carrying props a section does not have, all fixed downstream.

## The instrument

An offline replay over **every stored artifact of the eight runs** (baseline and check runs, all made
before any change): their cluster and segment artifacts and all 55 page trees, re-fingerprinting every
section and re-clustering at each run's stored threshold, with each run's theme manifest for the token
term.

- **Fidelity:** the current fingerprint reproduces the stored clusters exactly: 0 differing section
  pairs and 0 unmatched sections, across 347 sections and 97 clusters.
- **Should split:** check-run Tulane's carousel (`/` section 5) apart from the form and contact sections
  in its cluster.
- **Should stay together:** 146 member pairs in today's clusters whose texts largely match (Jaccard
  0.6 or more against the representative): the same block repeated on different pages, such as headers
  and footers.

## Candidates

| Fingerprint                                                             | Clusters (today 97) | Today's clusters split | Groups merging today's clusters | Should-stay pairs kept | Tulane carousel apart | Westland's five centred intros |
| ----------------------------------------------------------------------- | ------------------- | ---------------------- | ------------------------------- | ---------------------- | --------------------- | ------------------------------ |
| unwrap single-child wrappers, depth 6                                   | 140                 | 14                     | 3                               | 146/146                | yes                   | split into 3                   |
| fixed depth 12                                                          | 145                 | 14                     | 1                               | 146/146                | yes                   | split into 3                   |
| depth anchored at the first content element (its depth + 5, at least 6) | 146                 | 14                     | 2                               | 146/146                | yes                   | split into 3                   |
| unwrap, and tree compared by paths present                              | 119                 | 13                     | 16                              | 146/146                | yes                   | split into 2                   |
| **anchored, and tree compared by paths present**                        | **129**             | **12**                 | **8**                           | **146/146**            | **yes**               | **together**                   |

Every candidate fixes the case it was found on, and none breaks a pair of genuine copies.

**Counting splits one template.** The first three compare trees by path counts (weighted Jaccard). A
deeper fingerprint then counts paragraphs, so Westland's five centred intros (heading, rule,
paragraphs: one template) split by how many paragraphs each has. Comparing which paths are present
rather than how often fixes that while keeping the real splits.

**Seen in the crops, not only the counts** (contact sheets of member crops grouped by the new
fingerprint):

- Tulane "Every Day": today one cluster of 13 (a text panel, image-and-text features, a social strip, a
  contact form, four CTA banners, an FAQ). Unwrapped: the banners, the image-left features and the FAQ
  each group cleanly; a text panel still groups with image features, and the social strip with the
  form. A large improvement, not a complete one.
- Westland "Explore Fenway Forward": today one cluster of 11 (intro text, property tiles, floor-plan
  grid, map, gallery, mission, contact). The map, gallery, floor plans and tiles separate correctly.

## Proposal

**Anchor the fingerprint's depth at the section's first content element, and compare trees by the
paths present.** Measured above: the Tulane carousel separates from the forms, one template stays one
cluster, every genuine copy stays with its copies, and today's 97 clusters become 129.

## What it costs, decided before any code

- **More components.** 129 against 97 (+33%) on these runs: more to generate, review and promote.
  Each new contract fits its sections; that is the point, and the cost.
- **Signatures change for most sections.** 262 of 347 sections fingerprint differently, so their
  signatures change. Overrides are keyed by signature; none of these eight jobs has any, but other jobs
  may, and whether the W8 reattachment finds them across a signature change has to be checked, not
  assumed.
- **Stored runs keep today's clusters** until Cluster is re-run on them, and re-clustering a run
  re-runs Classify, Plan and Generate on it (with Plan's prop variance, `VERIFYING.md`) and renames its
  components. Existing runs and new runs will differ until then. Written down now so nobody trips over
  it.
- **Merges unverified.** The 8 groups that merge parts of today's clusters look like the same block
  re-forming (a CTA banner that sits in three clusters today), but none has been checked in the crops.
- **Residual mixing.** Some groups still mix unlike sections (seen under unwrap; to be checked under
  the proposal).

## Verification, if approved

1. Contact sheets for every split and every merge under the proposal, reviewed before code ships.
2. The replay as acceptance: fidelity, the should-split and should-stay sets, and cluster counts per run.
3. One demo site re-run end to end, measuring what the clustering fix is for: props a contract carries
   that its representative does not have (28 across 95 components today), and other-copy content in the
   generated components.
4. Then the three content prohibitions, unmeasured until now, on the re-clustered runs.

## Timing

The demo is on 16 October. Re-clustering the demo runs re-runs everything downstream of Cluster on
them, and renames their components. Whether that happens before the demo or after it is a decision
to make before step 3.

## Contact sheets and the one tuning round (2026-10-08)

**Contact sheets, every split and merge under the proposal.**

- 12 splits: 6 right, 3 mostly right (some mixing left), 3 wrong. The three wrong ones are over-splits:
  a home-page section split from same-design copies with less text (Park City's Property Description,
  Tulane's "In New Orleans" on both runs).
- 8 merges: 2 right, 4 mostly right, 2 wrong (a "please update your browser" widget fallback with a
  photo hero on thevibe; a laundry feature with a photo grid on Westland). The two wrong merges are new:
  those sections sit in different clusters today.
- **The over-split is the content-length sensitivity surviving in smaller form.** Comparing which paths
  are present was meant to remove it, and did for Westland's centred intros, but a section with extra
  element types (a list, a link) still separates from copies without them. Recorded, not fixed.

**One bounded tuning round, aimed at the two wrong merges only.** Hypothesis: sparse sections merge on a
few shared paths. Rule: a section with fewer than 3 content elements joins a group only if its paths
are identical. Result: one wrong merge cleared, the other remained; a right merge (thevibe's two
centred intros) was lost; Westland's five centred intros split again. **It did not clear the merges.**
As agreed, no second rule: the proposal ships as it was (option 1), with its known errors on these runs
written down: 2 wrong merges, 3 over-splits.

**Override reattachment.** Overrides match by exact signature; 262 of 347 sections get a new one. In
this environment, 22 cluster corrections on two jobs (20 on "Validation — webiny.com") would stop
reattaching. Built alongside the change: Cluster records each member's signature under the old
fingerprint as well, and reattachment accepts either.
