# Component extraction: two kinds of jobs

Read this before touching an existing job. Component extraction (`@webiny/api-component-extraction`)
crawls a site and generates Website Builder components; stage 9, **Approve components**, writes them to
a Library. Composition and the site build are `@webiny/api-page-composition-poc`; the admin is
`@webiny/app-component-extraction`.

## What changed

Since **2026-10-12 09:48 UTC** (the API deploy of commit `66e2656ce1`), jobs behave in one of two ways,
fixed when the job is created. **Nothing in the admin says which kind a job is.**

|                                            | Jobs created before 2026-10-12 09:48 UTC                                  | Jobs created after it (`siteTenantFromStart: true`)                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Stage 9 approves into                      | the extraction (root) tenant's Library                                    | the job's own site tenant, created at the first approval                                                 |
| Compose writes                             | published pages in root                                                   | **draft** pages in the site tenant, previewable before publish                                           |
| Publish site                               | copies theme, components, images and pages from root into the site tenant | publishes the drafts, bins the pages it replaces, removes superseded component copies no page names      |
| Root grows with each iteration             | yes                                                                       | no                                                                                                       |
| The live site between approval and publish | unchanged until publish                                                   | **carries both the old and the new components (+67% to +79% page size measured) until the next publish** |

**The jobs you inherit are the old kind and stay that way.** The flag is set only when a job is created;
re-approving an old job does not convert it. On the dev instance at handover, 26 jobs are old-style,
among them the five site jobs and the 71 Westland fallback. One is new-style: "Rehearsal — site tenant
(2026-10-12)". A job you create now is new-style.

### How to tell which kind a job is

- **API:** `componentExtractionListJobs { data { job { name siteTenantFromStart createdOn } } }`. `true` is
  new-style; `false` or `null` is old-style.
- **Admin, indirectly:** on a run's composed pages panel, a new-style job's button reads **"Compose
  drafts in the site"** (or "Compose the drafts again"); an old-style job's reads **"Compose pages"**. A
  new-style job's site view also reports components that "go live at the next publish". Neither label
  names the kind.

### Undoing it

The full procedure, with how to tell each step worked, is
[`scripts/baseline/reports/2026-10-12/site-tenant-revert-procedure.md`](../packages/api-component-extraction/scripts/baseline/reports/2026-10-12/site-tenant-revert-procedure.md).
In short: list the new-style jobs **first** (the flag disappears from the schema after the revert),
revert `ad436fe9a5 4757ebc07a 8cc81a4923 66e2656ce1`, build and deploy api and admin, then re-run stage 9
on each new-style job's latest run. Old-style jobs, including the fallback, are not touched.

### Further reading

All in `packages/api-component-extraction/scripts/baseline/reports/2026-10-12/`:

- `site-tenant-from-the-start-design.md`: the design, including the page-size property above and what
  would remove it.
- `site-tenant-rehearsal.md`: the deployed rehearsal and its measurements.
- `site-tenant-revert-procedure.md`: the revert.
