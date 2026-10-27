# Workflows: no queries in loops (2026-10-21)

The #6038 review found that `ListReviewsUseCase` reads storage per listed row. A sweep of the
workflows packages found 23 more storage/IO calls inside loops. This plan removes them. It is done
on the split branches (`bruno/feat/workflows-*`), one commit per affected part; the source branch
`bruno/refactor/workflows-flow` is not touched.

## Rule

No storage or IO call runs inside a loop (`for`, `map`, `forEach`, a per-item callback) unless it
truly cannot be batched. Collect the ids and make one batch call, or turn the check into a query
filter. A loop that must stay sequential (ordered event publishing, deliberate send batches) says
why in a comment.

## Decisions

- Q77 Review list read access becomes query filters, the way CMS lists work. The review row
  already stores what the read check uses: `model` (model and group), `targetContext.author.id`
  (own entries only) and `targetContext.folder.id` (folder permissions; it cannot change while the
  review is active, `ReviewTargetFolderChangeGuard`). Per request, once, the app adapter turns the
  viewer's permissions into a `ReviewListReadFilter`; the engine adds it to the repository query.
  A review row is listed exactly when its content would be listed in the CMS or Website Builder.
  A custom per-entry read check a project adds with a decorator is not applied, as CMS lists do
  not apply it either.
- Q78 Lists keep confirming listed rows against primary storage (R18), with one batch read
  (`GetEntriesByIds`) per storage page instead of one read per row.
- Q79 Every other loop is fixed with a batch API (`GetEntriesByIds`, `_in` filters, `ListUsers` /
  `ListTeams` with `id_in`), a request-scoped loader for lookups made by separate callers
  (GraphQL field resolvers), or work hoisted out of the loop. Calls with no batch API (CMS create)
  run with a small concurrency limit.
- Q80 oxlint `no-await-in-loop` is enabled for the workflows packages; each intentional sequential
  loop carries a disable comment with its reason.

## Phase 1: building blocks

1. `ReviewRepository.getMany(ids)` (#6037 interface, #6038 implementation): one
   `GetEntriesByIdsUseCase` call; missing ids are left out.
2. `ReviewRepository.listByTargets({ model, targetIds })`: `targetId_in` in chunks of 100
   (OpenSearch terms limit), confirmed with one `getMany` per page. `listByTarget` becomes the
   single-id case and stops reading each hit on its own (sweep item 7).
3. `ReviewListReadFilter` (domain type, #6037): `models` (readable namespaces), `ownOnlyModels`
   (namespaces the viewer reads only their own entries of) and `deniedFolderIds`. The repository
   maps it to `model_in`, an OR of `(model = X AND targetContext.author.id = viewer)` for own-only
   models, and `targetContext.folder.id_not_in`.
4. Folder rules per request, in the CMS and Website Builder packages: one
   `FolderLevelPermissions.listFolderLevelPermissions({ where: { type } })` per folder type,
   evaluated in memory with `canAccessFolderContent` (read). Folders without a record are
   readable; root is always readable. Check whether `listFolderLevelPermissions` itself calls
   `ListUserTeams` per record when teams are on (its `getDefaultPermissions` runs per record); if
   it does, load the teams once and evaluate the defaults ourselves.
5. A request-scoped team loader (`ReviewTeamLoader`) backed by `ListTeamsUseCase` with `id_in`,
   batching the calls GraphQL resolvers make in the same tick.

## Phase 2: high items

1. Review lists (sweep item 1):
   - `ListReviewsInput.canRead(review)` is replaced by `readFilter: ReviewListReadFilter`.
   - Per storage page: one list query with the filter, one `getMany` to confirm (Q78),
     `matchesReviewList` in memory, rows taken in order up to the limit. The scan cap stays as a
     guard only for rows the confirm drops. The keyset cursor stays at the last row taken.
   - `ListCmsEntryReviewsUseCase` and `ListWebsiteBuilderPageReviewsUseCase` build the filter:
     readable models from the CMS access control (`canAccessModel`, `canAccessGroup`,
     `canAccessOnlyOwnedEntries`) over the cached model list; for Website Builder, the page
     model and `WbPermissions` (`canRead("page")`, own-only); folders from Phase 1.4.
   - Issue 7 (a throwing read check logged nowhere) goes away with the callback.
2. Routing candidates (item 3): the target revision and the folder rules are read once per
   evaluation; the users `ListUsers` returned are passed into the read check instead of
   `GetUser` per candidate. New adapter method `filterReadableUsers({ target, users })`; each
   user's permissions are still evaluated as that user (D61, D133), with the target and folder
   data already loaded.
3. Blocking reviews (item 2): one `listByTargets` call for all entry ids, one batch read of the
   latest revisions (already batched), read checks in memory with the Phase 1.4 folder rules.
4. Delete paths (items 4, 9): `DeleteReviewsOnEntriesDeleteMultiple` and
   `BlockDeleteMultipleWhileInReview` use one `listByTargets` call; the latest revisions with
   `GetLatestEntriesByIdsUseCase`.
5. `candidateTeams` field (item 5): resolved through the Phase 1.5 loader.
6. Delete workflow (item 6): `listInProgressByWorkflow` confirms with `getMany`; the blocking
   review check reads targets in one batch per model and uses the Phase 1.4 folder rules.

## Phase 3: medium items

1. Delete cascade (item 8): list the assignment records of all affected reviews with
   `reviewId_in`, delete records and reviews with `DeleteMultipleEntriesUseCase` (50 per call).
   Check that it deletes permanently and that its events do not re-enter the workflows hooks.
2. `ReviewSaver` assignment records (item 10): created with a concurrency limit (no CMS
   create-multiple); each record has its own `assignedOn`, so order does not matter.
3. Least-loaded ties (item 11): one `assignments.list` with `userId_in`, scanned in memory.
4. `CancelTargetReviews` (item 12): the cancel-for-delete wrappers pass the reviews they already
   listed instead of listing again.
5. Q80: enable `no-await-in-loop` for `api-workflows`, `api-headless-cms-workflows`,
   `api-website-builder-workflows`; annotate the intentional loops (event publishing order,
   websocket batches of 10, the AI tool stale check, task aborts).

The low items (websocket sends in batches of 10, BCC chunks of 50, transports, a handful of
task aborts, cached model reads) stay as they are.

## Tests

- Each fix keeps its behaviour tests; storage-facing ones run on `ddb` and `ddb-os,ddb`.
- Query-count tests for item 1, item 2 and item 3: a decorator counts CMS list and get calls; a
  list call with N rows makes a fixed number of storage calls whatever N is.
- Read-filter tests: a viewer without model access, with own-only access, and with a denied
  folder sees exactly the reviews the CMS list would show.
- Only the affected test files are run, one test command at a time.

## Parts touched

#6037 (domain types), #6038 (review features), #6039 (routing, assignments, notifications),
#6040 (wiring), #6041 (tests), #6042 (CMS adapters and hooks), #6043 (WB adapters and hooks),
the lint config change with the `repo` part (#6077).

## Status: done (2026-10-22)

All three phases are built, tested on `ddb` and `ddb-os,ddb`, and split onto the parts. Changes
and decisions made along the way:

- Folder rules are loaded only for models with active reviews: `ListReviewedModelsUseCase` (one
  distinct-values query per request) feeds the CMS and Website Builder read filters, so a viewer
  of many models costs one folder query per reviewed model, not per readable model. The query
  filters `isActive: true` like `createReviewListWhere`; both carry a comment tying them together.
- ACO lists folder permissions by one type at a time and, with teams on, loads the user's teams
  once per folder record. ACO is unchanged (a comment marks the N+1 in `FolderLevelPermissions`).
  Routing candidates load all candidates' teams once; `CandidateFolderReadRules` copies ACO's
  `GetDefaultPermissionsWithTeams` for that, with teams-on tests and a keep-in-step comment.
- CMS `DeleteMultipleEntriesUseCase` published its events with every requested entry, also the
  ones it skipped for lack of access. The events now carry only the deleted entries, so the
  workflows delete-multiple hook trusts the payload and reads nothing.
- The OpenSearch test stream harness threw on batch deletes of records missing from the OpenSearch
  table (never-published entries); it now skips them like DynamoDB and its single-delete path,
  which lets the review and assignment repositories batch-delete with `DeleteMultipleEntries`.
- Routing checks the target users of every user-target rule with one call before walking the
  rules; unreached rules' users are now checked too (in memory, no extra storage reads).
- Saving a workflow reads its user targets with one `ListUsers` call (found by the lint rule).
- `no-await-in-loop` is an error for the three workflows packages' `src`; every remaining loop with
  an `await` carries a disable comment with its reason (paging, chunks, in-memory checks, ordered
  events, send batches).
- Left as is: on plain DynamoDB, api-core `ListUsers` scans all users per call, so notification
  recipients cost one scan per 200-id chunk; it is a real query on OpenSearch.
