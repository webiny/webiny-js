# Site leftovers: the 08:28 publish, the inventory line, and stage 9's keep-both default

## What published Take 3 at 08:28

- **A person, not a script.** The task (`6acc9a28e906a000029f83da`, 08:28:24 UTC) was created by the
  "Webiny Admin" login as an admin user, which means through the admin UI. Everything triggered with the
  API token shows as "Universal API Key", as every task created by scripts on 2026-10-10 does.
- **Not this session.** It issued no command between 08:24:21 and 08:32:17. Its only browser tab was on
  the validation run-0002 Site view, and publishing from there sends run-0002's id, not Take 3's. No other
  Claude session ran on the machine.
- **Not a page left open.** The 3-second polling in the API logs was this session's own tab, and it
  stopped when the tab was closed.
- **The same login was used from a browser before:** a render task on 2026-10-10 at 12:30.

So someone holding the admin login opened Take 3's run in a browser and pressed "Publish again". The
password is a shared default; anyone who has it can publish any site. Nothing narrower can be
established: the audit log is empty, the Lambda logs carry no caller details, and CloudFront access
logging is off.

## Surfacing leftovers (built and deployed 2026-10-12)

- **`pageCompositionPocSiteInventory(jobId)`:** read inside the site's tenant (tenant from the job's site
  record). It returns the tenant's components, those no published page places, and the published and
  unpublished page counts. The rule is a pure function, `siteInventory`, tested on the validation
  tenant's real pages.
- **Site view:** "The site's tenant holds N components, all used by its M live pages, and K unpublished
  pages from earlier builds". When there are leftovers, a warning names them and says publishing does not
  remove them and each still ships with every page.
- **Build step:** now reads "N component(s) copied this build." It used to read "in the site's Library",
  which counted only what that build copied.

### Deployed check

- **All five site tenants:** the query's numbers equal an independent read of each tenant.
- **The iteration path, made real on the validation site (non-demo):**
  - Re-approved stage 9 on run-0001 in the admin. All 6 components came back under new suffixed names
    in root ("Primary Navigation Header (3)", "Email Contact Form (6)", …), as keep-both does.
  - Published again: "6 component(s) copied this build.", and a warning naming the 6 old components,
    plus 6 unpublished pages.
  - The site's home page went from 6 bundles (213 KB) to 12 bundles (358 KB): **one cycle added 68%**.
- **Left in place:** 6 extra components in root and 6 leftovers in the validation tenant.

### Not predicted

- **The stage 9 gate said "no name conflicts" while it renamed all six.** The gate's count leaves out
  components this run has approved before; the approval suffixes them anyway. So the screen tells the
  operator nothing will be renamed, immediately before everything is.
- **The stale window was about 2–3 minutes, not 90 seconds.** At 110 seconds the site still served the
  previous build; at 3 minutes it served the new one. Note for verification: wait 3 minutes.
- **Nothing on the Site view says the approvals changed after the last build.** That is the staleness
  comparison held for MS2, now seen in practice.

## Stage 9's keep-both default (report; not changed)

### What it does

Stage 9 checks each component's job-namespaced name against root's Library. If the name is taken, the
default keeps both, suffixing the new one `Name (2)`, `(3)` and so on. Per component, an operator can
set "Replace" (update the existing record in place) or "Keep both" with a chosen name. Those overrides
are keyed by the cluster signature and reattach across runs.

### What the data says

Over the 25 stored approvals:

- **Most suffixes come from re-approval:** the same job approving the same clusters again, in the same
  run or a later one.
- **In 4 approvals, two different components of the same run got the same name** (Take 3, ParkCityPlace
  Baseline 2, 2424Tulane Baseline, The Vibe run 2). There keep-both is doing real work: replace-by-name
  would write one sibling over the other.

### So the issue is identity, not the default

Under keep-both, the normal iteration path (regenerate, re-approve, publish) leaves a leftover on every
cycle. Under Replace it leaves none. But Replace keyed by name is wrong for those 4 approvals.

Stage 9 decides "same component" by name when it should decide by the component's identity, its
cluster signature (with `legacySignature` across re-clusterings). The job's earlier approvals record
`signature → componentId` in their promote artifacts. The rule that fits this workflow:

- **If this job has approved this cluster before,** update that record in place.
- **If not, and the name is taken,** keep both.

That would remove iteration leftovers in root and in the site, and keep distinct same-named clusters
apart.

### What depends on the current behaviour

1. **Earlier root compositions** address components by name. Under update-in-place, an older root
   composition renders the updated component; under keep-both it keeps its original. That matters for
   comparing old compositions in the composed pages panel.
2. **The site build** creates or updates by name in the site tenant. With stable names it updates in
   place and leaves nothing behind. It needs no change.
3. **Bundles embed the component's name.** Update-in-place keeps the name, so no re-bundling question
   arises.
4. **The gate's conflict count** already treats this job's earlier approvals as not conflicting. Under an
   identity rule that would become true; today it misleads.
5. **The collision overrides** (Replace, Keep both with a rename) stay for real clashes between
   different clusters.
6. **Root's Library is a shared, visible Library.** A hand-made root page using a job's component would
   change on re-approval under update-in-place. The job namespace makes that unlikely, not impossible.
7. **Promote's artifact and the site build read components by id.** Update-in-place keeps the id, so
   they are unaffected.
