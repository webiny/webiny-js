# The site tenant from the start: design

Design only; no code, no deletion. The Webiny MCP server and skills were used (full-stack and Website
Builder specialists, the preview-URL skill).

## Three facts that shape it, found while scoping

1. **The component list stops at 1,000 without saying so.** `ListRemoteComponentsRepository` lists with
   `limit: 1000` and no paging. The website's `ComponentsSdk.loadComponents`, stage 9's collision check,
   the site build's name lookup and the Library screen all read that one list. Above 1,000 components in a
   tenant, each sees a partial list with no error. At the 10,000 the brief projects for root, pages would
   lose components silently before page weight even matters.
2. **The page editor loads every component.** The editor's preview is the website's page route with
   `wb.editing=true`, the same `loadComponents()` that loads every bundle in the tenant. So per-tenant
   fixes the editor as well as pages. The Library _list_ loads metadata only, not bundles, but it fetches
   every record unpaged, so it is subject to the cap above.
3. **Components have no draft or published state.** A remote component is a CMS entry whose `status`
   records only whether it is bundled. An update is live for every page that names it at once. Pages do
   have drafts and publishing. That is what decides how staging moves into the site (question 3).

## The three changes

### 1. Approve into the site tenant

- **What it touches:**
  - stage 9 (`PromoteHandler`) writes inside `withTenant(site)`;
  - the collision list it reads becomes the site's Library;
  - the promote artifact records the tenant its component ids belong to;
  - the job namespace in names (`Job/Hero`) is no longer needed for new jobs (one site per tenant), but
    bundles embed names, so dropping it is a choice for new jobs only.
- **What it breaks, and how to avoid it:**
  - Writing an approval into the live site's Library cannot update a component in place: a
    regenerated component renames inputs (13 of 13 on record), and the live site's pages would render
    the new code against old values the moment stage 9 finished.
  - So approval writes under a new name (keep-both, as today, but inside the site), and the live site is
    untouched until it is published again.
  - Publishing then retires the superseded copies (question 2).
- **Reuses:**
  - the seam's `withTenant` writes and tenant assertion (`CompositionWriter`'s pattern);
  - `ensureTenant` from the build task, moved earlier;
  - the site record, which already holds the tenant id;
  - the signature map built today, which becomes stage 9's identity record of which site component is
    this cluster's current one.

### 2. Compose into the site tenant

- **What it touches:**
  - **Compose:** the "Compose" action always composes with a target, the job's site tenant. The writer
    already does this for site builds.
  - **Drafts:** pages are written as drafts, not published. The writer's retirement and path check run
    at publish instead.
  - **The composed pages panel** reads the site tenant's page map. The query takes a tenant already, and
    MS1 added the site liveness and inventory reads.
  - **Its "Open"** becomes a draft preview of the site tenant: Website Builder preview with `wb.tenant`,
    through a `PreviewUrlModifier` or the editor's preview link.
- **Images move with it.** Capture migrates images into root's File Manager today (1,399 files from 45
  runs), and the site build fetches and migrates them again into the site. Instead:
  - Capture keeps image bytes in raw S3, as it does screenshots;
  - composition migrates them into the site tenant, which it already does for site builds.

  Root's File Manager then stops growing too. Without this, 1,000 migrations leave about 50,000 images in
  root.

- **What it breaks:**
  - **The local harness** photographs URLs; it needs the draft-preview URL instead of root's live page.
  - **Existing root compositions** stay readable only for old runs.
- **Reuses:** `CompositionReader` and `CompositionWriter` unchanged in shape, the page map per run per
  tenant, the retirement rule (`planRetirement`), and MS1's cross-tenant reads.

### 3. Reference images out of File Manager

- **Why the File Manager at all:** Generate stores each crop as a File Manager file only because
  `remote-components`' generate use case takes **file ids** (`additionalFileIds`) and reads their bytes
  with `GetFileContentsByIdUseCase`. That input was designed for the component editor's uploads.
- **What it touches:** the generate use case gains a bytes input (images as `{ data, mediaType }`).
  Extraction passes the crop it already has in S3 (`cropRef`), and no File Manager record is made.
- **What it breaks:** model-call records keep a file id for the reference; they would keep the crop's S3
  key instead. That is a shared package, so the change is additive: `additionalFileIds` stays for the
  editor.
- **Reuses:** the crop already stored in S3 by Cluster, the bytes `modelReferenceImage` already
  produces, and the S3 copy Generate already writes before the File Manager record.

## The five questions

### When the tenant is created, and runs that never reach stage 9

- **Creating at the first run** gives every abandoned job a tenant. Tenant creation runs every app
  installer, and each tenant appears in Tenant Manager. Nothing deletes an empty one today.
- **Recommendation: create it lazily, at the first stage that writes into it, which is stage 9.**
  Capture, Segment, Cluster, Classify, Plan and Generate write only artifacts, and with change 3 Generate
  writes nothing to a tenant. A job abandoned before approving never gets a tenant.
- **For a job that does get one and is then abandoned:** the `deleteJob` operation (proposed in the
  fresh-start report) deletes the job's tenant when it has never been published. That is the only
  cleanup needed, and it is part of deleting a job, not a sweep.

### What publishing becomes

No longer a copy. It does four things:

1. **Theme:** copy, publish and activate the pinned theme in the site. This could move to tenant
   creation; keeping it at publish lets a re-pinned theme reach the site.
2. **Pages:** publish the composed drafts, retire the previous pages by path, and run the path check.
3. **Components:** retire the superseded copies. These are site components no page in the tenant
   references, **published or draft**, and that are not the current approval's. The check is over 10 to
   20 components, inside the tenant, at every publish, so it is part of publishing rather than a job
   someone has to press. It is bounded by the site's own size. **It acts at publish, not at approval:
   between the two the live site carries both sets** (see the stated property below).
4. **Images:** already in the site from compose.

It collapses from a five-step copy to a three-part publish (theme, pages, components) in one tenant.

### Whether the staging step is lost

It moves into the site, and **because components have no draft state, it needs the retirement in step 3
above.** What depends on root being the staging area today:

| Today it reads root's Library                   | It would read                                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Stage 9's collision list                        | the site's Library (10–20 components), so collisions are within one site, as they should be                   |
| The Rename and Replace overrides (by signature) | unchanged as overrides; Replace means "update in place now", which writes to the live site, so it should warn |
| The composed pages panel                        | the site tenant's drafts and page map                                                                         |
| Same-tenant compose                             | compose into the site                                                                                         |
| The site build's copy step                      | removed                                                                                                       |
| The Library screen in root                      | shows nothing from extraction; each site's Library is in its tenant                                           |

**The alternative that removes the retirement entirely is draft and published states for remote
components:** approval writes a draft revision, publish publishes it. That is a platform change to
`remote-components` and to what the website loads. It is the cleanest end state and worth proposing to
the platform, but it should not block this milestone.

### A stated property: the live site is heavier between approval and publish

**This design does not keep the live site small throughout. It keeps it small after each publish.**

Every page ships every component bundle in its tenant, and an approval writes into that tenant's live
Library. From about a minute after an approval finishes (the website's component list refreshes every
60 seconds) until the next publish, every live page carries the previous approval's components and the
new one's. Measured on the deployed rehearsal (2026-10-12, two agreeing reads per state, outside the
cache; `site-tenant-rehearsal.md`):

| State                               | Bundles per page | `/`        | `/docs`    | `/learn`   |
| ----------------------------------- | ---------------- | ---------- | ---------- | ---------- |
| before the re-approval              | 17               | 283 KB     | 253 KB     | 241 KB     |
| **between re-approval and publish** | **33**           | **473 KB** | **443 KB** | **431 KB** |
| after the publish                   | 17               | 282 KB     | 252 KB     | 240 KB     |

A team iterating (approve, compose, review the drafts, approve again) spends most of its working time
in this window, so its live site is at about **167% of its size for most of the time it is being worked
on**, and returns to size only when someone publishes. Only the components grow; pages, images and the
theme do not.

**What closes it: draft and published states for components.** Neither fix is built.

- **Component drafts close it and keep the draft preview.** An approval writes draft revisions; the
  live site loads published revisions only; the preview (`wb.preview=true`) loads drafts. The website's
  loader (`GraphQLRemoteComponentLoader.loadComponents`) makes one call with no preview/live
  distinction today, so this needs both the platform change in `remote-components` and a mode on the
  loader.
- **An approval that stays out of the live Library until publish closes the window too, but it breaks
  the draft preview.** The preview renders composed drafts with the tenant's Library. Composed drafts
  name the new approval's components, which would not be in the Library until publish, so the drafts
  could not be reviewed before publishing, and reviewing them is the point of composing in the site.
  Making the preview read the held-back approval from somewhere else rebuilds half of component drafts
  outside the platform.

### The 26 existing jobs and 5 sites

**Leave them as they are; they keep working.**

- The promote artifact gains the tenant its component ids belong to. When it is absent (every existing
  run), publishing uses today's copy path, unchanged.
- A legacy job that approves again after the change approves into its site tenant (creating it if
  needed), and from then on it is a new-style job. **As built (2026-10-12), this is not what happens:**
  the `siteTenantFromStart` flag is set only when a job is created, so an existing job stays old-style
  however often it is re-approved. See `ai-context/component-extraction-two-kinds-of-jobs.md`.
- **Nothing needs migrating.** The fresh start, if run, removes most of them anyway; the five site jobs
  keep working either way.

### Whether the component preview has the same problem

Yes, and per-tenant fixes it. The page editor's preview loads every bundle in the tenant, like a page.
The Library list loads every record, capped at 1,000 with no warning. Per-tenant, a tenant holds its own
site's 10 to 20 components, so both stay small regardless of how many migrations run. **This is a
benefit to state: it makes the 1,000 cap unreachable in practice.**

The cap should still be fixed as a platform defect, because a single large customer site could pass it:
page through, or fail loudly.

## Order

1. **Reference images out of File Manager, first and on its own.** It is independent, small and
   additive in a shared package, and it stops the fastest-growing count (one per Generate call).
2. **Changes 1 and 2 together.** They cannot land apart: approving into the site while composing in
   root would leave compose without its components, and composing into the site while approving in root
   needs the copy step back. Image migration moves with change 2, and tenant creation at stage 9 lands
   with them.
3. **Afterwards and separately:** draft and published states for components (platform), and the
   1,000-cap fix (platform).

## Estimate

My elapsed time, with what sets the pace:

| Work                                                                                                                                                                      | Mine                             | Pace set by                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Reference images out of File Manager                                                                                                                                   | about 1 hour                     | one API deploy; a Generate run to verify (minutes, model cost)                                                                                                                                                    |
| 2. Approve and compose into the site, images at compose, tenant at stage 9, publish as theme + pages + component retirement, the panel reading the site, legacy path kept | 6–10 hours                       | about 8–12 deploys at about 10 minutes; at least two full extraction runs end to end (about 45 minutes each, plus model cost); three review checkpoints with you (approval, the draft preview, the first publish) |
| Deployed verification on a new job and on one legacy job                                                                                                                  | about 2 hours                    | the runs above; reading pages twice after each publish                                                                                                                                                            |
| **Total**                                                                                                                                                                 | **about 10–13 hours of my time** | spread over 2–3 working days, mostly waiting on runs and reviews                                                                                                                                                  |

## What this makes unnecessary

- **A cleanup job:** root never receives components, pages, images or reference crops from a new job.
- **The fresh start's recurrence:** run once for the existing clutter, it does not need repeating.
- **The retirement step already declined:** declined for good. The only retirement left is publish's own
  check over one site's components, which exists only because components lack a draft state.
- **The site build's copy step**, and with it the site-side signature rule's matching. Identity moves
  into stage 9's write within the site. The map built today is reused there.
- **The 1,000-cap exposure** for any tenant built this way.
