# Clustering fix, end to end on the check run: predictions, named before the run

Run: check-run 2424 Tulane (`6ac5f9a142f41b00026d31f9#0001`), not a demo site. Cluster, Classify, Plan
and Generate re-run on the deployed fix (`9948639d4a`). The demo runs are not touched until after the
demo.

| Measure                                                             | Before (stored)                                                               | Predicted                                          |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------- |
| Clusters                                                            | 11                                                                            | 21 (10 with more than one member), from the replay |
| Text props a contract carries that its representative does not have | 16 (Hero Section 11, Intro/Location 1, Intro/Hero 2, Neighborhood Overview 2) | 4 or fewer                                         |
| The carousel's contract: address, phone or lead-form props          | present                                                                       | absent                                             |
| Other-copy strings in the generated components (metadata excluded)  | see the #1/#7 note                                                            | 0                                                  |
| Legacy signatures recorded on every member                          | n/a                                                                           | every member                                       |

Known from the contact sheets for this run, so not counted as surprises: one over-split (the home-page
"In New Orleans" panel apart from two copies) and two partly-right merges (a CTA banner with a
statement; a contact form with two tabbed panels).

Plan re-proposes props on every run (`VERIFYING.md`), so prop names will differ from the stored plan;
the measure counts props without a representative value, not names.
