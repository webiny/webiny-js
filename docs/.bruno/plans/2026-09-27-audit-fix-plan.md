# Audit Fix Plan (non-security)

Source: the repo-wide audit in `docs/reports/` (index: `docs/reports/README.md`), audit commit `19c9ca1b91`. Security findings are out of scope here.

## How to use this plan

- **Verify before fixing.** Only a handful of these findings were checked by a second, stronger pass (marked ✅). The security verification showed that first-pass ratings were often overstated, so treat every unmarked item as "probable". The first step of each item is to reproduce it, ideally as a failing test.
- **One PR per item or per root cause**, each with a regression test that fails before the fix.
- **Fix the shared root cause first** (Phase A). Several bugs are copies of the same mistake, and a shared helper fixes them together and prevents recurrence.
- Each item links to the package report that holds the file:line details.

## Phase A — shared root causes (fix once, fix many)

| # | Root cause | Instances | Fix |
|---|---|---|---|
| A2 | Async loaders without a stale-response guard | `cms-nextjs` entry fetch, `app-headless-cms` `loadRevision`, `app-file-manager` `loadFile`, `app-headless-cms-scheduler` `fetchModel`/`fetchEntry`, `app-website-builder` `PageEditor`, `ai-powerups` generation responses | Add a shared "latest request wins" helper (request token / AbortController) and use it in every listed loader. The `PageEditor` and `loadRevision` cases can save to the wrong record, so do those first. |
| A3 | Check-then-write without an atomic condition | `background-tasks` task execution, `api-record-locking` lock acquisition, `api-core-sql` `TableManager.ensure()` | Use conditional writes (DynamoDB `ConditionExpression`, SQL unique constraints / `ON CONFLICT`) and optimistic versioning. |
| A4 | Copy-pasted helpers carrying the same bug | `decodeCursor` ASCII bug in [utils](../../reports/level-01/utils.md) and [db-dynamodb](../../reports/level-04/db-dynamodb.md); hardcoded 900s timer in both [sync adapters](../../reports/level-04/api-sync-ddb-to-opensearch.md); `ListCache` in 5–6 places (admin-ui ×3, app-admin, app-website-builder, api-aco) | One cursor codec (UTF-8, validated) used everywhere; one timer from the real Lambda context; one `ListCache` in a shared package. |
| A5 | Over-eager validation caching | [@webiny/form](../../reports/level-01/form.md) `FormValidator`, [app-admin form model](../../reports/level-03/app-admin/form-model.md) `Field.ts` | Invalidate cached validation on `setValue` and include `requiredWhen` state in the cache key. |
| A6 | Broken instance caches | [aws-sdk](../../reports/level-02/aws-sdk.md) Step Functions client never cached, DynamoDB decorate flag never read; [app-utils](../../reports/level-02/app-utils.md) `Date.now()` cache key | Fix the cache writes/keys; add tests asserting reuse. |
| A7 | `Result.value` read without `isFail()` | Redirects REST route, website-builder scheduler cancel handlers | Add a lint/type helper or review sweep for `.value` on unchecked `Result`s. |

## Phase B — high-impact bugs by area

### B1. Data correctness and storage

- [api-sync-system](../../reports/level-05/api-sync-system.md): writes via DocumentClient helper methods are captured twice (wraps both `send` and `put`/`delete`/...); `Fetcher.exec` throws instead of returning per-bundle errors; Cognito worker actions swallow failures.
- [api-headless-cms-ddb-es](../../reports/level-09/api-headless-cms-ddb-es.md): primary-table and ES-bridge writes are not atomic — failures leave entries unsearchable. Unique-values aggregation hardcodes size 1,000,000 (also in [pg-os](../../reports/level-09/api-headless-cms-pg-os.md)).
- [api-headless-cms-pg-os](../../reports/level-09/api-headless-cms-pg-os.md): OpenSearch path skips storage converters that ddb-es applies.
- [api-opensearch](../../reports/level-02/api-opensearch.md): dynamic-template `match` patterns are regexes but `match_pattern` defaults to glob, so `id`/date fields never get their mapping (affects every CMS index — [utils-os](../../reports/level-07/api-headless-cms-utils-os.md)).
- [api-audit-logs-ddb](../../reports/level-10/api-audit-logs-ddb.md): `expiresAt` not declared on the entity, so TTL never fires and audit logs grow forever.
- [api-headless-cms-ddb](../../reports/level-08/api-headless-cms-ddb.md) vs [sql](../../reports/level-08/api-headless-cms-sql.md): "list revisions" returns opposite orders.
- [api-headless-cms-storage](../../reports/level-07/api-headless-cms-storage.md): `searchable-json` where-filters can crash via [db-utils](../../reports/level-01/db-utils.md) `StartsWithFilter` on non-string values.
- [api-search-index-tasks](../../reports/level-08/api-search-index-tasks.md): index marked done before creation succeeds; [api-search-index-tasks-os](../../reports/level-09/api-search-index-tasks-os.md) swallows `list()` errors.

### B2. Background tasks and scheduling reliability

- [background-tasks](../../reports/level-07/background-tasks.md): a `RUNNING` task can run again concurrently; status guards reimplemented 3× with different sets. Neither [AWS](../../reports/level-08/background-tasks-aws.md) nor [standalone](../../reports/level-08/background-tasks-standalone.md) transport deduplicates triggers (random Step Functions execution name; standalone always spawns a worker). Fix with A3 plus deterministic execution names.
- [api-scheduler-aws](../../reports/level-08/api-scheduler-aws.md): transient service-discovery errors fall back to a no-op scheduler, so schedules silently don't exist. [Standalone](../../reports/level-08/api-scheduler-standalone.md) never retries failed jobs.
- ✅ [app-scheduler](../../reports/level-06/app-scheduler.md) / [api-scheduler](../../reports/level-07/api-scheduler.md): `admin-ui` `DateTimePicker` (`dateTimeLocal`) appends `.000Z` to a local time and the backend takes it at face value — scheduled publish/unpublish fires offset by the user's timezone. Fix in `DateTimePicker` (send a real UTC instant) and audit every `dateTimeLocal` consumer.
- [api-scheduler](../../reports/level-07/api-scheduler.md): cancel deletes the tracking entry even when the EventBridge delete fails (orphaned schedule).
- [api-headless-cms-bulk-actions-aws](../../reports/level-04/api-headless-cms-bulk-actions-aws.md): handler ignores the trigger result and always returns success.
- [api-sync-ddb-to-opensearch / pg](../../reports/level-04/api-sync-ddb-to-opensearch.md): hardcoded remaining time (A4).

### B3. Headless CMS correctness

- [api-headless-cms crud](../../reports/level-06/api-headless-cms/crud-and-utils.md): reserved system field IDs allowed on model create/update (only import rejects them) — `crud` vs `domain` schemas drifted. Dynamic-zone converter drops vs throws on unknown templates.
- [api-headless-cms models](../../reports/level-06/api-headless-cms/models.md): code-defined models skip field/storageId uniqueness.
- [app-headless-cms model editor](../../reports/level-06/app-headless-cms/model-editor.md): no fieldId uniqueness check.
- [app-headless-cms features](../../reports/level-06/app-headless-cms/features.md): `mapCmsValidators` drops the schema for fields with 2+ validators (validators silently off); bulk actions and model import skip cache invalidation.
- [api-headless-cms content entry](../../reports/level-06/api-headless-cms/content-entry.md): publish/republish/unpublish return the pre-storage-transform entry.
- [cms-sdk](../../reports/level-01/cms-sdk.md): resolved references treated as unresolved on every patch (refetch + full values replacement).
- [validation](../../reports/level-00/validation.md) + CMS: `dateGte`/`dateLte` throw on bad config and the error is swallowed.

### B4. Website Builder

- [api-website-builder pages](../../reports/level-08/api-website-builder/pages-and-graphql.md): page path uniqueness never enforced; path lookup returns an arbitrary match; duplicate appends a single "-copy".
- [app-website-builder editor SDK](../../reports/level-08/app-website-builder/editor-sdk-and-misc.md): undo/redo sends an empty diff to the preview.
- [app-website-builder features](../../reports/level-08/app-website-builder/features.md): settings cache written before the mutation succeeds, no rollback.
- [api-website-builder experiments](../../reports/level-08/api-website-builder/experiments-and-redirects.md): redirects route crashes instead of 403 (A7); redirect loops not prevented; experiment start race.
- [website-builder-vue](../../reports/level-02/website-builder-vue.md): store keyed by `document.id` vs `document.properties.id` in React/LiveSdk; Vue manifests lack `aiContext`.
- [app-website-builder BaseEditor](../../reports/level-08/app-website-builder/base-editor.md): module-level drag state shared across editor instances.

### B5. CLI, build and project tooling

- ✅ [cli-core](../../reports/level-03/cli-core.md): `LinkProjectCommand` calls `open()` without importing it — `link-project` throws at runtime.
- [project features](../../reports/level-02/project/features-and-extensions.md): `RunnableBuildProcess` has no `error`/`exit` handlers — build crashes or hangs on worker failure.
- [project services](../../reports/level-02/project/services-and-utils.md): remote-Pulumi-backend env var detection disagrees between two services, so the production local-state check can be skipped.
- [create-webiny-project](../../reports/level-02/create-webiny-project.md): `--hosting-type server` documented but only `standalone` recognized.
- [cli-aws](../../reports/level-05/cli-aws.md): `allow-production` declared as number but read as boolean. Both CLIs ignore the [system-requirements](../../reports/level-00/system-requirements.md) failure exit code (exits 0).
- [pulumi-sdk](../../reports/level-00/pulumi-sdk.md): Linux ARM64 downloads the x64 binary.
- [build-tools](../../reports/level-00/build-tools.md): `createBuildAdmin`/`createWatchAdmin`/`createBuildFunction`/`createWatchFunction` ignore definition-time config.
- [project-aws extensions](../../reports/level-04/project-aws/extensions-and-features.md): `set-variant` command is an empty TODO; admin env vars set in two places that disagree.
- [webiny](../../reports/level-14/webiny.md): re-exports ~85 deep internal paths pinned `0.0.0`.

### B6. Admin UI and frontend

- ✅ [app](../../reports/level-02/app.md): `useRoute` leaks a MobX reaction per mount (~49 call sites); `getLink()`/`SimpleLink` ignore `baseUrl`.
- ✅ [app-websockets](../../reports/level-04/app-websockets.md): `onOpen` stores subscriptions in the `close` bucket.
- [admin-ui primitives](../../reports/level-02/admin-ui/primitives.md): `CodeEditor` uses Monaco `defaultValue` (stale content, e.g. audit-log preview — [app-audit-logs](../../reports/level-04/app-audit-logs.md)).
- [admin-ui navigation](../../reports/level-02/admin-ui/navigation-and-data.md): sidebar item id is `btoa` of a ReactNode label (collisions; may throw on non-Latin-1 labels).
- [app-admin components](../../reports/level-03/app-admin/components-and-base.md): `ColumnsVisibilityUpdater` drops plain-value updates; `UiStateProvider`/`AdminUiStateProvider` mounted twice.
- [app-admin features](../../reports/level-03/app-admin/features-and-permissions.md): logout calls `clear()` without `await` and fires the IdP callback twice.
- [app-audit-logs](../../reports/level-04/app-audit-logs.md): list stuck loading on error.
- [app-workflows](../../reports/level-04/app-workflows.md): Content Reviews widget under-counts after approve/reject.
- [app-file-manager features](../../reports/level-07/app-file-manager/features-and-modules.md): one `AbortController` per batch; results matched by filename; `GetFileFeature` registered twice.
- [react-composition](../../reports/level-00/react-composition.md): `DecoratorPlugin` builds a new HOC per render (possible subtree remounts) — verify impact first.
- [lexical-editor-actions](../../reports/level-03/lexical-editor-actions.md), [lexical-theme](../../reports/level-00/lexical-theme.md), [i18n-react](../../reports/level-01/i18n-react.md), [react-properties](../../reports/level-01/react-properties.md), [app-admin-ui](../../reports/level-04/app-admin-ui.md): smaller UI bugs (stale memo, cache-key collision, falsy interpolation, dropped positioning, "undefined undefined" name).

### B7. Other

- ✅ [feature](../../reports/level-00/feature.md): `BaseError` wipes the native stack trace for every domain error.
- [i18n](../../reports/level-00/i18n.md): locale-specific formats never apply (`lodashGet` on a string).
- [api-workflows](../../reports/level-07/api-workflows.md): reviewer e-mail notifications wired but never sent.
- [api-mailer](../../reports/level-04/api-mailer.md): unconfigured SMTP silently uses a dummy transport and reports success.
- [sdk](../../reports/level-00/sdk.md): `createFiles` fail-fast leaves in-flight uploads creating records after returning failure.
- [plugins](../../reports/level-00/plugins.md), [mcp](../../reports/level-00/mcp.md), [telemetry](../../reports/level-01/telemetry.md), [api-event-handler-aws](../../reports/level-11/api-event-handler-aws.md) (tenant header casing), [event-handler-core](../../reports/level-01/event-handler-core.md) (`Vary` overwrite): smaller correctness issues.

## Phase C — duplication to consolidate

Highest value first (each drift has already caused bugs):

- Roles / Teams / API Keys CRUD triplicated on backend ([api-core security](../../reports/level-04/api-core/security.md)) and frontend ([app-admin presentation](../../reports/level-03/app-admin/presentation.md)) — the frontend copy already dropped `token` in one path.
- `crud/` vs `domain/` model schemas in [api-headless-cms](../../reports/level-06/api-headless-cms/crud-and-utils.md) (drift caused B3's reserved-id bug).
- Legacy vs new field-editor rules/permissions editors in [app-headless-cms admin](../../reports/level-06/app-headless-cms/admin.md).
- Two live folder-tree implementations in [app-aco](../../reports/level-05/app-aco/components.md).
- Website-builder React/Vue bindings and Next.js/Nuxt integrations (logic that belongs in `website-builder-sdk`).
- CMS vs website-builder scheduler and workflow integrations.
- `api-file-manager-s3` re-implementation of api-file-manager upload utilities.
- Reference resolution implemented 3× in [cms-sdk](../../reports/level-01/cms-sdk.md); esbuild config and AI provider resolution in [remote-components](../../reports/level-10/remote-components.md); `useResizableSplit` in both playgrounds; `cleanupApiKey` ×4 in api-audit-logs; box-model editors ×4 in BaseEditor; field renderers ×15 in app-admin.

Per-package clone counts are in each report's Duplication section (jscpd output).

## Phase D — dead code to remove

Confirm with CodeGraph/grep before deleting, then remove in small PRs:

- Whole packages or subsystems: [api-headless-cms-es-tasks](../../reports/level-08/api-headless-cms-es-tasks.md) (~7.6k lines, no consumers), [logger](../../reports/level-00/logger.md), legacy plugin filter system in [api-headless-cms-storage](../../reports/level-07/api-headless-cms-storage.md), `db` concrete classes and `DynamoDbDriver`, `app-utils` List and Sorting subsystems, `website-builder-react` `src/image/*`, `UncontrolledFolderTree` in app-aco, `SyncSystemLambda` chain in project-aws.
- Exports and files: listed in each report's Dead code section (`handler`, `utils`, `cms-sdk`, `lexical-nodes`, `website-builder-sdk`, `api` `Context`, `api-aco` caches, `project-standalone` app builders, and others).

## Phase E — test gaps (priority)

1. Shared, heavily used packages with no tests: `error` (~260 consumers), `feature`, `api-event-handler-core` (`registerApiRequestStack` order), `api-headless-cms-testing` harness, `pulumi`.
2. Concurrency and failure paths behind B1/B2 (double execution, non-atomic writes, partial failures).
3. Packages with zero tests: `lexical-editor` (~90 files), `mcp`, `sdk`, `wcp`, `app-headless-cms-workflows`, `app-record-locking`, `self-hosted-auth-sql`, `api-audit-logs-*`, `api-headless-cms-sql` (harness exists, no tests), `webiny` smoke tests per storage variant.
4. Every Phase B fix lands with its regression test (counts toward this phase).

## Decisions needed before implementation

These are product/design questions rather than bugs:

1. **Record locking:** enforce locks server-side (reject updates to locked entries) or keep them advisory in the UI only?
3. **Mailer:** fail loudly when SMTP is not configured, or keep the silent dummy transport?
4. **website-builder-nuxt parity** with the Next.js preview/draft and A/B-cookie middleware.
5. **`webiny` meta package:** re-export curated package entry points instead of deep paths, and version them properly.
6. **Empty `packages/*` leftovers:** already removed.

## Suggested order

1. Phase A (A2, A3, A4 first) — each is small and closes several bugs.
2. B2 timezone bug and B5 `link-project`/build-process fixes (user-visible, verified or cheap to verify).
3. Remaining Phase B by area, one area per PR series.
4. Phase C consolidations that remove drift-prone copies touched by Phase B.
5. Phase D and Phase E alongside, as they don't block anything.
