# What root keeps after a site is published, and a fresh start before the handover

Report and proposal only. Nothing in this document has been deleted.

## Part 1: what each migration leaves in root, and what it is for

A site build reads from root and writes into the site's tenant. Nothing it does removes anything from root,
and nothing else does either. Per job, root holds:

| What                                   | Where                               | Grows by                                              |
| -------------------------------------- | ----------------------------------- | ----------------------------------------------------- |
| Job, runs, overrides, model calls      | private CMS models                  | each run                                              |
| Stage artifacts, trees, crops, renders | S3, under the run's prefix          | each stage run                                        |
| The pinned theme                       | root's Theme entries                | each job (several jobs can share one)                 |
| Approved components                    | root's component Library            | **each approval, as a new copy (keep-both)**          |
| Migrated images                        | root's File Manager                 | each Capture, deduplicated by content                 |
| Reference crops for Generate           | root's File Manager ("… reference") | **each Generate call; 1,131 today, never removed**    |
| Same-tenant compositions               | root's Website Builder pages        | **a full set per Compose; old sets stay unpublished** |
| Page maps, site records, captures      | root's key-value store              | each Compose and build                                |

### What still needs it once a site is published

- **"Publish again"** reads the run's artifacts (Assemble, Generate, Promote, Segment, page trees). It
  also reads the components of the run's **latest approval**, from root by the ids Promote recorded, the
  job's **pinned theme** (copied once, skipped while unchanged) and the run's **migrated images** (fetched
  from root's File Manager by URL).
- **The composed pages panel** (developer row) reads root's page map, root's pages and the harness captures.
- **Stage 9** reads root's Library names, for collisions.
- **Model-call records** keep each Generate call's reference file id, so an old call's exact input
  image stays viewable only while that file exists.

### What nothing needs once the site is published

- **Superseded approvals:** copies of a component from earlier approvals of the same cluster
  (`Name`, `Name (2)` … below the latest). Only older root compositions reference them.
- **Unpublished root compositions:** earlier Compose sets, retired by path.
- **Reference crops of earlier Generate calls:** each call makes a new one.
- **Root compositions as a whole,** if the composed pages panel is no longer used for that job. The
  Site view replaced it for users.

### Retirement, or approving into the site tenant

- **Retirement** is a cleanup after each publish: the job's unpublished compositions first, then the
  superseded approvals they used (checking each is unreferenced), then superseded reference crops.
  - It bounds the growth.
  - Root still holds every job's live staging set: the latest approval, the theme and the images. The
    1.4 MB floor from the component-library issue is that set.
  - It is also a second mechanism to keep right, with deletes that cannot be undone.
- **Approving into the site tenant** is the real fix:
  - Stage 9 writes to the site's tenant (created at approval, or when the job is created).
  - Same-tenant compose moves there too, as an unpublished preview, and publishing makes the preview
    live.
  - Root then keeps only records, artifacts, the theme and images; the Library stops growing.
  - It is a bigger change. Stage 9, collision handling, the composed pages panel and the build's copy
    step all move, and identity matching moves with them, where no older root composition can be broken.
  - Images and reference crops would stay in root unless Capture and Generate also write into the
    site's tenant.
- **Recommendation:**
  - Do not build retirement.
  - Plan approving into the site tenant as the next milestone after the handover.
  - Until then, the signature rule (built) stops growth inside each site, which is where the team
    feels it, and the fresh start below resets root once.
  - Reference crops can be retired independently, by run, whenever a run is deleted.

## Part 2: a fresh start, as a precise proposal

**Goal:** Veronica's team opens the admin to an empty list of extractions and an empty root Library,
File Manager and page list.

**Protected until the demo is done:** the 71 Westland fallback (job "71 Westland — rehearsal
(2026-10-09)" and tenant `71westlandrehearsal202614962`) and all five site tenants.

### The decision it needs first: the five site jobs

A site tenant renders on its own and is unaffected by anything in root. Its **job** is what lets it be
published again: runs, artifacts, the latest approval's components in root, the pinned theme and the run
images.

- **Option A, a two-phase start (recommended).** Before the handover, delete everything except the five
  site jobs and what they need. After the demo, delete those five as well.
  - Until then the team sees five extractions, not zero.
  - The fallback can still be published again, which is the reason it is protected.
- **Option B, zero extractions now.** Delete all 26 jobs. The five site tenants stay and keep serving,
  but none can be published again. The fallback becomes frozen.

The counts below are Option A's first phase.

### Deleted (Option A, phase 1)

| What                     | Deleted                                                                                         | Kept                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Jobs                     | 21 (every job without a site tenant)                                                            | 5: Take 3, the 71 Westland rehearsal, ParkCityPlace Baseline, 71Westland Baseline, Validation |
| Runs                     | 39 of 45, plus Validation run-0002 (stuck "running", never published)                           | the 5 runs the sites were built from                                                          |
| Stage artifacts (S3)     | every deleted run's prefix                                                                      | the 5 kept runs'                                                                              |
| Root pages               | all 99, and the 725 in the bin, permanently                                                     | none                                                                                          |
| Page maps, captures (KV) | every root composition's                                                                        | the 5 site records and their site-tenant page maps                                            |
| Root components          | 212 of 266: every copy not in a kept run's latest approval                                      | 54: the latest approval of each kept run (15 + 16 + 8 + 9 + 6)                                |
| Themes                   | 6 of 11: not pinned by a kept job, including the draft "Webiny" and an unpinned webiny.com copy | 5 pinned by the kept jobs                                                                     |
| Migrated images          | 276 used only by deleted jobs' runs                                                             | 80 used by the kept runs                                                                      |
| Reference crops          | all 1,131                                                                                       | none: each Generate call makes a new one                                                      |
| Other files              | none                                                                                            | 2 unrecorded uploads (`GettyImages-2235549119-w3iorq.webp`, `tvuhziix4tdisv5iksa8.webp`)      |
| Model calls, overrides   | the deleted jobs'                                                                               | the kept jobs'                                                                                |
| Tenants                  | none (`cespike1` already answers as unknown)                                                    | all 5 site tenants                                                                            |

Root has no active theme, so deleting themes cannot change root's own appearance.

### What breaks

- **The composed pages panel** shows "not composed" for every run, because all root compositions go. The
  Site view is unaffected: it reads the site tenants.
- **Spend history for the deleted jobs goes** with their model-call records. Export it first if it is
  wanted.
- **An old model call's reference image** can no longer be opened.
- **The validation site's 6 leftover components and its unpublished pages stay,** because they are in
  its tenant, which is protected. The inventory line keeps naming them.
- **Nothing in a site tenant changes, and nothing a visitor sees changes.**

### What it takes

There is no delete for jobs or runs in the API: jobs, runs, overrides and model calls are private CMS
models, artifacts are in S3 and page maps are in the key-value store. Pages, components, themes and files
can be deleted through their own APIs, in the order used for step 1:

1. pages, permanently, then their components, each checked unreferenced;
2. then themes and files, each checked against the kept jobs.

Jobs and runs need a small `deleteJob(jobId)` operation:

- the job, its runs, overrides and model calls;
- its root page maps and captures;
- its S3 prefixes;
- the reference crops whose metadata names its runs;
- and it refuses while the job has a site, or while a run is running.

The team will need that operation anyway once they create and discard jobs. It is about an hour of
work, plus an API deploy and a check on one throwaway job. The deletion itself is scripted, with counts
before and after, and runs only on your go-ahead.

**The signature rule is still needed after a fresh start.** The validation site gained six leftovers in
one cycle inside its own tenant, which no root cleanup touches. A clean start without the rule would
accumulate from the first iteration.
