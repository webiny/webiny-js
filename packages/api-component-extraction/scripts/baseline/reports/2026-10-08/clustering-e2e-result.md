# Clustering fix, end to end on the check run: result

Predictions: `clustering-e2e-predictions.md`, written before the run. Fix: `9948639d4a`. Check-run 2424
Tulane, Cluster through Generate on the deployed fix. Demo runs untouched.

| Measure                                                             | Before  | Predicted            | After                             |
| ------------------------------------------------------------------- | ------- | -------------------- | --------------------------------- |
| Clusters                                                            | 11      | 21 (10 multi-member) | **21 (10 multi-member)**          |
| Members carrying a legacy signature                                 | n/a     | every member         | **60 of 60**                      |
| Text props a contract carries that its representative does not have | 16      | 4 or fewer           | **4**                             |
| The carousel's contract: address, phone or lead-form props          | present | absent               | **absent** (a cluster of one)     |
| Other-copy strings in the generated components (metadata excluded)  |         | 0                    | **0**, over the 18 that generated |

Every prediction held. The 4 remaining props are where the contact sheet said they would be: 3 on
"Contact Form", the partly-right merge of a contact form with two tabbed panels (`sidebarHeading`,
`sidebarLinks`, `featureList` come from the panels), and 1 on "Intro/Description Section".

The carousel's contract still has two CTA props (`primaryCta`, `secondaryCta`); its crop shows arrows,
not buttons. With one member they carry no values, so Generate is told to leave them empty.

## Not about clustering: three model calls timed out

18 of 21 components generated. Site Header with CTA Links (11 members), Footer with address and office
hours (11 members) and Floor Plan Filter failed on every attempt with "The operation was aborted due to
timeout". A fourth generated but failed validation. Their signatures are new, so there is no earlier log
for the same component to compare; whether the timeouts are new (prompt length, model latency on the
day) or were always there for these large components is not established by this run, and is filed for
its own look rather than attributed here.

## Where things stand

- The fix is live for new Cluster runs. Stored runs, including the demo sites, keep their clusters until
  Cluster is re-run on them; that waits until after the demo.
- Known errors on the replayed runs: 2 wrong merges, 3 over-splits (contact sheets in the proposal).
- The three content prohibitions can now be measured on this re-clustered run.
