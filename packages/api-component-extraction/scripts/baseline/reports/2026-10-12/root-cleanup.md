# Root cleanup, step 1: superseded pages and their components (2026-10-12)

Pages and components in root only. No run, job, artifact or tenant was touched, and nothing in any site
tenant.

## What it buys

A root page's size follows root's Library: every page served from root carries every component bundle in
it (`ai-context/issues/every-page-ships-its-tenants-whole-component-library.md`). That costs a visitor
loading a root page. It does not slow the admin, and the pipeline reads root's Library only at stage 9,
for the name-collision list. The sites in the demo plan are served from their own tenants:
`71westlandbaselined555` (the lead) and `71westlandrehearsal202614962` (the fallback). Root serves only
what is opened from the composed pages panel, or a live run composed in root.

## Before

- **Root pages: 824.**
  - 42 published, all in a current page map.
  - 54 unpublished but listed in an older run's page map: 2424 Tulane runs 1 and 3, and Park city Palace
    runs 1–4.
  - 725 unpublished and in no page map: compositions replaced by later ones.
  - 3 drafts, one with no job namespace.
- **By job:** 2424 Tulane 275, Park city Palace 224, 71 Westland Apartments 220, Freehill Street Lofts
  44, Validation webiny.com 33, The Vibe 27, and the unattributed draft.
- **Root components: 323.**
  - 169 referenced by some root page, 41 of them by a published one.
  - 79 belong to the five jobs with site tenants (Take 3, the 71 Westland rehearsal, ParkCityPlace
    Baseline, 71Westland Baseline, Validation webiny.com).
- **Site tenants are self-contained.** Each of the five renders only from its own Library: every
  reference resolves there, and none shares a component id with root. Deleting from root cannot change
  what a site shows.

## Cannot be deleted safely

- **The 79 components of the five site jobs.** The site build copies components from root by the ids
  Promote recorded, so deleting them breaks "Publish again" for those sites, the fallback included.
- **The 42 published pages and the 54 listed in older runs' page maps.** They back the composed pages
  panel of those runs (Open, Edit, the comparison), and the published ones are live at root's paths.
- **The 3 drafts.** One cannot be attributed to any job, and a draft may be someone's edit.
- **The 71 components referenced by those kept pages.**

## Done

1. **725 pages moved to the bin** (`deletePage` without `permanently`). They can be restored. Each was
   re-checked as still unpublished right before it was deleted. None failed.
2. **75 components deleted:** those referenced only by the binned pages (Park city Palace 23,
   71 Westland Apartments 20, 2424 Tulane 16, Freehill Street Lofts 16). Each was re-checked right before
   deletion against a fresh read of root's remaining pages and the site jobs. None was skipped.
   **Component deletion is permanent:** restoring a binned page does not bring its components back.

## After

- **Root pages:** 99 (42 published, 54 unpublished in a page map, 3 drafts). 725 in the bin.
- **Root components:** 248.
- **Size of a root page** (`/webiny-vs-strapi`, `/`), 2 minutes after the deletes: **4.32 MB, 248
  bundles**, down from 6.13 MB and 323.
- **Unchanged:** all five site tenants (pages and components), and the 79 site-job components in root.

## Held for a decision

- **98 components no root page has ever referenced**, so not "their components":
  - jobs with no pages and no site: 2424Tulane Fixes Check 10, 2424Tulane Baseline 2 10, ParkCityPlace
    Baseline 2 8, 71Westland Baseline 2 8, 2424Tulane Baseline 8, Freehill Baselines and Fixes Check 19;
  - The Vibe 25, 2424 Tulane 8, and 1 each from 71 Westland Apartments and Park city Palace.

  Deleting them would leave root at 150 components, about 2.6 MB a page. Those jobs could then not
  compose or publish without approving again.

- **The kept pages and their 71 components.** The floor without them is the 79 site-job components,
  about 1.4 MB a page. Below that, stage 9 would have to approve into the site tenant directly
  (see the issue).
