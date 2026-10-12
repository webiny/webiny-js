# Deleting a job

Built and held on 2026-10-12. Not deployed: the API and the admin ship together, after the 16th.

## The decisions

1. **The site's content first, then the tenant.** Deleting a tenant alone leaves its pages, components and
   files in storage where nothing can reach them (cespike1). The delete walks the site tenant's pages
   (the bin included), components, files and themes, checks each kind is empty, and stops before the
   tenant if any is not. Then it deletes the Tenant Manager entry permanently and checks that both the
   entry and the tenant are gone, because the delete handler hides a failure.
2. **A live site blocks the delete unless it is chosen too.** The site record is filed under the job, so
   deleting the job alone would leave a site serving that nothing in the admin points at. A site with
   no published page (a job approving into its own tenant, before its first publish) goes with the job,
   listed in the dialog rather than offered.
3. **Everything is permanent, said once:** "This can't be undone. Nothing here goes to a bin."
4. **Delete is in the table row menu and on the job page.** Not on board cards.
5. **The counts are what goes, after the sharing checks**, not what the job touched.

## What goes, and the sharing checks

| What | Where | Goes when |
| --- | --- | --- |
| Job, runs, overrides, model calls | private CMS models, root | always |
| Stage artifacts, ledger, generation logs | root key-value store, every version up to the current | always (rebuilt by key: the store cannot be listed) |
| Run blobs, composed screenshots | S3 `component-extraction/{runId}/` | always, every listing page until empty |
| Page maps, captures, site record | root key-value store | always |
| Composed pages in root | Website Builder, live or in the bin | in the job's page maps, or naming only its components |
| Components in root | Library | approved by the job, named by no page that stays, approved by no other job |
| Migrated images | root File Manager and S3, plus their index keys | used by no other job's run, any capture version |
| Reference images | root File Manager | their metadata names one of the job's runs |
| Theme | root | extracted by the job, pinned by no other job, not active |

On the dev instance's data (fixture `dev-instance-2026-10-12.json`):

- 2424 Tulane touches 88 images; 87 are the other four 2424 Tulane jobs' too, so 1 goes.
- TheVibe Baseline's 164 images go; 2 are shared and stay.
- The webiny.com extracted theme is pinned by two jobs, so deleting either keeps it.
- 2424 Tulane's 220 root pages are its compositions (33 not in the bin, 187 in it), with its 27
  components.

## What stays

- **The correction log.** It is the labelled record extraction is tuned against; the dialog says how
  many corrections stay.
- **In a deleted site tenant, any kind the walk does not cover:** users, content entries, key-value
  records. The dialog says so: "Anything else in the tenant, such as users or content entries, is not
  deleted and can't be reached afterwards."
- **A root page naming any component that is not the job's** (another job's, or built by hand), and so
  the job's components that page names.
- **Reference images made before 2026-10-09**, which share one File Manager record and name no run.

## How it runs

One background task (`pageCompositionPocDeleteJob`), in two modes:

- **Count**, when the dialog opens: it reads every job, run, root page and file, so it takes seconds,
  not a request's worth.
- **Delete**, on confirm: it counts again and stops if anything differs from what was shown, then holds
  the job's run slot and deletes in order: site content, tenant, root pages, components, images,
  reference images, theme, runs, job. Each step is recorded with what it did, and checked before the
  next. A stop leaves what is listed as done gone and nothing after it touched; counting again shows
  what is left, and the delete can run again.

## Before relying on it

Seen only in tests and typecheck. The deployed check needs a throwaway job, and a throwaway published
site for the site checkbox; publishing that site is a separate go-ahead.

Not yet seen against the platform: deleting a Tenant Manager entry from a task, deleting a site's active
theme after clearing the pointer, and whether `GetTenantById` caches the tenant within one invocation
(it would read as "still there" and stop the delete, safely).
