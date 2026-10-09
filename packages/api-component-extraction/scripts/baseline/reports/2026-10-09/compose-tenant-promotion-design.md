# Compose with tenant promotion: design, for approval

Design only; no code. It covers compose with tenant promotion and starting a new run when the last one
is paused. It also asks for three decisions and proposes a short spike before building.

## What exists today

- **Promote** writes the chosen components to the remote-components Library, namespaced by job
  (`Job/Hero`), in the tenant the request came from. Overrides set what gets selected and how name
  collisions are handled.
- **Compose** is `packages/api-page-composition-poc`, marked "throwaway proof of concept. Do not build on
  it… It will be deleted, not evolved."
  - It is a background task. It requires Assemble and Promote to be done.
  - It reads the run's artifacts and resolves the promoted components through the Library.
  - It creates Website Builder pages at the captured paths, rewrites their links and publishes them.
  - It unpublishes the pages of this job's other runs.
  - The page map and the captured-image-to-File-Manager map are in the tenant's key-value store.
- **Tenancy.** Nothing in either package switches tenant. Components, pages, the theme (`wbyTheme` is
  tenant-scoped), migrated File Manager assets and the asset map all land in the tenant that ran
  extraction.
- **The platform has the pieces:**
  - `TenantContext.withTenant(tenant, cb)`.
  - Core `CreateTenant` and `InstallTenant`, which Tenant Manager wraps as `CreateAndInstallTenant`
    (parent root, deleted again if installing fails).
- **Two open issues come from sharing one tenant.** `home-pages-from-different-sites-collide.md` (both
  sites want `/`) and `composed-pages-render-no-components.md` (manifest names collide across sites).
  Both name "one tenant per site" as a fix.

## Proposal

**Each job gets its own tenant, and promoting means "build this site there".** Extraction stays where
it runs. The result goes to the site's tenant: components, theme, images and pages. The demo becomes
"here is the property's site, in its own tenant", and the two collision issues close because each site
has a tenant to itself.

At the Promote gate, the action becomes **"Promote and build site"**, with the target named on the
gate: "Into tenant _2424 Tulane_ (new)". It starts one background task:

1. **Create the tenant** if the job has none: `CreateAndInstallTenant`, named after the job, parent root.
   The job records the tenant id; later runs reuse it.
2. **Theme:** copy the pinned theme into the tenant, publish it, activate it.
3. **Components:** promote into the tenant's Library, with today's selection and collision rules.
   Namespacing by job is no longer needed there and is dropped for tenant promotion.
4. **Images:** copy the run's migrated File Manager files into the tenant and rebuild the asset map
   there.
5. **Pages:** run compose against the tenant: create, link, publish. "Unpublish the other runs' pages"
   then only ever touches this site's pages.

Each step reads from the extraction tenant and writes inside `withTenant(target)`. The task records
which step it reached; a retry starts from the step that failed. The run view shows the steps as they
complete, using the waiting screen built today, and ends with "Open site" and "Open tenant".

**Starting a new run** (folded in). Today "Start new run" shows only when the last run is complete.
A paused or failed run blocks a new one, because a job runs one at a time. Add "Start new run" beside
"Review run". It asks "Run 3 is waiting at Promote. Starting a new run cancels it; its results stay
readable." and then cancels the old run and starts the new one.

## Decided (2026-10-09)

1. **A new tenant per job.** It closes the collisions, and per-tenant is the model RealPage needs.
   Choosing an existing tenant at the gate is a later feature, for migrating into an existing site.
2. **Extend compose in place for the 16th; move it into the extraction package after.** The README's
   warning is about not building the universal tool on it.
3. **Same-tenant promote stays until after the demo.**
4. **`SharedRootTenantApiKey` is registered**, so the website app's one key reads every tenant. It is
   root's "frontend-integration" key, a website-read key, not root's general API key. Per-tenant keys
   are the end state for a customer-facing deployment.

## Settled by the spike

See `tenant-spike-result.md`.

- Writing from a task into another tenant works. Tenant, components, theme, image and page all landed in
  the new tenant and nowhere else, confirmed from inside the task and from outside.
- Images go through Capture's own `migrateImages` inside the target, not an S3 copy.
- The website reads the new tenant once the shared key is registered. Navigation is the open part, below.

## Permissions: the permission check reads the wrong tenant

This is not a scoping choice. Permissions load per identity and are not keyed by tenant
(`IdentityContext.listPermissions` → `loadPermissions(identity)`), so inside `withTenant(target)` every
permission check reads the extraction tenant's permissions:

- **Creating the tenant** checks Tenant Manager's `tm.tenant`, but against the operator's permissions
  in the extraction tenant, not in any tenant it governs.
- **The writes into the new tenant** (theme, components, files, pages) check nothing specific to that
  tenant. Each use case's check passes on the extraction tenant's grant.
- **So anyone who can run Promote can create and populate tenants.**

**For dev and the demo this is acceptable.** For a customer-facing deployment it is a deliberate
decision to make. The options:

- require `tm.tenant` to start a tenant promotion at all;
- run the writes under a dedicated service identity;
- resolve permissions in the target tenant.

The build records the decision as open in the code at the point where the task enters `withTenant`.

## The read/write seam: where this will go wrong

Every compose and promote call belongs to one tenant or the other. **A read in the wrong tenant does not
fail: it returns the other tenant's data.** So the split is made structural, not left to care at each
call.

### Every call in `ComposePagesService`, by tenant

| Call                                                                                    | Kind       | Tenant                       | If called in the wrong tenant                                                             |
| --------------------------------------------------------------------------------------- | ---------- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| `runs.get`, `runs.listByJob`                                                            | read       | extraction                   | not found                                                                                 |
| `artifacts.getJson` (assemble, promote, generate, segment)                              | read       | extraction                   | not found                                                                                 |
| `blobs.get` (page trees)                                                                | read       | extraction                   | not found                                                                                 |
| `getComponent` (promoted manifests)                                                     | read       | **target**                   | not found                                                                                 |
| `assetUrls.prime/resolve` (the image map, via the key-value store + `FileUrlGenerator`) | read       | **target**                   | **silent**: the page points at the extraction tenant's files, which still load            |
| `getPageByPath` (the post-compose path check)                                           | read       | **target**                   | **silent**: root's page at the same path "verifies" it; root already has two pages at `/` |
| `createPage`, `updatePage`, `publishPage`                                               | write      | target                       | the page lands in root                                                                    |
| `unpublishPage` (retiring sibling runs' pages)                                          | write      | target                       | unpublishes root's pages                                                                  |
| `pageMaps.get/set`                                                                      | read/write | extraction (it is run state) | sibling retirement looks in the wrong place                                               |

**Promote has the same seam:**

- Extraction tenant: overrides (`OverrideRepository`) and the generate/promote artifacts.
- Target: listing the Library for collisions, and creating or updating components.

**The two silent rows are the dangerous ones.** Both are reads that belong in the target and would
succeed in the source.

### How the seam is made structural

1. **A reader**, run in the extraction tenant, collects everything compose needs into one plain data
   object: the run, the assemble pages with their trees, the promoted component ids and names, the
   generate artifact, and the captured image URLs. It has no Website Builder, Library or File Manager
   dependencies.
2. **A writer**, called only inside `withTenant(target)`, takes that object and nothing else. Its
   constructor has no `RunRepository`, artifact store or blob store, so it **cannot** read extraction
   data. Every target-side read (manifests, image map, path check, unpublish) is in the writer and
   therefore in the target.
3. **The writer asserts its tenant on entry:** `tenantContext.getTenant().id === target`, or it fails.
4. **The page map stays in the extraction tenant** and records the target tenant id. Retiring a sibling
   run's pages enters that run's recorded tenant.
5. **A test with a recording `TenantContext`** asserts that every dependency call happened in its
   tenant. Each fake use case records `getTenant().id` when called; the test fails if any extraction
   dependency is called in the target or any target dependency in the extraction tenant. Without this
   test the split is a convention.
6. **The deployed check reads back in both tenants**, as the spike did. The target must have the pages
   and files, and the extraction tenant must not have changed.

## Navigation on the site (scope)

**Measured.**

- The website app takes the tenant from `?wb.tenant=` on each request and falls back to root.
- A composed page's links are plain paths (`/apartments/ct/bridgeport/floor-plans`), so a click drops
  the tenant.
- **Silently, again: the symptom was wrong content, not a 404.** From `cespike1`'s Amenities page, the
  floor-plans link rendered root's Park City Floor Plans page, a page `cespike1` does not have (it
  shows the 404 with the tenant). A migrated site served another tenant's content with no error: the
  same silent-wrong-tenant shape as the two silent rows in the seam table. The cookie fixes it.
- On the demo, once root's copies are gone, a click shows a 404, or the other site's page at `/`.

**Proposed for the 16th: the app's middleware keeps the tenant.**

- When `wb.tenant` is present, set a cookie.
- When it is absent, use the cookie.
- "Open site" links carry `?wb.tenant=<id>` once.

This is a small change in `next-website-migration-tool`, outside this repo.

**Not proposed:**

- **Rewriting links in composed pages to carry the parameter.** It puts a routing detail into content
  that is meant to become the customer's site.
- **Per-tenant host names**, which are the end state but need a stable domain per tenant. Quick tunnels
  cannot give one.

## An unknown tenant returns a plain 500 (scope)

- **Cause** (`api-core`, `RequestTenantLoader.establish`). For a tenant id that does not exist it logs
  `Tenant "x" not found.` and leaves the tenant unset. The first thing to read the tenant then fails, and
  the request ends as "Internal server error".
- **Fix, in core:** fail the request there with a clear "tenant not found" error.
- **Why it matters for the demo.** A mistyped `wb.tenant` on a link would look like an outage. The website
  app should show its 404 for an unknown tenant, which it will once the API answers clearly.
- **Not done here.** It changes request handling for every tenant and every client, so it goes in as its
  own change with its own test, not inside this item.

## Verification, once built

- On webiny.com and then one demo site:
  - the tenant is created;
  - the theme is active there;
  - every promoted component is in that tenant's Library and in no other;
  - every page is published at its captured path;
  - images resolve to the tenant's files;
  - the site opens at its address.
- A second promotion of the same job reuses the tenant and replaces its pages, leaving no orphans.
- Interrupt the task between steps; the retry starts from the step that failed.
- Screens for the gate, the running task and the result, added to the reference set.

## Built (2026-10-09)

**API** (`api-page-composition-poc`, extended in place as decided).

- **The seam.**
  - `CompositionReader` runs in the extraction tenant: run, artifacts, generated components, every page
    tree compose touches, the run's images, and earlier page maps.
  - `CompositionWriter` has no extraction dependency. It places components, composes, resolves images,
    creates and publishes pages, retires earlier pages and runs the path check. It refuses to write
    when it is not in the tenant it was given.
  - `ComposePagesService` reads, writes (inside `withTenant` for a site), and records the page map in
    the extraction tenant.
  - Same-tenant compose goes through the same split.
- **`BuildSiteTask`** builds the site in five steps:
  - tenant (Tenant Manager create + install);
  - theme (the job's pinned revision, created, published and activated);
  - components (Promote's records, copied with their prebuilt bundles);
  - images (bytes fetched, then Capture's own `migrateImages` in the target);
  - pages.

  Each step reads first and writes inside the target. Every step is idempotent, so a retry reruns.

- **The site record and its operations.** A per-job site record lives in the extraction tenant
  (`SiteStore`). `pageCompositionPocBuildSite(runId)` starts a build and `pageCompositionPocSite(jobId)`
  reads the record.
- **Permissions.** The open decision is written into the code where the writes enter `withTenant`.

**Admin.**

- **A Site card on the Promote gate**, once Promote has run. It shows the tenant, the last build step by
  step (followed live), Build or Rebuild site, and "Open site" (the preview domain with
  `?wb.tenant=`).
- **"Start new run"** beside "Review run" for a paused or failed run, after a confirmation that names the
  run and the stage it is waiting at.

**Departures from the design, all for the 16th:**

1. **Two steps at the gate, not one action.** Promote as today, then Build site. Promote's selection,
   collision handling and bundling stay exactly as they are; the build copies what Promote chose.
2. **Component names keep the job's namespace** in the site tenant ("ParkCityPlaceBaseline/Hero"). A
   bundle embeds its component's name, so dropping the namespace would mean re-bundling.
3. **One page map per run per tenant** (`pageMap:{runId}` and `pageMap:{runId}:tenant:{tenantId}`),
   which the design did not have. With one map per run, building a site would have overwritten the
   record of the run's own-tenant pages. They would have stayed published with nothing to retire them,
   bringing back two pages on one path in root.

**Tests.**

- The writer's dependency list holds no extraction abstraction. The check is proved comparable by a
  dependency it does have.
- The writer writes nothing in the wrong tenant.
- With a recording tenant context, the service reads and records in the extraction tenant, writes only
  in the target, and retires only that tenant's earlier pages.
- Without a target, behaviour is as before.
- The tenant id is unique per job.
- Every declared Query and Mutation field has a resolver. This was added after the spike's removal
  briefly took the page map resolver with it; the test was proved to fail on a missing resolver.

**Verified deployed.**

- **Same-tenant compose is unchanged.** The webiny.com validation run was composed by the old code and
  then by the new. The page maps are identical, ids and dates aside. The pages' content is identical
  across all three pages (35K characters compared, element and binding ids normalised).
- **webiny.com site** (`validationwebinycom0001`). Theme active in the site only; 6 components in its
  Library; 3 pages published; every path answers with the site's page in the site and with root's own
  page in root; root's page map unchanged. It renders through the website app. It had 0 images, which
  is correct: that run predates image migration.
- **Park City site** (`parkcityplacebaseline6a3d`). 8 components, 38 images, 8 pages.
  - Every image file checked on a site page exists in the site's File Manager and not in root's: the
    silent row of the seam table, avoided.
  - A rebuild from the admin reused the tenant, skipped the theme, and left 8 published pages out of 16
    with no path claimed twice.
  - "Open site" opens the home page through the tunnel.
- **"Start new run"** opens its confirmation correctly. The confirm path was not exercised: the only
  paused run is the one Sven is holding at Promote.

**Not done.**

- The other demo sites.
- The unknown-tenant 500 in core (scoped above).
- Deleting the `cespike1` spike tenant (the spike's code is removed).
- Nothing is committed.
- `validationwebinycom0001` keeps the useless `0001` suffix from the first id scheme. Its record stores
  the id, so it is reused, not duplicated.
