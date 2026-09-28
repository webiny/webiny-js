# Audit Fix Plan (non-security) — v4

Source: the repo-wide audit in `docs/reports/` (index: `docs/reports/README.md`), audit commit `19c9ca1b91`. Security findings are out of scope here.

**Scope:** the README top finding per package plus the other significant findings listed below. It is not every entry in every report — each report's Bugs table has more (about 200 high/medium entries in total).

## How to use this plan

- **Verify first.** Only items marked ✅ or 🔍 in the *Repro* column were checked by a second pass. ✅ means the bug was reproduced by running code; 🔍 means it was confirmed by reading the code only, so write the failing test first. First-pass ratings were often overstated, so for every other item the first step is to reproduce it, ideally as a failing test, and record the result in the *Repro* column: ✅ reproduced, ❌ refuted (drop the item), or ☐ not yet checked.
- **Done when** (default for every item): a regression test fails before the fix and passes after, and the finding in the linked report is marked fixed. Extra criteria are listed per item.
- **Size:** S = under a day, M = a few days, L = a week or more / needs a design decision.
- **One PR per item** (or per Phase A root cause), referencing the item ID.
- **Owner:** assign when an item is picked up.
- **Before starting an item**, check with the plan owner whether the same files are being changed elsewhere.

## Phase A — shared root causes

| ID | Root cause | Instances | Fix | Size | Repro |
|---|---|---|---|---|---|
| A1 | Async loaders without a stale-response guard | [cms-nextjs](../../reports/level-02/cms-nextjs.md) entry fetch; [app-headless-cms](../../reports/level-06/app-headless-cms/entries-and-renderers.md) `loadRevision`; [app-file-manager](../../reports/level-07/app-file-manager/file-list-and-details.md) `loadFile`; [app-headless-cms-scheduler](../../reports/level-07/app-headless-cms-scheduler.md) `fetchModel`/`fetchEntry`; [app-website-builder](../../reports/level-08/app-website-builder/presentation.md) `PageEditor`; app-headless-cms entries `search(query)` (`searchOptions` from the last response to resolve); [ai-powerups](../../reports/level-09/ai-powerups/admin.md) generation responses | Shared "latest request wins" helper (request token / AbortController). Do `PageEditor` and `loadRevision` first — they can save to the wrong record; the others are display-only. | M | ☐ |
| A2a | Check-then-write without an atomic condition | [background-tasks](../../reports/level-07/background-tasks.md) task claim; [api-record-locking](../../reports/level-07/api-record-locking.md) lock acquire; [api-core-sql](../../reports/level-05/api-core-sql.md) `TableManager.ensure()` | Conditional writes (DynamoDB `ConditionExpression`, SQL unique constraint / `ON CONFLICT`). Independent of Q1 (server-side lock enforcement is B3.8). | M | ☐ |
| A2b | Optimistic versioning for concurrent updates | same packages | Separate design decision (Q6) — do not bundle with A2a. | L | — |
| A3 | Same bug copied into several places | `decodeCursor` ASCII bug in [utils](../../reports/level-01/utils.md) and [db-dynamodb](../../reports/level-04/db-dynamodb.md); unvalidated `JSON.parse(cursor)` in [api-search-index-tasks-ddb-os](../../reports/level-10/api-search-index-tasks-ddb-os.md); hardcoded 900s timer in [api-sync-ddb-to-opensearch](../../reports/level-04/api-sync-ddb-to-opensearch.md) and [api-sync-pg-to-opensearch](../../reports/level-04/api-sync-pg-to-opensearch.md). Also consolidate the third `"ascii"` decode in [api-opensearch](../../reports/level-02/api-opensearch.md) `cursors.ts` (most-used copy; inert today because items are URI-encoded) | One UTF-8, validated cursor codec used everywhere; timer from the real Lambda context. | S | 🔍 timer, ✅ cursor (agent repro) |
| A4 | Over-eager validation caching | [@webiny/form](../../reports/level-01/form.md) `FormValidator` (also: `registerField` applies a default from a stale closed-over value inside `requestAnimationFrame`); [app-admin form model](../../reports/level-03/app-admin/form-model.md) `Field.ts` | Invalidate on `setValue`; include `requiredWhen` state in the cache key. | S | ☐ |
| A5 | Broken instance caches | [aws-sdk](../../reports/level-02/aws-sdk.md) Step Functions client never cached, DynamoDB decorate flag never read; [app-utils](../../reports/level-02/app-utils.md) `Date.now()` cache key | Fix cache writes/keys; test that instances are reused. | S | 🔍 |
| A6 | `Result.value` read without `isFail()` | [api-website-builder redirects route](../../reports/level-08/api-website-builder/experiments-and-redirects.md); [api-website-builder-scheduler](../../reports/level-09/api-website-builder-scheduler.md) cancel handlers | Review sweep for unchecked `.value`; consider a helper or lint rule. Low priority. | S | 🔍 |

## Phase B — bugs by area

### B1. Data correctness and storage

| ID | Item | Size | Repro |
|---|---|---|---|
| B1.1 | [api-sync-system](../../reports/level-05/api-sync-system.md): DocumentClient helper-method writes captured twice; `Fetcher.exec` throws instead of returning per-bundle errors; Cognito worker actions swallow failures. | M | ☐ |
| B1.2 | [api-headless-cms-ddb-es](../../reports/level-09/api-headless-cms-ddb-es.md): primary-table and ES-bridge writes not atomic (entries left unsearchable). | M | ☐ |
| B1.3 | Unique-values aggregation hardcodes size 1,000,000 in [ddb-es](../../reports/level-09/api-headless-cms-ddb-es.md) and [pg-os](../../reports/level-09/api-headless-cms-pg-os.md). | S | 🔍 |
| B1.4 | [api-headless-cms-pg-os](../../reports/level-09/api-headless-cms-pg-os.md): OpenSearch path skips storage converters that ddb-es applies. | M | ☐ |
| B1.5 | [api-opensearch](../../reports/level-02/api-opensearch.md): dynamic-template `match` patterns are regexes but `match_pattern` defaults to glob (affects every CMS index — [utils-os](../../reports/level-07/api-headless-cms-utils-os.md)). Done when also: reindex path for existing indexes documented. | M | ☐ |
| B1.6 | [api-audit-logs-ddb](../../reports/level-10/api-audit-logs-ddb.md): `expiresAt` not declared on the entity, so TTL never fires. Done when also: note for existing records without TTL. | S | 🔍 |
| B1.7 | "List revisions" order differs between [api-headless-cms-ddb](../../reports/level-08/api-headless-cms-ddb.md) and [api-headless-cms-sql](../../reports/level-08/api-headless-cms-sql.md). | S | ☐ |
| B1.8 | [api-headless-cms-storage](../../reports/level-07/api-headless-cms-storage.md): `searchable-json` where-filters crash via [db-utils](../../reports/level-01/db-utils.md) `StartsWithFilter` on non-string values. | S | ☐ |
| B1.9 | [api-search-index-tasks](../../reports/level-08/api-search-index-tasks.md) marks an index done before creation succeeds; [api-search-index-tasks-os](../../reports/level-09/api-search-index-tasks-os.md) swallows `list()` errors. | S | ☐ |
| B1.10 | [api-aco](../../reports/level-08/api-aco.md): folder move has no cycle detection. | S | ☐ |
| B1.11 | [website-builder-sdk](../../reports/level-01/website-builder-sdk.md): reachable null dereference in `DocumentStore.applyPatch`. | S | ☐ |
| B1.12 | [api-sync-to-opensearch](../../reports/level-03/api-sync-to-opensearch.md) logs double-counted totals; [api-websockets-sql](../../reports/level-06/api-websockets-sql.md) re-runs schema introspection on every call. | S | ☐ |

### B2. Background tasks, scheduling and messaging

| ID | Item | Size | Repro |
|---|---|---|---|
| B2.1 | [background-tasks](../../reports/level-07/background-tasks.md): a `RUNNING` task can run again concurrently; status guards reimplemented 3×. [AWS](../../reports/level-08/background-tasks-aws.md) and [standalone](../../reports/level-08/background-tasks-standalone.md) transports don't deduplicate triggers. Depends on A2a; add deterministic execution names. | M | ☐ |
| B2.2 | [api-scheduler-aws](../../reports/level-08/api-scheduler-aws.md) falls back to a no-op scheduler on transient service-discovery errors; [standalone](../../reports/level-08/api-scheduler-standalone.md) never retries failed jobs. | M | ☐ |
| B2.3a | Scheduler path of the `DateTimePicker` timezone bug ([app-scheduler](../../reports/level-06/app-scheduler.md), [api-scheduler](../../reports/level-07/api-scheduler.md)): `dateTimeLocal` sends a local wall-clock time labelled UTC. Fix it in the scheduler only; do not change `DateTimePicker` itself. Done when also: converted in all three places — on send (`SchedulePublishActionGateway`, `ScheduleUnpublishActionGateway`), in `createMinDateValidator` (app-scheduler bug #2), and on load/display of an existing scheduled action. Temporary: B2.3b removes this conversion. | S | ✅ |
| B2.3b | Global `DateTimePicker` fix. Changing it changes what every consumer stores (incl. CMS datetime fields), and existing values are ambiguous. Blocked by decision Q5. Done when also: the B2.3a scheduler-side conversion is removed, so values are not converted twice. | M/L | ✅ |
| B2.4 | [api-scheduler](../../reports/level-07/api-scheduler.md): cancel deletes the tracking entry even if the EventBridge delete fails (orphaned schedule). | S | ☐ |
| B2.5 | [api-headless-cms-bulk-actions-aws](../../reports/level-04/api-headless-cms-bulk-actions-aws.md): handler ignores the trigger result and returns success. | S | ☐ |
| B2.6 | [api-headless-cms-scheduler](../../reports/level-08/api-headless-cms-scheduler.md): two delete-cancellation handlers overlap. | S | ☐ |
| B2.7 | [api-websockets-standalone](../../reports/level-06/api-websockets-standalone.md): client messages never reach route handlers. [api-websockets](../../reports/level-05/api-websockets.md): no `GoneException` cleanup; hardcoded 3-hour cutoff hides long-lived connections. | M | ☐ |
| B2.8 | [event-handler-aws](../../reports/level-03/event-handler-aws.md): `apiGatewayEventToHttpRequest` ignores `isBase64Encoded`. | S | ☐ |
| B2.9 | [webhooks](../../reports/level-08/webhooks.md): signing/verification mismatch (see report). | S | ☐ |
| B2.10 | [api-file-manager-s3](../../reports/level-09/api-file-manager-s3.md): no cleanup of abandoned multipart uploads. | S | ☐ |

### B3. Headless CMS

| ID | Item | Size | Repro |
|---|---|---|---|
| B3.1 | [api-headless-cms crud](../../reports/level-06/api-headless-cms/crud-and-utils.md): reserved system field IDs allowed on model create/update (only import rejects them) — `crud`/`domain` schemas drifted. Dynamic-zone converter drops vs throws on unknown templates. | M | ☐ |
| B3.2 | [api-headless-cms models](../../reports/level-06/api-headless-cms/models.md): code-defined models skip field/storageId uniqueness. | S | ☐ |
| B3.3 | [app-headless-cms model editor](../../reports/level-06/app-headless-cms/model-editor.md): no fieldId uniqueness check. | S | ☐ |
| B3.4 | [app-headless-cms features](../../reports/level-06/app-headless-cms/features.md): `mapCmsValidators` drops the combined schema when a field has 2+ schema-producing validators (`required` doesn't count) — also fix the intersection `reduce` that seeds with `schemas[0]` and intersects it again; bulk actions and model import skip cache invalidation. | S | 🔍 validators |
| B3.5 | [api-headless-cms content entry](../../reports/level-06/api-headless-cms/content-entry.md): publish/republish/unpublish return the pre-storage-transform entry. | S | ☐ |
| B3.6 | [cms-sdk](../../reports/level-01/cms-sdk.md): resolved references treated as unresolved on every patch. | M | ☐ |
| B3.7 | [validation](../../reports/level-00/validation.md): `dateGte`/`dateLte` throw on bad config and CMS swallows the error. | S | ✅ |
| B3.8 | [api-record-locking](../../reports/level-07/api-record-locking.md): no server-side enforcement of record locks on entry mutations (bug #2). Per Q1: a decorator on `UpdateEntryUseCase`/`PublishEntryUseCase`/`UnpublishEntryUseCase`/`DeleteEntryUseCase` rejects writes by a non-owner while an unexpired lock exists (`EntryLockedError`); system writes under `withoutAuthorization` (tasks, scheduler, bulk actions) pass; API keys are treated as non-owners; no full-access bypass (force-unlock exists); expired lock = unlocked; no check when the `recordLocking` flag is off. Tests cover each of these cases. | M | ☐ |

### B4. Website Builder

| ID | Item | Size | Repro |
|---|---|---|---|
| B4.1 | [api-website-builder pages](../../reports/level-08/api-website-builder/pages-and-graphql.md): page path uniqueness never enforced; lookup returns an arbitrary match; duplicate appends a single "-copy". Done when also: plan for existing duplicate paths. | M | ☐ |
| B4.2 | [app-website-builder editor SDK](../../reports/level-08/app-website-builder/editor-sdk-and-misc.md): undo/redo sends an empty diff to the preview. | S | ☐ |
| B4.3 | [app-website-builder features](../../reports/level-08/app-website-builder/features.md): settings cache written before the mutation succeeds, no rollback; `DeletePageRevisionRepository` never removes the revision from `PageRevisionsCache`, and the description update never updates it. | S | ☐ |
| B4.4 | [api-website-builder experiments](../../reports/level-08/api-website-builder/experiments-and-redirects.md): redirect loops not prevented; experiment start race. (Route crash is A6.) | S | ☐ |
| B4.5 | [website-builder-vue](../../reports/level-02/website-builder-vue.md): store keyed by `document.id` vs `document.properties.id`; Vue manifests lack `aiContext`. | S | ☐ |
| B4.6 | [app-website-builder BaseEditor](../../reports/level-08/app-website-builder/base-editor.md): module-level drag state shared across editor instances. | S | ☐ |
| B4.7 | [api-website-builder-workflows](../../reports/level-09/api-website-builder-workflows.md): publish gate throws on any lookup failure other than NotFound (`ValidateWorkflowStateOnPageBeforePublish`). Do together with C7. | S | ☐ |
| B4.8 | [website-builder-nuxt](../../reports/level-03/website-builder-nuxt.md): per Q3, ship a Nitro server middleware (`@webiny/website-builder-nuxt/server`) matching [website-builder-nextjs](../../reports/level-03/website-builder-nextjs.md) `createWebsiteBuilderMiddleware`: `X-Tenant` from `wb.tenant`, `X-Preview-Params` built from `wb.*` params with `no-store` cache headers while previewing, and the `wb_ab_vid` visitor cookie. Also: `src/index.ts` comment claims `X-Preview-Params` is synthesized but the code does not — fix it; check manually whether Nuxt preview works today. Put tenant/preview-param parsing in `website-builder-sdk` so both frameworks share it (see C6). Done when also: setup documented. | S | ☐ |

### B5. CLI, build and project tooling

| ID | Item | Size | Repro |
|---|---|---|---|
| B5.1 | [cli-core](../../reports/level-03/cli-core.md): `LinkProjectCommand` calls `open()` without importing it. | S | ✅ |
| B5.2 | [project features](../../reports/level-02/project/features-and-extensions.md): `RunnableBuildProcess` has no `error`/`exit` handlers. | S | ☐ |
| B5.3 | [project services](../../reports/level-02/project/services-and-utils.md): remote-Pulumi-backend env var detection disagrees between two services; `AdminAfterBuildExt` hooks included twice; `getVersionFromVersionFolders` sorts versions as strings (5.9 above 5.40). | M | ☐ |
| B5.4 | [create-webiny-project](../../reports/level-02/create-webiny-project.md): `--hosting-type server` documented but only `standalone` recognized. | S | ☐ |
| B5.5 | [cli-aws](../../reports/level-05/cli-aws.md): `allow-production` declared as number but read as boolean. [system-requirements](../../reports/level-00/system-requirements.md) exits 0 on failure (`process.exit()` with no code); fix it there — both CLIs call it as-is. | S | 🔍 type |
| B5.6 | [pulumi-sdk](../../reports/level-00/pulumi-sdk.md): Linux ARM64 downloads the x64 binary. | S | ☐ |
| B5.7 | [build-tools](../../reports/level-00/build-tools.md): build/watch helpers ignore definition-time config; `linkWorkspaces.js` "already linked" check compares the link path to itself, so it never skips. | S | ☐ |
| B5.8 | [project-aws extensions](../../reports/level-04/project-aws/extensions-and-features.md): `set-variant` is an empty TODO; admin env vars set in two places that disagree. | S | ☐ |
| B5.9 | [api-event-handler-aws-ddb-os](../../reports/level-12/api-event-handler-aws-ddb-os.md): OpenSearch endpoint becomes `https://undefined` when its env var is unset. | S | ☐ |

### B6. Admin UI and frontend

| ID | Item | Size | Repro |
|---|---|---|---|
| B6.1 | [app](../../reports/level-02/app.md): `useRoute` leaks a MobX reaction per mount (~49 call sites). `getLink()`/`SimpleLink` ignore `baseUrl` (not verified). | S | ✅ leak |
| B6.2 | [app-websockets](../../reports/level-04/app-websockets.md): `onOpen` stored in the `close` bucket; `useEffect` cleanup never closes the socket. | S | ✅ onOpen |
| B6.3 | [admin-ui primitives](../../reports/level-02/admin-ui/primitives.md): `CodeEditor` uses Monaco `defaultValue` (stale audit-log preview — [app-audit-logs](../../reports/level-04/app-audit-logs.md)). | S | ☐ |
| B6.4 | [admin-ui navigation](../../reports/level-02/admin-ui/navigation-and-data.md): sidebar id is `btoa` of a ReactNode label (collisions; plan inference, not in report: `btoa` may throw on non-Latin-1 labels). | S | ☐ |
| B6.5 | [app-admin components](../../reports/level-03/app-admin/components-and-base.md): `ColumnsVisibilityUpdater` drops plain-value updates; `UiStateProvider`/`AdminUiStateProvider` mounted twice; [form model](../../reports/level-03/app-admin/form-model.md) `TabsBuilder.before()/after()` are no-ops. | S | ☐ |
| B6.6 | [app-admin features](../../reports/level-03/app-admin/features-and-permissions.md): logout calls async `clear()` without `await` and fires the IdP callback twice. | S | 🔍 |
| B6.7 | [app-audit-logs](../../reports/level-04/app-audit-logs.md): list stuck loading on error. | S | ☐ |
| B6.8 | [app-workflows](../../reports/level-04/app-workflows.md): Content Reviews widget under-counts after approve/reject. | S | ☐ |
| B6.9 | [app-file-manager features](../../reports/level-07/app-file-manager/features-and-modules.md): one `AbortController` per batch; results matched by filename; `GetFileFeature` registered twice. | S | ☐ |
| B6.10 | [react-composition](../../reports/level-00/react-composition.md): `DecoratorPlugin` builds a new HOC per render — confirm real remounts before changing. | S | ☐ |
| B6.11 | Smaller UI bugs: [lexical-editor-actions](../../reports/level-03/lexical-editor-actions.md) stale memo; [lexical-theme](../../reports/level-00/lexical-theme.md) cache-key collision; [i18n-react](../../reports/level-01/i18n-react.md) falsy interpolation; [react-properties](../../reports/level-01/react-properties.md) dropped positioning; [app-admin-ui](../../reports/level-04/app-admin-ui.md) "undefined undefined" name. | S each | ☐ |

### B7. Other

| ID | Item | Size | Repro |
|---|---|---|---|
| B7.1 | [feature](../../reports/level-00/feature.md): `BaseError` wipes the native stack trace (api and admin copies). | S | ✅ |
| B7.2 | [api-core core services](../../reports/level-04/api-core/core-services.md): JWKS cache never expires; identity-provider key rotation breaks auth until restart. | S | ☐ |
| B7.3 | [cognito](../../reports/level-05/cognito.md): `UpdateUserUseCase` uses the new email as `Username` when setting a password, so email+password updates silently fail. Also: `UpdateUserUseCase`/`DeleteUserUseCase` change the local user before calling Cognito and never roll back on failure. | S | ☐ |
| B7.4 | [languages](../../reports/level-07/languages.md): `GetDefaultLanguage`/`GetLanguageByCode` return disabled languages. | S | ☐ |
| B7.5 | [i18n](../../reports/level-00/i18n.md): locale-specific formats never apply. | S | ☐ |
| B7.6 | [api-workflows](../../reports/level-07/api-workflows.md): reviewer e-mail notifications wired but never sent. | S | ☐ |
| B7.7 | ~~[api-mailer](../../reports/level-04/api-mailer.md): unconfigured SMTP silently uses a dummy transport.~~ Dropped per Q2: works as intended. | — | ❌ by design |
| B7.8 | [sdk](../../reports/level-00/sdk.md): `createFiles` fail-fast leaves in-flight uploads creating records. | S | ☐ |
| B7.9 | [api-graphql](../../reports/level-03/api-graphql.md): `RefInputScalar` throws `TypeError` on non-object input. | S | ✅ (agent repro) |
| B7.10 | Smaller correctness issues: [plugins](../../reports/level-00/plugins.md) register misclassification; [mcp](../../reports/level-00/mcp.md) Copilot adapter + `serve` typo; [telemetry](../../reports/level-01/telemetry.md) opt-out event never sent; [api-event-handler-aws](../../reports/level-11/api-event-handler-aws.md) tenant header handling differs between API Gateway and Function URL paths; [event-handler-core](../../reports/level-01/event-handler-core.md) `Vary` overwrite. | S each | ☐ |
| B7.11 | ~~[webiny](../../reports/level-14/webiny.md): re-exports ~85 deep internal paths pinned `0.0.0`.~~ Dropped per Q4: deep re-exports are by design; `0.0.0` is the monorepo convention (versions set at publish). | — | ❌ by design |

## Phase C — duplication to consolidate

Highest value first (drift has already caused bugs):

| ID | Item | Size |
|---|---|---|
| C1 | Roles / Teams / API Keys CRUD triplicated on backend ([api-core security](../../reports/level-04/api-core/security.md)) and frontend ([app-admin presentation](../../reports/level-03/app-admin/presentation.md)); frontend copy has already drifted in one path. | L |
| C2 | `crud/` vs `domain/` model schemas in [api-headless-cms](../../reports/level-06/api-headless-cms/crud-and-utils.md) (caused B3.1). | M |
| C3 | Legacy vs new field-editor rules/permissions editors in [app-headless-cms admin](../../reports/level-06/app-headless-cms/admin.md). | M |
| C4 | Two live folder-tree implementations in [app-aco](../../reports/level-05/app-aco/components.md). | M |
| C5 | `ListCache` copies: [admin-ui pickers](../../reports/level-02/admin-ui/pickers.md) ×3, [app-admin](../../reports/level-03/app-admin/features-and-permissions.md), [app-website-builder](../../reports/level-08/app-website-builder/editor-sdk-and-misc.md), `api-core` roles decorator ([api-core security](../../reports/level-04/api-core/security.md)). Decide frontend vs backend placement before merging. | M |
| C6 | Website-builder bindings: [React](../../reports/level-02/website-builder-react.md)/[Vue](../../reports/level-02/website-builder-vue.md) and [Next.js](../../reports/level-03/website-builder-nextjs.md)/[Nuxt](../../reports/level-03/website-builder-nuxt.md) — move shared logic into `website-builder-sdk`. | L |
| C7 | CMS vs website-builder scheduler ([CMS](../../reports/level-08/api-headless-cms-scheduler.md), [WB](../../reports/level-09/api-website-builder-scheduler.md)) and workflow ([CMS](../../reports/level-09/api-headless-cms-workflows.md), [WB](../../reports/level-09/api-website-builder-workflows.md)) integrations. | M |
| C8 | [api-file-manager-s3](../../reports/level-09/api-file-manager-s3.md) re-implements [api-file-manager](../../reports/level-08/api-file-manager.md) upload utilities — import them instead. | S |
| C9 | Smaller: reference resolution ×3 in [cms-sdk](../../reports/level-01/cms-sdk.md); esbuild config and AI provider resolution in [remote-components](../../reports/level-10/remote-components.md); `useResizableSplit` in both [playgrounds](../../reports/level-04/app-graphql-playground.md); `cleanupApiKey` ×4 in [api-audit-logs](../../reports/level-09/api-audit-logs.md); box-model editors ×4 in [BaseEditor](../../reports/level-08/app-website-builder/base-editor.md); field renderers ×15 in [app-admin](../../reports/level-03/app-admin/components-and-base.md); `FeatureFlagsGate` in both templates ([project-template-base](../../reports/level-10/project-template-base.md)). | S each |

## Phase D — dead code to remove

Confirm with CodeGraph/grep before deleting; small PRs.

| ID | Item | Size |
|---|---|---|
| D-1 | [api-headless-cms-es-tasks](../../reports/level-08/api-headless-cms-es-tasks.md) (~7.6k lines, no consumers). | S |
| D-2 | [logger](../../reports/level-00/logger.md) (no consumers; cli-core reimplements it). | S |
| D-3 | Legacy plugin filter system in [api-headless-cms-storage](../../reports/level-07/api-headless-cms-storage.md). | S |
| D-4 | [db](../../reports/level-03/db.md) concrete classes and [db-dynamodb](../../reports/level-04/db-dynamodb.md) `DynamoDbDriver`. | S |
| D-5 | [app-utils](../../reports/level-02/app-utils.md) List and Sorting subsystems; [website-builder-react](../../reports/level-02/website-builder-react.md) `src/image/*`; [app-aco](../../reports/level-05/app-aco/features-and-presentation.md) `UncontrolledFolderTree`; [project-aws](../../reports/level-04/project-aws/pulumi.md) `SyncSystemLambda` chain; [api-aco](../../reports/level-08/api-aco.md) `ListCache`/`FoldersCacheFactory`; [project-standalone](../../reports/level-04/project-standalone.md) app builders. | S each |
| D-6 | Unused exports listed in each report's Dead code section ([handler](../../reports/level-01/handler.md), [utils](../../reports/level-01/utils.md), [cms-sdk](../../reports/level-01/cms-sdk.md), [lexical-nodes](../../reports/level-01/lexical-nodes.md), [website-builder-sdk](../../reports/level-01/website-builder-sdk.md), [api](../../reports/level-02/api.md) `Context`, others). | S each |

## Phase E — test gaps

| ID | Item | Size |
|---|---|---|
| E1 | Heavily used packages with no tests: [error](../../reports/level-00/error.md) (~260 consumers), [feature](../../reports/level-00/feature.md), [api-event-handler-core](../../reports/level-10/api-event-handler-core.md) (`registerApiRequestStack` order), [api-headless-cms-testing](../../reports/level-07/api-headless-cms-testing.md), [pulumi](../../reports/level-03/pulumi.md). | M |
| E2 | Concurrency and failure paths behind B1/B2 (double execution, non-atomic writes, partial failures). | M |
| E3 | Packages with zero tests: [lexical-editor](../../reports/level-02/lexical-editor.md), [mcp](../../reports/level-00/mcp.md), [sdk](../../reports/level-00/sdk.md), [wcp](../../reports/level-00/wcp.md), [app-headless-cms-workflows](../../reports/level-07/app-headless-cms-workflows.md), [app-record-locking](../../reports/level-07/app-record-locking.md), [self-hosted-auth-sql](../../reports/level-06/self-hosted-auth-sql.md), [api-audit-logs-ddb](../../reports/level-10/api-audit-logs-ddb.md)/[sql](../../reports/level-10/api-audit-logs-sql.md), [api-headless-cms-sql](../../reports/level-08/api-headless-cms-sql.md) (harness exists), smoke tests per storage variant ([aws-ddb-os](../../reports/level-12/api-event-handler-aws-ddb-os.md), [standalone-sql](../../reports/level-12/api-event-handler-standalone-sql.md)). | L |
| E4 | Every Phase B fix lands with its regression test (counts toward this phase). | — |

## Decisions needed before implementation

| ID | Question | Blocks |
|---|---|---|
| Q1 | ✅ Decided 2026-09-28: enforce server-side (details in B3.8). | B3.8 |
| Q2 | ✅ Decided 2026-09-28: the dummy transport is intended; a send through it counts as sent. No change. | B7.7 (dropped) |
| Q3 | ✅ Decided 2026-09-28: full parity — Nuxt gets its own middleware (B4.8). | B4.8, C6 |
| Q4 | ✅ Decided 2026-09-28: `webiny` stays as is — it is the public contract and re-exports internal paths by design. | B7.11 (dropped) |
| Q5 | Timezone: after fixing the scheduler path, change `DateTimePicker` globally? How to treat already-stored `dateTimeLocal` values? | B2.3b |
| Q6 | Optimistic versioning for concurrent updates. | A2b |

## Suggested order

1. Reproduce and fill the *Repro* column for Phase A and the B items you intend to do next.
2. Phase A: A3 and A5 (small, code-confirmed), then A1 (start with `PageEditor`/`loadRevision`), A4, A2a.
3. Cheap user-visible fixes: B5.1, B6.1, B6.2, B6.6, B7.1, B2.3a.
4. Remaining Phase B by area, one area per PR series.
5. Phase C items that remove copies touched by Phase B (C2 with B3.1, C8, C5).
6. Phase D and Phase E alongside; they block nothing.
7. Decisions Q1–Q6 in parallel, before the items they block.
