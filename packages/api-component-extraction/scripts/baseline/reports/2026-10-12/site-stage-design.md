# Stage 10, the site: three decisions, then the shape

Design only; no code. It reports on the three decisions first, then what is reused and what is new,
whether this is a stage, and the cost.

## Two premises of the brief that the code does not bear out

- **Compose does not run at Assemble.** `ComposePagesService` refuses to run without Promote ("a page
  addresses a component by the name it was promoted under"), and Promote is stage 9. Composition runs
  on demand from the composed pages view, after Promote, in the extraction tenant. The site build then
  runs it a second time, inside the site's tenant. So the pages stage 10 would preview exist after
  stage 9, not stage 8, and only once someone has pressed Compose.
- **Assemble has a view.** `AssembleView` is the Assemble stage's panel: the instance list per page, in
  document order, with prop values. What has no home is the composed pages panel, which replaces the
  stage view when its button is pressed.

Neither changes the proposal. Both change decision 3.

## Decision 1: what a partial page selection means for components

### What the site build does today

- **Components: all promoted, merged.** `BuildSiteTask` reads every component Promote recorded and
  creates or updates each one in the site's Library by name. It never deletes one, so components
  already accumulate across builds.
- **Pages: all assembled, replaced.** Composition creates a new page for every assembled page and then
  unpublishes every earlier page in that tenant that is not in the new set. That covers this run's
  previous composition and every other run of the job. A second build replaces the first.
- **Links follow the pages composed together.** A link becomes a relative path only when its target
  was created in the same composition. A link to anything else stays absolute to the source site and is
  reported as `link.unmigrated`.

### What a partial selection would do, unchanged

Build 1 promotes pages A, B and C, and their links to D–H stay absolute. Build 2 promotes D and E, and
the retirement step unpublishes A, B and C, because they are not in the new set. The site loses three
pages with no error. **Replacing pages is wrong once a selection exists.**

### Recommendation: the site's selection is a union, and every build recomposes all of it

- The site record keeps the selected page paths. A build adds to them. Removing a page is a separate,
  explicit action.
- Every build composes the whole union, not only the newly added pages.
  - Links between selected pages become relative, including links from earlier pages to pages added
    later.
  - Retirement stays correct as it is: it unpublishes the superseded copies of the same pages, not
    other pages.
- **Components: the union's needs**, meaning the promoted components that the selected pages' instances
  use. That is the existing create-or-update, given a filtered list. Nothing is deleted. A component no
  page needs any more stays, because someone may have used it in a page they edited in the tenant.

What merging takes is small: the selection on the site record, a page filter where the reader hands
the assembled pages to the writer, and a component filter on the copy. **"Merge" is the union and
recomposing all of it, not incremental writes.** Incremental writes would leave older pages' links
pointing at the source site.

One limit: a site is built from one run. Building from a later run recomposes the union from that
run, and a selected path that run did not assemble is reported, not kept from the old run.

## Decision 2: what stage 9 means once stage 10 exists

**Stage 9 is staging, in fact already.**

- The site build copies components from the records Promote wrote in the extraction tenant's Library,
  with their prebuilt bundles (`getComponent` in the extraction tenant, then create or update in the
  target).
- Same-tenant composition, which is what the composed pages view shows, resolves components through
  that same Library.
- Promote's selection, collision handling and bundling happen once, there.

**Recommendation: keep the mechanism and change the words.**

- **Stage 9 becomes "Approve components".** Its description: "Approved components are bundled and held
  in this workspace's Library, ready to go into a site."
- **Stage 10 is "Publish site".** "Promote" then names neither, which retires the overloaded word.
- **The cost of staging:** the staged components are in the real, user-visible Library, namespaced by
  job (`ParkCityPlace/Hero`). An extraction workspace's Library is therefore a staging area, and it
  should say so where the Library is listed. Moving staging out of the Library is a larger change, and
  not proposed.

## Decision 3: where composition runs, and staleness

### What happens today when Assemble is re-run after a site is built

1. The ledger marks Promote stale (`markStageDone` cascades to every stage that had output).
2. **The site keeps serving the pages it was built with, and nothing says so.** The site record holds
   `lastBuild.runId` and no stage versions, and composition has no ledger entry.
3. **The composed pages view still shows the old composition** in the extraction tenant, also with
   nothing saying so.
4. **A rebuild is refused until Promote is re-run.** The reader reads Promote's artifact only when the
   stage is `done`, so the build fails with "requires Promote to be done".

So the answer today is "nothing happens, silently, and rebuilding is blocked".

### Recommendation: record what each build was built from, show the difference, never rebuild on its own

- **The site record keeps the stage versions of each build:** Assemble's, Promote's and Generate's,
  plus the compose version.
- **Stage 10 compares them with the ledger:** "Built from Assemble v3; Assemble is now v4. Re-run
  Approve, then rebuild to publish the new pages." The composed pages preview carries the same note.
- **No automatic rebuild.** A site is a published artefact that people may already be looking at.
  Republishing unreviewed pages because an upstream stage changed is the wrong default.
- **Previews come from the extraction tenant's composition**, as now, so a preview is never more than
  one Compose away. "Publish site" runs the same composition again in the target, which the seam
  already does.

## What the stage shows

- **Content:**
  - the composed pages panel's page list, with its four signals;
  - the source screenshot beside the composed one;
  - `AssembleView`'s instance list for the selected page;
  - the pages composition could not render, with the reason (already recorded in the page map).
- **The composed screenshot:** the design assumes the site is not deployed.
  - The stage shows the source screenshot, the signals and the live page one click away ("Open page").
  - A harness capture, when one has been uploaded for the run, is shown with its date.
  - When there is none, the step says the comparison is not available. It never shows a blank
    comparison.
- **No similarity score**, for the reasons in the brief.

## Reused against new

| Reused as it is                                                          | New                                                                         |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `BuildSiteTask` and its five steps, all idempotent                       | The selection: on the site record, as task input, and in the UI             |
| The seam: `CompositionReader`, `CompositionWriter`, the tenant assertion | The page filter between reader and writer; the component filter on the copy |
| `SiteStore` and the per-job site record                                  | Built-from versions on each build, compared with the ledger                 |
| Retirement and link rewriting                                            | Nothing: the union makes them correct                                       |
| The Site card's content (steps, live progress, Open site)                | Its new place: the stage 10 view instead of the Promote gate                |
| `ComposedPagesPanel`, `PageSignals`, harness upload and record           | A stage rail entry and a view composing these with the selection            |
| `AssembleView`'s instance list                                           | Shown per selected page inside stage 10                                     |
| Promote's mechanism                                                      | Stage 9's wording ("Approve components") and the Library's staging note     |

**Compose stays in the PoC, and stage 10 needs no move.** The filters go into the PoC's reader, writer
and site task. That is building further on the PoC, though. It was extended in place for the 16th,
and stage 10 would make it a dependency of a customer-facing stage. **The deferred move becomes due
with stage 10, not after it.**

## A stage, or a step?

**A step on the run, like the theme step, shown in the rail after stage 9.**

- **The ledger is linear.** Finishing a stage marks everything after it stale, and running a stage
  bumps its version. A site build is repeated with different selections, and none of those builds may
  invalidate anything.
- **The site belongs to the job, not the run.** One site record per job, reused by every run's
  build. A ledger entry is per run.
- **Its staleness is about a published artefact, not an artifact.** A `stale` mark in the ledger would
  not change what the site serves. The built-from comparison above says exactly what is out of date and
  what to do about it.
- **The theme step's test applies:** it must not block others and must not mark them stale. A tenth
  ledger stage would do both.

It can still look like stage 10: a rail entry after "Approve", with its own state (not built, building,
built, out of date) from the site record rather than the ledger.

## Cost, and the 16th

Estimated in elapsed time for an agent doing the work, calibrated on the region fixes of 2026-10-10:
code, tests, a 33-plan replay, a new check, deploy, regenerating four components and verifying them took
about 40 minutes. Most of that was build, deploy and Generate time. An earlier version of this section
gave days of a developer's time, which did not describe this work.

| Work                                                                            | Elapsed       | What sets the pace                                            |
| ------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------- |
| Selection, filters, built-from versions, tests                                  | about 1 hour  | one API build and deploy (5-10 min)                           |
| Admin: rail entry, stage 10 view, Site card moved, stage 9 wording              | 1-2 hours     | admin deploys; review in the running app                      |
| Deployed verification on two sites: partial build, merge build, Assemble re-run | about 1 hour  | build tasks; reading a page no sooner than 90 s after a build |
| **Total**                                                                       | **3-5 hours** | review between steps                                          |

Moving compose into the extraction package: 1-3 more hours. It is the riskiest part, because a
module-resolution change is proven only by a deployed invocation.

**Time does not rule out the 16th; risk does.** Every piece changes the demo path:

- the Site card moves off the Promote gate;
- Promote's wording changes;
- the build's page and component sets change.

The 71 Westland fallback and Take 3's built site stay as they are.

## MS1: built, tested locally, not deployed (2026-10-12)

Scope approved: the Site card moves to stage 10 with a pointer on the Promote gate, and the label-only
rename. Discoverability is the point; selection, the union, the filters and staleness are MS2.

### The main finding: the admin never sends a tenant

The composed pages panel reads the extraction tenant's composition, and its links and its "which page
does this path serve" check run in the admin's own tenant. Opened by someone looking for the migrated
site, it shows a different site's pages at the same paths, and links that open root's page there, with
nothing to say so. MS1 is only worth having if the Site view reads the site's own tenant:

- **Page map:** read with the site's tenant, for the run the site was last built from, which need not be
  the run on screen.
- **Which page each path serves:** a new API query, `pageCompositionPocSiteLivePages(jobId, paths)`,
  answered inside the site's tenant. The tenant comes from the job's site record, never from the caller.
  The admin cannot ask itself: its GraphQL client overwrites `x-tenant` with the admin's tenant on every
  request.
- **Links:** carry `?wb.tenant=`.

Unit-tested: the presenter reads the map with the site's tenant and the build's run, asks liveness
through the site query, and never through the admin-tenant check. **That is a claim about the calls,
not the result. It has to be verified on the deployed check:** each listed page opens the site's page,
and the liveness answers match what the site's tenant serves.

### The retirement defect, fixed

`a-rebuild-can-unpublish-a-working-page.md`. An earlier page is retired only when its path got a new
page. One that failed this time stays live and is carried in the page map as `kept`. One the run no
longer has is unpublished and named (`dropped`). The rule is a pure function (`planRetirement`), tested
on the page maps of Take 3's real build and rebuild. Its tests fail under the old rule.

### Which run the site was built from

The site's page map belongs to the run it was last built from, not the run on screen. Opened on run 5,
a site built from run 3 lists run 3's pages, and someone meeting it fresh reads that as broken. The view
always says "Built from run-0003, published <date>". When that is not the run on screen, it adds that the
pages below are run 3's, that publishing from this run replaces them, and a button to open run 3.
Presenter-tested; not seen running.

### Before the deployed check: the API key

**The API key the checks used is gone from the scratchpad** (`baseline.env`, cleared with the session's
temporary files), so nothing can be read from or triggered on the instance from here. It has to be
provided again before the deployed check. It must not be written into the repo or into any published
page.

### What the deployed check has to show (once sequencing is decided)

On a job that is neither 71 Westland nor Take 3:
- publish from the Site entry;
- the page list matches the site tenant's pages, and each "View page" opens the site's page and not
  root's;
- the liveness tags read "live";
- publish again: the same page set, nothing unpublished that was live;
- opened on a run other than the one the site was built from, the view names the build's run;
- the Promote gate shows the pointer and no card;
- the stage 9 labels read "Approve components".

## MS1 deployed check (2026-10-12, 07:51–07:59 UTC)

API and admin deployed at 07:51 after checking `dist`. Checked on the webiny.com validation job (site
tenant `validationwebinycom0001`). Neither 71 Westland nor Take 3 was touched. Predictions:
`scratchpad/ms1/PREDICTIONS.md`.

### The main question: the site tenant's pages, not the extraction tenant's

- **Page list:** the Site view lists the site tenant's 3 pages. The ids come from the site's page map,
  and none is root's id for the same path.
- **Liveness:** `pageCompositionPocSiteLivePages` answers each path with the site's page id. An
  independent read with the site tenant's `x-tenant` header (API key, not the admin) agrees. Root answers
  every path with its own, different page.
- **Links:** "View page" and "View site" open `…/<path>?wb.tenant=validationwebinycom0001`. Recorded from
  the running admin by capturing `window.open`.
- **Served pages:** fetched from the website, each path with the tenant parameter contains the site's
  page id and not root's. Without it, each contains root's id and not the site's. Told apart by page id,
  not content.

### As predicted

- **Publish again from the Site view:** tenant reused, theme already in the tenant, 6 components, 0
  images, "3 page(s) published." Nothing kept, nothing dropped. Compose version 1 → 2, with new page ids
  at all 3 paths. Root's page map and root's live pages unchanged.
- **Opened on run-0002:** the view reads "Built from run-0001, published …. You are looking at run-0002:
  the pages below are run-0001's, and publishing from this run replaces them", with "Open run-0001".
- **Promote gate:** labelled "9 · Approve components", with "Approve selected" and "Approved" tags. The
  pointer "Components approved. Next: the site…" and "Go to Site" replace the card. The rail has "Site"
  after the stages.

### Not predicted

1. **Root's served pages are about 30 times larger than the site's:** 6.1 MB against 0.2 MB per page.
   Root's page carries 323 component bundles (every job's components in root's Library); the site's
   carries 6. Whatever loads the components sends the tenant's whole Library with every page. Not made
   by MS1. It means a per-tenant site is about 30 times lighter, and every page served from root, demo
   pages included, carries every job's components.
2. **"Publish again" is enabled on a run that cannot publish.** Pressed on run-0002 (paused at Cluster)
   in the running admin: the view shows "Building the site requires assemble to be done." The site
   record is unchanged (still built from run-0001, 07:57:19 UTC), so the mutation refused before writing.
   The button's only effect is an error, and the error still says "Building". (Read from the code first,
   that was predicted to name Promote. The mutation checks Assemble first.)
3. **The Site entry shows "not built" for a few seconds** on opening a run whose site exists, until the
   site record loads. A newcomer can see that first.
4. **A read about 50 seconds after the publish served the previous build's pages.** At about 100
   seconds, every path served the new ones. The responses are `no-store`, so the staleness is further
   upstream. Same as the earlier stale-read note: do not read a page straight after a build.
5. **Seen, not MS1:** the Approve components rows show "pages" with no number in front of it.
