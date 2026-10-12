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

## Follow-up (2026-10-12, 10:50–11:11 UTC)

### The draft preview's 404: the cause was the panel's link, not the key

- **The website previews only when the URL says so.** A request starts preview only with
  `wb.preview=true` (or `wb.editing=true`). The SDK then loads the page named by `wb.type=page` and
  `wb.id`.
- **What the panel's link did:** it opened `/api/preview` with only the path and the tenant. The route
  turned draft mode on and redirected; the middleware saw draft mode without `wb.preview`, read that as
  leaving preview, cleared the cookie, and served the live page at the path. For a draft, that is a 404.
- **Confirmed in a fresh browser session:** the link with `wb.preview`, `wb.type`, `wb.id`, `wb.path`
  and `wb.tenant` renders the draft, with its page id in the document. That held for the hand-made draft
  and for a composed draft (the home page, with its content). **The website's own key reads drafts in
  the site tenant; no key change is needed.** The panel now builds that link (`4757ebc07a`).

### Items 2 and 3, fixed

- **"Publish site" until a publish has run.** "Publish again" follows only after one.
- **Drafts counted apart from unpublished pages.**
- **A defect in my first wording fix, found while measuring and fixed before this report.** During the
  window the inventory called the new approval's 16 components "no live page uses … kept because a draft
  names them". The inventory now reads the current approval and reports those components as "16 newly
  approved components go live at the next publish", apart from real leftovers (`ad436fe9a5`). Checked in
  the running admin in that state: 1 leftover (Media Gallery), 4 drafts, 16 pending.

### Item 4 measured: the live site between a re-approval and the next publish

Every read was taken more than 60 seconds after the change, and each state was confirmed by two reads
that agree.

| State                               | Bundles per page | `/`        | `/docs`    | `/learn`   |
| ----------------------------------- | ---------------- | ---------- | ---------- | ---------- |
| before the re-approval              | 17               | 283 KB     | 253 KB     | 241 KB     |
| **between re-approval and publish** | **33**           | **473 KB** | **443 KB** | **431 KB** |
| after the publish                   | 17               | 282 KB     | 252 KB     | 240 KB     |

- **The size of the window:** every live page carries both sets of components, **+67% to +79%** in
  bytes. That lasts from the moment the approval finishes (the website's component list refreshes within
  a minute) until the next publish. A team iterating spends most of its time in this window, so its live
  site is heaviest exactly while it works on it.
- **Publishing restores it:** 16 superseded copies were removed, and pages returned to their earlier
  size (about 1 KB smaller each).
- **How to close it, if it should be closed:** the window exists because components have no draft
  state, so a new approval is visible to the live site at once. **Draft and published states for
  components close it** (the platform change in the design). An approval that does not write into the
  live Library until publish would close it too, but would also stop the composed drafts rendering in
  preview, because they name components the Library would not yet hold. The design states the window
  as a property and gives the reasoning. Neither fix is built.

### Also seen

- **Names freed by a removal are reused.** After the second publish removed `Site Navigation Header`,
  the next approval took that name back without a suffix.
- **Root was unchanged throughout, at 266 / 99 / 1,509.**
