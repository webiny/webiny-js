# @webiny/app-headless-cms — Features (DI layer)

> Level 6 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
This slice is the DI "features" backbone of `app-headless-cms`: ~230 small files under `src/features`, `src/domain`, `src/exports`, `src/utils` plus the top-level `HeadlessCMS.tsx`/`ContentEntriesModule.tsx`/`routes.ts`/`types.ts`, implementing every content-entry and content-model mutation (create/update/delete/publish/unpublish/move/clone/restore/bulk-action/etc.) as a strict Gateway → Repository → UseCase triad, one abstraction set per feature folder. The pattern is applied with impressive mechanical consistency (near-identical file shapes across ~40 feature folders) and correctly builds on lower-level packages (`@webiny/app`'s `GraphQLClient`/`EnvConfig`/`EventPublisher`, `@webiny/app-admin`'s `ListCache`/`TrashBinFeature`, `@webiny/feature/admin`'s `createAbstraction`/`createFeature`) rather than reimplementing them. Overall health is good structurally but has one confirmed critical logic bug in the shared Zod validator mapper (silently drops all non-`required` field validation once a field has 2+ validators) and a consistent, repeated gap where bulk/import operations skip the cache-invalidation step that every single-item operation performs. Test coverage for this ~230-file slice is essentially one test file.

## Public API
- `CmsGraphQLClient` (features/graphQLClient) — the CMS-manage-endpoint GraphQL client; consumed by nearly every gateway in this slice and re-exported via `exports/admin/cms.ts`.
- `EntryAfterCreateEventHandler` / `EntryAfterUpdateEventHandler` / `EntryAfterDeleteEventHandler` (features/contentEntry/events, re-exported via `exports/admin/cms.ts`) — real external consumers: `packages/languages` (`LanguageEntryAfter{Create,Update,Delete}Handler`), plus the equivalent backend events are consumed by `api-audit-logs`, `tenant-manager`, and `languages` (api side).
- `mapCmsValidators`/`mapCmsListValidators` (features/formModel/CmsValidationMapper.ts) and `applyFieldProps` (features/formModel/mappers/applyFieldProps.ts) — internal to the package, used by `CmsFormModelBuilder`/field mappers to build the admin entry-editing form.
- The ~40 feature triads (Gateway/Repository/UseCase per contentEntry, model and modelGroup operation) are internal DI wiring, consumed by `presentation/*` presenters (outside this slice) via `feature.ts` registration in `HeadlessCMS.tsx`.
- `CMS_PERMISSIONS_SCHEMA` (domain/permissionsSchema.ts) — passed to `@webiny/app-admin`'s `createPermissionSchema`, consumed by the permissions UI.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | critical | `packages/app-headless-cms/src/features/formModel/CmsValidationMapper.ts:103-113` | `mapCmsValidators` builds a combined Zod `schema` from all configured non-`required` validators (minLength/maxLength/pattern/gte/lte/in/dateGte/dateLte), but the final `return` does `schema: schemas.length <= 1 ? schema : undefined` — discarding the computed schema whenever 2 or more validators produce one. | A text field configured with both `minLength` and `maxLength` (or any two of the listed validators) in the content model: `applyFieldProps.ts:76-82` receives `schema: undefined` and never calls `builder.schema(...)`, so none of those validators are enforced in the admin content-entry form — the form accepts values that violate the model's configured constraints. Only a single validator (or `required` alone) still works. | high |
| 2 | high | `packages/app-headless-cms/src/features/contentEntry/bulkAction/BulkActionRepository.ts:7-13` | Unlike every single-item content-entry mutation in this slice (create/update/delete/publish/unpublish/move/restore, all of which call `this.cacheProvider.get(...).addItems/removeItems(...)`), `BulkActionRepository.execute` forwards straight to the gateway and never touches `ContentEntriesCacheProvider`. | `BulkActionUseCase` is the backing use case for `BulkPublishPresenter`, `BulkUnpublishPresenter`, `BulkDeletePresenter` and `BulkMovePresenter` (in `presentation/contentEntries/bulkActions`) and for the trash bin's bulk restore/delete gateway (`CmsTrashBinGatewayAdapter.ts:96-117`). Selecting multiple entries in the content-entries list and bulk-publishing/unpublishing/deleting/moving them succeeds on the server, but the `ListCache`-backed table (populated by `ListEntriesRepository`) is not updated, so affected rows keep showing stale status/location until the list is manually reloaded. | high |
| 3 | medium | `packages/app-headless-cms/src/features/model/importModels/ImportModelsUseCase.ts:4-14` (and `ImportModelsGateway.ts`) | Importing a content-model structure creates new models/model-groups server-side but the use case never calls `ModelsCache`/model-group cache `addItems`, unlike `CreateModelRepository`/`CreateModelGroupRepository`, which always add the newly created item to the cache. | After using "Import content models" (`ImportContentModelsPresenter`), the newly imported models won't appear in the content-models list (which reads from the cache) until the app is reloaded or the list is re-fetched some other way. | medium |
| 4 | medium | e.g. `packages/app-headless-cms/src/features/contentEntry/createEntry/CreateEntryGateway.ts:46-50`, and the same pattern repeated in ~15 gateways across `contentEntry/*` and `model/*` | Every gateway parses the GraphQL error object (`{ message, code, data }` — see `CmsErrorResponse` in `app-headless-cms-common`) but re-throws only `new Error(error?.message \|\| "...")`, discarding `code` and `data`. | Any caller further up the stack (presenters, error boundaries) can only ever branch on a message string; there is no way to distinguish, e.g., a validation error from a permission error from a conflict error by code, and several presenters (e.g. `ContentEntryFormPresenter.save/publishRevision/unpublishRevision`) already just do a bare `catch { return false }`, so with this gateway behaviour there is no path by which the underlying error code/data could ever reach the UI even if a presenter wanted to show it. | high |

## Duplication
Package-wide overview (whole-package jscpd report: 76 clones / 1211 duplicated lines out of 39,490 total lines, 3.07%), grouped by area:
| Area (both sides) | Clone pairs | Duplicated lines |
|---|---|---|
| `presentation/fieldTypes` (self) | 13 | 331 |
| `presentation/contentEntries` (self) | 13 | 162 |
| `presentation/fieldRenderers` (self) | 11 | 214 |
| `presentation/fieldValidators` (self) | 5 | 78 |
| `admin/plugins` (self) | 4 | 78 |
| `admin/config` (self) | 4 | 56 |
| **`features/contentEntry` (self) — in this slice** | 6 | 96 |
| **`features/formModel` (self) — in this slice** | 6 | 75 |
| `admin/components` (self / vs `presentation/fieldEditor`) | 6 | 60 |
| **top-level `HeadlessCMS.tsx` (self) — in this slice** | 2 | 62 |
| `presentation/cloneContentModel` vs `presentation/newContentModel` | 2 | 27 |
| `presentation/contentModels` vs `presentation/modelGroup` | 2 | 22 |
| remaining small pairs (fieldEditor renderers, permission components, cell components, validators, etc.) | ~8 | ~40 |

The largest concentrations (`fieldTypes`, `contentEntries`, `fieldRenderers`, `fieldValidators`, `admin/plugins`/`admin/config`) are all in `presentation/`/`admin/`, outside this slice.

Within this slice specifically:
- `features/contentEntry/*/…Gateway.ts` — the same "build GraphQL mutation, unwrap `{data, error}`, throw on missing data" boilerplate is repeated near-verbatim across `CreateEntryGateway.ts:41-70`, `UpdateEntryGateway.ts:49-70`, `UpdateSingletonEntryGateway.ts:49-70` (22-line clone), `PublishEntryGateway.ts:36-44` / `UnpublishEntryGateway.ts:36-44` (9-line clone), `DeleteEntryGateway.ts:6-26` / `PermanentlyDeleteEntryGateway.ts:6-26` (21-line clone), `ListDeletedEntriesGateway.ts:43-55` / `ListEntriesGateway.ts:50-62` (13-line clone). This is inherent to the Gateway pattern's lack of a shared base helper; a small `unwrapCmsResponse(response, fallbackMessage)` helper would remove most of it and also fix Bug #4 in one place.
- `features/formModel/CmsLayoutMapper.ts` — the "map `field.rules` to `{type, target, operator, value, action}`" block is duplicated 4 times in the same file (`mapSeparator:86-97`, `mapTabs` twice at `114-124`/`128-138`, `mapAlert:151-161`) and a 5th time in `mappers/applyFieldProps.ts:92-104`. Worth extracting to a single `mapRules(rules)` helper.
- `features/formModel/CmsValidationMapper.ts:17-42` vs `:116-140` — `mapCmsValidators`/`mapCmsListValidators` duplicate the `required`/`interpolateMessage` handling loop structure; low priority since the two functions genuinely differ (scalar vs. array schema), but the shared prefix (extract `validator`, `settings`, `msg`) could be a small shared iterator.
- Top-level `HeadlessCMS.tsx:84-128` — 11 near-identical `<AdminConfig.Form.FieldRenderer name={...} component={...} />` registrations; not worth deduplicating (declarative wiring), matches jscpd's self-clone finding.

## Dead code
None found with high confidence. Checked several candidates via codegraph and all have live consumers: `ValidateImportUseCase`/`ExportModelsUseCase`/`ListFolderPermissionsTargetsUseCase` (used by their respective presenters), and the frontend `EntryAfterCreate/Update/DeleteEventHandler` abstractions (consumed by `packages/languages`'s `LanguageEntryAfter*Handler` classes, not just internally). No suspiciously unused exports were found in `exports/`, `domain/`, or `utils/` — all are small and directly wired into `HeadlessCMS.tsx`/`ContentEntriesModule.tsx` or re-exported.

## Convention issues
- `features/contentEntry/abstractions.ts` bundles three unrelated abstractions (`EntryGraphQLFields`, `ContentEntriesCacheProvider`, `CmsModelContext`) in one file. Every other feature folder's `abstractions.ts` groups only the Gateway/Repository/UseCase triad of a single cohesive feature (an accepted pattern in this codebase), but these three serve different, independent concerns and would read more clearly as separate files, per the "one abstraction per file" convention. Minor.
- Otherwise the DI-naming convention (impl files named after the class, e.g. `CreateEntryRepository.ts` containing `CreateEntryRepositoryImpl`) and the Gateway/Repository/UseCase-per-file split are followed consistently across all ~40 feature folders — no other meaningful violations found.

## Test gaps
Only one test file exists anywhere in this slice: `features/formModel/mappers/applyFieldProps.test.ts`, and it exercises `applyFieldProps` with `validation: []` — it never passes multiple validators through, so it does not (and would not) catch Bug #1. None of the ~40 Gateway/Repository/UseCase triads under `features/contentEntry`, `features/model`, `features/modelGroup` have any test coverage, so:
- Cache-invalidation behaviour (the `cache.addItems`/`removeItems`/`updateItems` calls that are the main correctness property of the Repository layer) is entirely unverified, which is exactly where Bugs #2 and #3 live.
- Error-unwrapping logic in gateways (`throw new Error(error?.message || "...")`) has no test asserting what happens on a non-empty `error` object.
- `CmsValidationMapper`'s multi-validator combination path (the actual bug) has zero coverage.

## Recommendations
1. Fix `CmsValidationMapper.ts:113` to return the already-computed `schema` regardless of validator count (drop the `schemas.length <= 1 ? schema : undefined` gate), and add a test with 2+ validators (e.g. `minLength` + `maxLength`) to lock in the fix — this is silently breaking form validation today.
2. Make `BulkActionRepository` (and `ImportModelsUseCase`) invalidate/refresh the relevant cache (`ContentEntriesCacheProvider` / `ModelsCache`) the same way every single-item repository does, so bulk actions and imports don't leave the list UI stale.
3. Extract a shared `unwrapCmsResponse`/error-mapping helper for the ~15 near-identical gateway response-unwrapping blocks, and have it preserve `error.code`/`error.data` (e.g. as a typed error) instead of collapsing to a bare `Error(message)`, so upstream presenters/error boundaries can eventually branch on error kind instead of swallowing everything in bare `catch {}`.
