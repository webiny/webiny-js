# Session Handoff — 2026-10-17 — Workflows phase 8a built

## What was done

- Phase 8a (admin review experience for review steps) is built on `bruno/refactor/workflows-flow`, in ten sub-phases. The plan is `docs/.bruno/plans/2026-10-16-workflows-phase-8a/`.
  - 8a.1 review teams API and Website Builder revision delete: `0f1e610bdf`..`14c51dfecb` (`candidateTeams` on review steps, `deletePageRevision` with its workflows block and the revision-scoped cancel-for-delete, `userDisplayName` on skip entries, the stored `cancelledBy`).
  - 8a.2 admin foundations: `cdf981b969` (`GraphQLOperationError` in `@webiny/app`), `3f2daa2221` (link, duration, position, dismissible and error variant for `Notifications`).
  - 8a.3 shared client core in `app-workflows`: `bbddd549e3`..`6ea802456b` (domain, DTOs, fragments, gateway interface, `ReviewUseCases`, activity bus, cache-sync handler, toasts, notification service).
  - 8a.4 app gateways: `a6a2ad2a7c`, `779ef5ef44` (CMS), `7d87997902` (WB).
  - 8a.5 review view: `8762e6f15b`..`47cd42ed31` (target review presenter, bar, popover, tooltip, action dialogs, reviewer picker, reassign dialog, request dialog, details drawer, editor session, conflict refresh of the host).
  - 8a.6 CMS editor and list: `290007c591`..`137436bd51`.
  - 8a.7 WB editor and list: `58aaabe6eb`..`3ec282ad68`.
  - 8a.8 Content Reviews, widgets, notifications: `9430117488`..`c89149741f`, plus `29f9e3316c` and `f2d410722f` (cache writers update only the review's own revision; lists and widgets queue a live signal that arrives during a load).
  - 8a.9 trash and delete warning: `2e24720873`..`4c27c6c373` (typed errors from the base delete gateways, the shared guard and warning dialog, the CMS and WB base fixes, the guards in both apps).
  - 8a.10 cleanup and docs: `cd48de6eff`, `8e8662f008` (old admin review UI deleted), then the docs commit (D157-D159, spec 4.2, 5.1, 9.6, 10, 12, 13.1-13.8, roadmap, `app.md`, `integrations.md`, `README.md`, `bugs.md`).
- The shared core in `app-workflows` is app-neutral; each app package holds only its GraphQL documents, gateway, registration, content adapter, cache writer and glue. Content Reviews exists once per app.

## Key decisions

- D157: trash and delete warning driven by the server refusal; the normal dialog runs first, Confirm cancels and repeats once, covers trash, revision delete, permanent delete and bulk.
- D158: review steps carry `candidateTeams { id name }`, resolved at read time; phase 7 texts keep "the team pool".
- D159: shared admin core in `app-workflows`, app-owned documents and glue; no logic is duplicated across the app packages.
- User answers worth remembering: Q16 commit trailer; Q17 hide the WB "New Revision" while a review is in progress; Q18 permissions follow the content; Q19 an unpublished reviewed page can be published again; Q21 skipped-by-assignment names; Q23 `cancelledBy` and the viewer's team names from `Identity`; Q25 the CMS revision delete confirm bug is fixed in this phase; Q26 admin is mouse and keyboard only; Q27 a bulk retry's results dialog lists only the retried items; Q28 the first-pass bulk toast text; Q29 and Q30 tag colours (only Failed is destructive; the review-level and step Rejected tags are neutral-dark; progress segments stay red for rejected).
- Rulings: a shared class is never bound with `createImplementation`, each app subclasses it in its own `<App><Name>Impl.ts` and binds the subclass under its own token; fixtures live in `review/testing/` of `app-workflows`; the CMS list Move action is gated while a review is in progress; the WB has no trash-bin hook (a trashed page cannot have an active review).
- Layering rule: shared presenters depend on use-case interfaces, never on a gateway; app glue passes its use cases in.
- Test conventions of the admin packages: composition tests from the gated roots, `yarn test` by file path only, no whole-suite runs.
- Trailer format: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and `Claude-Session: <session url>`.

## Current state

- Branch `bruno/refactor/workflows-flow`, nothing pushed. Tests ran per task by file path; builds are green for `@webiny/app-workflows`, the two app packages and `@webiny/app-serverless-cms`.
- Known gaps:
  - A bulk action over "all selected" content runs as a background task; refusals inside it are not visible to the client, so that path has no pre-warning (D157).
  - The workflow list cache of `ReviewUseCases` is not invalidated when the editor saves a workflow (9a adds invalidation).
  - Phase 7 websocket and e-mail texts still say "the team pool" (no team names).
  - The generalised `Picker` waits for 9b; 8a has a small `ReviewerPicker`.
  - The WB revision delete has no first confirmation dialog, so the warning is its only dialog.
  - A bulk retry's results dialog shows only the retried items (accepted).
  - The admin is desktop only: no touch behaviour.
  - A `Workflows/NotAuthorized` read cannot hit a user who has access to the content.
  - An unpublished reviewed page republishes without a new review; a page published before the workflow was bound has no review and the server refuses with `Workflows/Review/PublishBlocked`, shown as an error toast.
  - Website Builder `useRevision.deleteRevision` fires without await or catch, so a rethrown guard error is an unhandled rejection (pre-existing; candidate for a small `fix(app-website-builder)`).
- The local design catalogue (`docs/.bruno/workflows/design/catalogue.md`, not committed) is marked for the review screens that 8a built; see the report of the docs task for any skipped file.

## What might come next

- Phase 8b: Failed and running states, Restart, the Failed steps tab, run history, AI issues and the Background task link in the drawer, extending the live-update bus. The hand-off list is in the roadmap row 8b.
- Then 9a-9c (workflow editor, notification types, permissions).
- First actions for the next agent: read `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md` rows 8b and 9a, and `docs/.bruno/workflows/app.md` sections 3, 7 and 9.
