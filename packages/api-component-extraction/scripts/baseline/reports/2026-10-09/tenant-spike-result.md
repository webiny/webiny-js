# Tenant promotion spike: result

The spike for `compose-tenant-promotion-design.md`. One throwaway background task (`TenantSpikeTask` in
`api-page-composition-poc`), run deployed twice, plus API and website reads from outside. No model spend.

**Spike tenant:** `cespike1` ("Extraction spike 1"), still in place.
**Source page:** Park City Place's `/apartments/ct/bridgeport/amenities`, from root.

## Prediction, written before the run

- Every write lands in the new tenant, and the read-back in root shows nothing changed there.
- The likely failure is a use case caching its CMS model or storage from the first tenant it saw,
  writing into root while reporting success.
- About 70% that everything is clean.

## Result: writes across tenants work; the website does not, yet

### Unknown 1: writing from a task into another tenant works

The task ran in root and wrote inside `TenantContext.withTenant(cespike1)`:

| Step                                     | Result                                                         | Read back in `cespike1`      | Read back in root       |
| ---------------------------------------- | -------------------------------------------------------------- | ---------------------------- | ----------------------- |
| Tenant                                   | Created via Tenant Manager's create + `CreateAndInstallTenant` | exists                       | n/a                     |
| Components (the 4 the page uses)         | Created with their prebuilt bundles, no re-bundling            | all 4 in the Library         | Library unchanged       |
| Theme (the Park City job's pinned theme) | Created, published, activated                                  | active, tenant `cespike1`    | still no active theme   |
| Image (the page's logo)                  | Migrated through Capture's own `migrateImages`                 | file found                   | file not visible        |
| Page                                     | Created and published                                          | published, tenant `cespike1` | original page unchanged |

**Confirmed from outside.** An ordinary GraphQL request with `x-tenant: cespike1` returns that tenant's
own page id and active theme. The same request with `x-tenant: root` returns the original page and no
active theme.

**The copied image serves.** Its new File Manager URL returns the same 1,026 bytes as the original, with
no tenant-specific routing.

**Permissions.** They load per identity and are not keyed by tenant, so the triggering admin's full
access carries into `withTenant`. That is why the writes were allowed. A design that relies on it should
say so.

The second run reused the tenant and skipped what already existed. Re-running is safe, as a retry from
a failed step needs it to be.

### Unknown 3: copying images is answered by unknown 1

There is no S3 copy to design. Running Capture's own migration inside the target tenant puts the bytes at
`tenants/{target}/files/...` and creates the File Manager entry there. It deduplicates per tenant, because
the asset map lives in that tenant's key-value store.

### Unknown 2: seeing the site is blocked by one decision

- **How the app picks a tenant.** The local website app (`../next-website-migration-tool`) reads the tenant
  from `?wb.tenant=` and falls back to root. It reads every tenant with one API key from its `.env`, the
  root tenant's "frontend-integration" key.
- **Rendered from root:** the page renders.
- **Rendered from `cespike1`:** the site shows its 404. Replaying the app's own request with its key: root
  returns the page; `cespike1` returns `NOT_AUTHORIZED` ("Not authorized!").
- **The cause.** The project has an extension for exactly this, `extensions/SharedRootTenantApiKey.ts`,
  which shares root's frontend key with every tenant. Its file exists, but nothing registers it. Its last
  commit is "chore: restore extensions dropped during next merge", which restored the file and not its
  registration.
- **The fix is not made.** Registering it changes which key every tenant accepts, so it is a security
  decision, not a spike step. The permission check stopped the change, rightly.

**Navigation, tested once the key was registered: the symptom was wrong content, not a 404.** From
`cespike1`'s Amenities page the floor-plans link rendered root's Park City Floor Plans page, which
`cespike1` does not have: another tenant's content, served with no error. That is the same
silent-wrong-tenant shape as the seam table's silent rows. Fixed by the session cookie in the website
app (`compose-tenant-promotion-design.md`, "Navigation"). The original note follows.

**Not yet tested, because the page never rendered:** navigation. The tenant comes from a query parameter
on the first request only, so a link clicked inside the site falls back to root unless the tenant is kept,
for example in a cookie set by the app's middleware. That is a change in the website app, outside this
repo.

## Other findings

- **Root has two published pages at `/`** (Freehill Street Lofts and Park City Place). This is
  `home-pages-from-different-sites-collide.md`, live, and it is what one tenant per site removes.
- **An unknown tenant id returns a plain 500** ("Internal server error") from the API, not a clear error.
  A mistyped tenant on a demo link would look like an outage.
- **Port 3000 was held by an older website process** (pid 96288), answering every request with a
  module-loading 500. The spike used a fresh server on port 3001. The old process was left alone; the
  render path and its tunnel expect port 3000, so it needs restarting before they are used.

## What it changes in the design

- **Steps 1-5 stand as designed**, with one simplification: images go through `migrateImages` in the
  target, not an S3 copy.
- **Compose reads and writes in different tenants.** Its reads (run, artifacts, page map) must stay in the
  extraction tenant and its writes go inside `withTenant(target)`. `ComposePagesService` mixes the two
  today, so it has to be split along that line.
- **"Open site" needs two things in the website app:** a key that every tenant accepts (the decision
  above) and the tenant kept across navigation.

## Clean-up, once decided

Delete `TenantSpikeTask`, its mutation and its constant, and the `cespike1` tenant. The tenant is left in
place so it can be looked at in the admin.
