# Site tenant from the start: rehearsal (2026-10-12)

Job "Rehearsal — site tenant (2026-10-12)" (webiny.com, 3 pages), created after the deploy, so new-style.
Site tenant `rehearsalsitetenant20261484b`. Driven in the running admin where a button exists, through the
API where none does. Predictions: `scratchpad/rehearsal-st/PREDICTIONS-rehearsal.md`. Revert procedure:
`site-tenant-revert-procedure.md`.

## Root, throughout

**266 components, 99 pages, 1,509 files: unchanged by stage 9, by every preview, and by every publish.**
Stages 1–8 added 20 files (captured images and Generate's reference crops), as decided.

## The site tenant

| After                                    | Components | Pages                                             | In the bin | Files |
| ---------------------------------------- | ---------- | ------------------------------------------------- | ---------- | ----- |
| stage 9                                  | 16         | 0                                                 | 0          | 0     |
| first preview                            | 16         | 3 drafts                                          | 0          | 14    |
| second preview (R1)                      | 16         | 3 drafts                                          | 3          | 14    |
| first publish (R3)                       | 16         | 3 published                                       | 6          | 14    |
| re-approval (R5)                         | 32         | 3 published                                       | 6          | 14    |
| hand-made draft added (R6), preview (R7) | 32         | 3 published, 3 composed drafts, 1 hand-made draft | 6          | 14    |
| second publish (R8)                      | **17**     | 3 published, 1 hand-made draft                    | 12         | 14    |

## As predicted

- **R1:** a second preview moved the first preview's 3 drafts to the bin. The image step reads "14 image
  file(s) in the site's File Manager, for 19 captured image(s)" (it used to say 19).
- **R3:** the publish published 3 pages and binned the 3 drafts; "16 component(s) approved into this
  tenant; nothing superseded to remove".
- **R4 and R9:** the site serves the published pages, confirmed by two reads that agree.
- **R5:** the gate read "16 names already taken in the Library (16 by this run's earlier approval)", which
  is the site's Library; root holds none of those names. Re-approving added 16 copies in the site; the
  live site kept rendering the old ones.
- **R8, the draft check:** the publish removed **15** superseded copies and **kept the old "Media
  Gallery", which only the hand-made draft names**. The inventory shows it as the one component no live
  page uses. Removal counts drafts, as designed and as unit-tested.
- **The composed pages panel** shows the drafts with "Preview" and no "Edit" before a publish, and the
  published pages with site links ("Open") after.

## Not predicted

1. **The draft preview shows the website's 404 (R2).** The panel's "Preview" opens
   `/api/preview?wb.path=…&wb.tenant=…`. Adding the page id (`wb.type=page&wb.id=…`, as the SDK's
   preview expects) still gives 404. The website reads with a single key, root's website-read key, which
   most likely cannot read drafts.
   - **Not quickly fixable:** it needs a key allowed to read drafts and a website redeploy, outside this
     repo, on the website the demo uses.
   - **Effect:** a new-style job's drafts cannot be looked at in the browser before publishing. Their
     counts, signals and link checks are in the panel.
2. **"Publish again" on a site never published.** The site record now exists from stage 9, and the card
   reads any record as "published before".
3. **The inventory calls the hand-made draft "an unpublished page from earlier builds".** It counts every
   page that is not published.
4. **Between a re-approval and the next publish, the live site carries both sets.** The site's Library
   holds the old and new copies, and every page ships every bundle in its tenant. This follows from the
   design, and publishing removes them. It was not measured: the read after the re-approval was inside the
   60-second component cache and still showed 16 bundles.
5. **A component kept for a draft ships with every live page** (17 bundles, not 16). Expected from the
   design; named here because it is visible.
6. **First reads after each publish served the previous state** (a 404 on `/` before the first publish
   took). Two later reads agreed each time.
