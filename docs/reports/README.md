# Code Audit Reports

Bottom-up audit of the packages in `packages/`. Packages are grouped by dependency level: level 0 has no internal `@webiny/*` dependencies, and each higher level depends only on lower levels. One report per package, at `level-XX/<package-dir>.md`.

Findings are produced by LLM agents (plus `jscpd` for copy-paste detection) and are **not verified** unless marked otherwise. Confirm each finding before fixing it.

Audited at commit `19c9ca1b91`.

Security findings are not described in committed reports. They are referenced by ID (`SEC-n`) and kept in `docs/.reports/security.md`, which is gitignored.

## Progress

| Level | Packages | Status |
| ----- | -------- | ------ |
| 0     | 20       | Done   |
| 1     | 11       | Done   |
| 2     | 16       | Done   |
| 3     | 11       | Done   |
| 4     | 17       | Done   |
| 5     | 14       | Done   |
| 6     | 7        | Done   |
| 7     | 13       | Done   |
| 8     | 15       | Done   |
| 9     | 17       | Done   |
| 10–14 | 15       | Done   |

All 156 packages with a `package.json` are audited. The 10 remaining directories under `packages/` are empty leftovers, listed in [_empty-package-dirs.md](_empty-package-dirs.md).

## Level 0 — top findings

| Package | Finding | Severity | Verified |
| ------- | ------- | -------- | -------- |
| [feature](level-00/feature.md) | `BaseError` constructor sets `this.stack = options?.stack`, wiping the native stack trace for every domain error that does not pass `options.stack` (none do). | High | Yes |
| [i18n](level-00/i18n.md) | Locale format getters call `lodashGet(this.locale, "formats.date")`, but `locale` is a string, so locale-specific formats never apply. | Medium | No |
| [build-tools](level-00/build-tools.md) | `createBuildAdmin` / `createWatchAdmin` / `createBuildFunction` / `createWatchFunction` ignore the config passed at definition time, so documented options are silently no-ops. | Medium | No |
| [react-composition](level-00/react-composition.md) | `createDecoratorFactory` builds a new HOC on every render of `DecoratorPlugin`; the store diffs HOCs by reference, which may remount decorated subtrees. | Medium | Plausible |
| [sdk](level-00/sdk.md) | `createFiles` fail-fast mode throws inside `p-map`, but in-flight uploads keep running and create file records after a failure `Result` is returned. | Medium | No |
| [lexical-theme](level-00/lexical-theme.md) | `Theme.from` caches by caller-supplied `$cacheKey`; `textToLexicalState` omits it, so unrelated themes collide on the key `"undefined"`. | Medium | No |
| [pulumi-sdk](level-00/pulumi-sdk.md) | `getDownloadFilename` hardcodes `linux-x64`; Linux ARM64 hosts download an incompatible binary. | Medium | No |
| [system-requirements](level-00/system-requirements.md) | `process.exit()` with no code on failed requirements exits with 0. | Medium | No |
| [plugins](level-00/plugins.md) | `register()` misclassifies a plugin without `type` and `name` as the options object and silently drops it. | Medium | No |
| [validation](level-00/validation.md) | `dateGte` / `dateLte` throw `RangeError` on an invalid comparison value instead of a useful validation message. | Low | No |
| [wcp](level-00/wcp.md) | `canUseFileManagerThreatDetection()` skips the `fileManager.enabled` check other gates perform. | Low–Medium | No |
| [mcp](level-00/mcp.md) | Copilot adapter omits `--additional-skills`; `instructions.ts` prints `webiny-mcp server` instead of `serve`. | Medium | No |
| [shared-aco](level-00/shared-aco.md) | `Permissions.create` only strips inherited permissions matching the current parent, so stale ones survive a re-parent. | Medium | No |
| [logger](level-00/logger.md) | Package has no consumers; `cli-core` reimplements the same logger. | Low (dead code) | No |

Packages with no significant findings: [aws-layers](level-00/aws-layers.md), [common-audit-logs](level-00/common-audit-logs.md), [error](level-00/error.md), [feature-flags](level-00/feature-flags.md), [global-config](level-00/global-config.md), [icons](level-00/icons.md).

## Level 1 — top findings

| Package | Finding | Severity | Verified |
| ------- | ------- | -------- | -------- |
| [lexical-nodes](level-01/lexical-nodes.md) | Security finding SEC-1 (private). Also: 5 typography nodes duplicate style-id/theme-class boilerplate. | High | Yes |
| [website-builder-sdk](level-01/website-builder-sdk.md) | Security finding SEC-2 (private). Also: reachable null dereference in `DocumentStore.applyPatch`. | High | Partly |
| [form](level-01/form.md) | `FormValidator.validateField` reuses a stale cached `isValid` when the field has a value, so values changed via `form.setValue()` skip re-validation. | Medium | No |
| [cms-sdk](level-01/cms-sdk.md) | `EntryStore` treats already-resolved references as unresolved on every patch, refetching and replacing the values tree on each edit. Ref resolution is implemented three times. | Medium | No |
| [utils](level-01/utils.md) | `decodeCursor` uses `"ascii"` while `encodeCursor` uses UTF-8, corrupting non-ASCII cursor payloads. | Medium (latent) | Reproduced by agent |
| [db-utils](level-01/db-utils.md) | `StartsWithFilter.canUse()` accepts non-string values that make `matches()` throw on `toLowerCase()`. | Low | No |
| [telemetry](level-01/telemetry.md) | `DisableTelemetryCommand` disables telemetry before sending the opt-out event, so the event is never sent. | Low | No |
| [i18n-react](level-01/i18n-react.md) | Truthiness check renders falsy interpolation values (`0`, `""`, `false`) as the placeholder name. | Low | No |
| [react-properties](level-01/react-properties.md) | `replace` combined with `before`/`after` silently drops positioning. | Low | No |
| [event-handler-core](level-01/event-handler-core.md) | `SecureHeadersDecorator` overwrites an existing `Vary` header instead of merging. | Low (latent) | No |
| [handler](level-01/handler.md) | No bugs; mostly Fastify-migration leftovers with 3 unused exports. | — | — |

## Level 2 — top findings

`admin-ui` and `project` are split into slice reports under `level-02/admin-ui/` and `level-02/project/`.

| Package | Finding | Severity | Verified |
| ------- | ------- | -------- | -------- |
| [app](level-02/app.md) | `useRoute` starts a MobX `autorun` in `useEffect` without returning the disposer, leaking one reaction per mount (~49 call sites). `getLink()` and `SimpleLink` ignore `baseUrl`. | Medium | Leak: yes |
| [project — features](level-02/project/features-and-extensions.md) | `RunnableBuildProcess` has no `error`/`exit` handlers: a spawn failure crashes `webiny build`, a crashed worker hangs it. | High | No |
| [project — services](level-02/project/services-and-utils.md) | `IsRemotePulumiBackendService` and `PulumiLoginService` disagree on remote-backend env vars, so the production local-state safety check can be skipped. | High | No |
| [aws-sdk](level-02/aws-sdk.md) | `createStepFunctionClient` never populates its cache (new `SFNClient` per call); DynamoDB "decorate once" flag is never checked. | High | No |
| [create-webiny-project](level-02/create-webiny-project.md) | `--help` documents `--hosting-type server`, but only `"standalone"` is recognised, silently creating an AWS project. | High | No |
| [app-utils](level-02/app-utils.md) | Repository factories fall back to a `Date.now()` cache key, so no-namespace calls never hit cache. Two whole subsystems are dead. | Medium | No |
| [api-opensearch](level-02/api-opensearch.md) | Dynamic-template `match` patterns are regexes but `match_pattern` defaults to glob, so they never match. | Medium | No |
| [admin-ui — primitives](level-02/admin-ui/primitives.md) | `CodeEditor` passes `value` as Monaco `defaultValue`, so it shows stale content (visible in audit-log Preview). | Medium | No |
| [admin-ui — navigation](level-02/admin-ui/navigation-and-data.md) | Sidebar item id is `btoa` of a `ReactNode` label; JSX labels collide and share pin/expand state. | Medium | No |
| [admin-ui — pickers](level-02/admin-ui/pickers.md) | `ListCache` copy-pasted into three components; AutoComplete/MultiAutoComplete heavily duplicated. | Duplication | Yes (jscpd) |
| [website-builder-vue](level-02/website-builder-vue.md) | Keys `documentStoreManager` by `document.id` while React and `LiveSdk` use `document.properties.id`; Vue component manifests lack `aiContext`. | Medium | No |
| [website-builder-react](level-02/website-builder-react.md) | Whole `src/image/*` submodule is unexported and unused. | Low (dead code) | No |
| [cms-nextjs](level-02/cms-nextjs.md) | Entry fetch effect has no stale-response guard. | Medium | No |
| [api](level-02/api.md) | About half of `Context` (`waitFor`, result helpers, `decorateContext.ts`) is dead code. | Low (dead code) | No |
| [lexical-editor](level-02/lexical-editor.md) | No tests across ~90 source files. | Test gap | — |
| [event-handler-standalone](level-02/event-handler-standalone.md), [sdk-frontend](level-02/sdk-frontend.md) | Security findings SEC-3, SEC-5 (private). SEC-4 affects website-builder React/Vue. | High | No |

No significant findings: [lexical-converter](level-02/lexical-converter.md), [api-headless-cms-bulk-actions-standalone](level-02/api-headless-cms-bulk-actions-standalone.md).

## Level 3 — top findings

| Package | Finding | Severity | Verified |
| ------- | ------- | -------- | -------- |
| [cli-core](level-03/cli-core.md) | `LinkProjectCommand` calls `open(wcpAppUrl)` without importing `open`; TypeScript accepts it via the DOM `window.open` type, so `link-project` throws `ReferenceError` at runtime. | High | Yes |
| [api-graphql](level-03/api-graphql.md) | `RefInputScalar` uses `"id" in value` without an object check, so a numeric/boolean RefInput throws `TypeError` instead of a validation error. | Low | Reproduced by agent |
| [event-handler-aws](level-03/event-handler-aws.md) | `apiGatewayEventToHttpRequest` ignores `event.isBase64Encoded` (the Function URL translator handles it), so base64-encoded bodies reach routes undecoded. Also security finding SEC-6 (private). | Medium | No |
| [lexical-editor-actions](level-03/lexical-editor-actions.md) | `LexicalColorPicker` memoizes `themeColors` with an empty dependency array, so swatches go stale when the theme changes. | Medium | No |
| [db](level-03/db.md) | `Db` and `Store` have no consumers; `db-dynamodb` uses only the type contracts. `DbRegistry.register` sorts `input.tags` in place. | Low (dead code) | No |
| [api-sync-to-opensearch](level-03/api-sync-to-opensearch.md) | Logs `operations.total` (double-counts) instead of `operations.count`. | Low | No |
| [pulumi](level-03/pulumi.md) | No bugs; no tests despite ~30 module definitions built on it. | Test gap | — |
| [app-admin — form model](level-03/app-admin/form-model.md) | Per-field validation cache is keyed only by the field value, not by `requiredWhen()` state, so a field made required by another field returns a stale "valid" result. | Medium | No |
| [app-admin — features](level-03/app-admin/features-and-permissions.md) | `LogOutUseCase` calls `authContext.clear()` without `await` and invokes `logoutCallback` twice. Also SEC-16 (private). | Medium | No |
| [app-admin — presentation](level-03/app-admin/presentation.md) | Roles/Teams/API Keys presenters and views are a three-way copy; `ApiKeysPresenter` duplicate `form.setData` block misses `token`. | Duplication | Yes (jscpd) |
| [app-admin — components](level-03/app-admin/components-and-base.md) | `ColumnsVisibilityUpdater.update` drops plain-value updates. `UiStateProvider`/`AdminUiStateProvider` duplicated and mounted twice. | Medium | No |
| [website-builder-nextjs](level-03/website-builder-nextjs.md) | Security finding SEC-7 (private). | Medium | No |
| [website-builder-nuxt](level-03/website-builder-nuxt.md) | No equivalent of the Next.js preview/draft and A/B-cookie middleware. | Low (parity) | No |

## Level 4 — top findings

| Package | Finding | Severity | Verified |
| ------- | ------- | -------- | -------- |
| [api-core — security](level-04/api-core/security.md) | Security findings SEC-17 (critical) and SEC-18 (private). Roles/Teams/API Keys CRUD use cases copy-pasted three times. | Critical | No |
| [api-core — core services](level-04/api-core/core-services.md) | `JwksCache` never expires and `clearCache()` has no callers, so IdP key rotation breaks auth until restart. Also SEC-14, SEC-15 (private). | High | No |
| [project-aws — pulumi](level-04/project-aws/pulumi.md) | Security findings SEC-8 to SEC-12 (infrastructure defaults, private). Dead `SyncSystemLambda` chain. | High | No |
| [project-aws — extensions](level-04/project-aws/extensions-and-features.md) | `set-variant` CLI command handler is an empty TODO stub. Admin env vars set in two places that disagree on `WEBINY_ADMIN_DEBUG`. Also SEC-13 (private). | Medium | No |
| [api-sync-ddb-to-opensearch](level-04/api-sync-ddb-to-opensearch.md), [api-sync-pg-to-opensearch](level-04/api-sync-pg-to-opensearch.md) | `TimerFeature` hardcodes `getRemainingSeconds: () => 900`, defeating the abort-before-Lambda-timeout check (same copy-pasted bug in both). | High | No |
| [db-dynamodb](level-04/db-dynamodb.md) | `decodeCursor` uses `"ascii"` for UTF-8 cursors — same bug as `@webiny/utils`. `DynamoDbDriver` has no consumers. | High | No |
| [api-mailer](level-04/api-mailer.md) | Unconfigured SMTP silently falls back to `DummyMailTransport`, so `sendMail()` reports success without sending. (Level 5 correction: `self-hosted-auth` password reset is not affected — it checks SMTP settings first.) | Medium | No |
| [project-standalone](level-04/project-standalone.md) | `createAdminApp.ts`/`createApiApp.ts` copied from project-aws and unused. | Low (dead code) | No |
| [app-websockets](level-04/app-websockets.md) | `WebsocketsSubscriptionManager.onOpen` stores subscriptions in `subscriptions.close`, so open callbacks fire on close instead. | High | Yes |
| [sdk-nextjs](level-04/sdk-nextjs.md) | Security finding SEC-19 (private). | Critical | Yes |
| [app-graphql-playground](level-04/app-graphql-playground.md) | Security finding SEC-20 (private). `useResizableSplit` duplicated with app-sdk-playground. | High | No |
| [app-workflows](level-04/app-workflows.md) | Approve/reject moves an item into a bucket without incrementing its `total`, so the Content Reviews widget under-counts until reload. | Medium | No |
| [app-audit-logs](level-04/app-audit-logs.md) | `useAuditLogsList` has no error handling on `useCase.execute`, leaving the list loading forever on error. Confirms admin-ui `CodeEditor` stale preview. | Medium | No |
| [api-headless-cms-bulk-actions-aws](level-04/api-headless-cms-bulk-actions-aws.md) | Handler ignores the `taskService.trigger()` result and always returns `{ success: true }`. | Medium | No |
| [app-admin-ui](level-04/app-admin-ui.md) | User menu renders "undefined undefined" for profiles without a name. `MissingPermissionsWidget` unused. | Low | No |
| [app-mailer](level-04/app-mailer.md), [app-sdk-playground](level-04/app-sdk-playground.md), [app-headless-cms-common](level-04/app-headless-cms-common.md) | No significant bugs; no tests. | — | — |

## Level 5 — top findings

| Package | Finding | Severity | Verified |
| ------- | ------- | -------- | -------- |
| [api-websockets](level-05/api-websockets.md) | Security findings SEC-27 (critical) and SEC-28 (private). No `GoneException` cleanup; hardcoded 3-hour cutoff hides long-lived connections. | Critical | Partly |
| [api-core-ddb](level-05/api-core-ddb.md), [api-core-sql](level-05/api-core-sql.md) | Confirm SEC-14 affects both storage backends (private). SQL `TableManager.ensure()` has a check-then-create race. | High | Yes |
| [api-sync-system](level-05/api-sync-system.md) | `attachToDynamoDbDocument` wraps both `send` and `put`/`delete`/`update`/`batchWrite`, so helper-method writes are captured twice. `Fetcher.exec` throws instead of returning per-bundle errors. Cognito worker actions swallow failures. | High | No |
| [cognito](level-05/cognito.md) | `UpdateUserUseCase` uses the new email as Cognito `Username` when setting a password, so email+password updates silently fail. Also SEC-21 (private). | High | No |
| [auth0](level-05/auth0.md), [okta](level-05/okta.md) | Security findings SEC-24, SEC-25, SEC-26 (private). Auth0 redirect detection is substring-based; Okta uses the SDK. | Medium | No |
| [self-hosted-auth](level-05/self-hosted-auth.md) | Security findings SEC-29, SEC-30 (private). | Medium | No |
| [bug-reporter](level-05/bug-reporter.md) | Security findings SEC-22, SEC-23, SEC-31 (private). `ActionRecorder` always runs. | Medium | No |
| [app-aco — features](level-05/app-aco/features-and-presentation.md) | `RepositoryWithPermissionsChange` repeats the `shared-aco` stale-`inheritedFrom` bug on re-parent (masked by reload). `UncontrolledFolderTree` unused. | Medium | No |
| [app-aco — components](level-05/app-aco/components.md) | Two parallel, near-identical folder tree implementations both live. | Duplication | No |
| [cli-aws](level-05/cli-aws.md), [cli-standalone](level-05/cli-standalone.md) | `allow-production` declared `type: "number"` but read as boolean. Both CLIs ignore the system-requirements exit code. | Medium | No |
| [api-opensearch-aws](level-05/api-opensearch-aws.md), [api-core-testing](level-05/api-core-testing.md) | No significant bugs. | — | — |

## Level 6 — top findings

`api-headless-cms` and `app-headless-cms` are split into four slices each under `level-06/`.

| Package | Finding | Severity | Verified |
| ------- | ------- | -------- | -------- |
| [api-headless-cms — graphql](level-06/api-headless-cms/graphql-and-storage.md) | Security finding SEC-33 (private). Read API confirmed to return only published entries. dateGte/dateLte error swallowing confirmed. | High | Yes |
| [api-headless-cms — content entry](level-06/api-headless-cms/content-entry.md) | Security finding SEC-32 (private). Publish/republish/unpublish return the pre-storage-transform entry. | High | Partly |
| [api-headless-cms — crud](level-06/api-headless-cms/crud-and-utils.md) | Reserved system field IDs (`id`, `createdOn`, …) are rejected on model import but allowed on create/update — `crud` and `domain` schemas have drifted. Dynamic-zone converter drops vs throws on unknown templates. | High | No |
| [api-headless-cms — models](level-06/api-headless-cms/models.md) | Code-defined models skip field id/fieldId/storageId uniqueness validation, so explicit `storageId` collisions go unnoticed. | Medium | No |
| [app-headless-cms — features](level-06/app-headless-cms/features.md) | `mapCmsValidators` discards the combined schema when a field has 2+ validators, silently disabling them in the entry form. Bulk actions and model import skip cache invalidation. | High | No |
| [app-headless-cms — model editor](level-06/app-headless-cms/model-editor.md) | No fieldId uniqueness check in the field editor. | High | No |
| [app-headless-cms — entries](level-06/app-headless-cms/entries-and-renderers.md) | `loadRevision` has no stale-response guard; fast revision switching binds the form to the wrong revision. | Medium | No |
| [app-headless-cms — admin](level-06/app-headless-cms/admin.md) | Legacy `EditFieldDialog` rules/permissions editors duplicate the new renderers line-for-line; layout fields still use the old copy. `src/admin` is partly live, not purely legacy. | Duplication | Yes (jscpd) |
| [app-scheduler](level-06/app-scheduler.md) | `admin-ui` `DateTimePicker` (`dateTimeLocal`) appends `.000Z` to a local time, so scheduled publish/unpublish fires offset by the user's timezone. | High | Yes (client side) |
| [api-websockets-aws](level-06/api-websockets-aws.md), [api-websockets-standalone](level-06/api-websockets-standalone.md) | Security finding SEC-27 in both transports (private). Standalone never dispatches client messages to route handlers. `AwsWebsocketsEventValidator` never invoked. | Critical | Partly |
| [api-websockets-sql](level-06/api-websockets-sql.md) | Every registry call re-runs three schema-introspection queries. | Low (perf) | No |
| [self-hosted-auth-sql](level-06/self-hosted-auth-sql.md) | No bugs; no tests for the credential persistence layer. | Test gap | — |

## Level 7 — top findings

`app-file-manager` is split into two slices under `level-07/app-file-manager/`.

| Package | Finding | Severity | Verified |
| ------- | ------- | -------- | -------- |
| [api-scheduler](level-07/api-scheduler.md) | Security findings SEC-36 (critical) and SEC-37 (private). Backend takes `scheduleFor` at face value, so the admin-ui `DateTimePicker` `.000Z` bug makes scheduled actions fire at the wrong time for non-UTC users (confirmed end to end). Cancel orphans the EventBridge schedule if its delete fails. | Critical | Yes |
| [tenant-manager](level-07/tenant-manager.md) | Security findings SEC-34 and SEC-35 (private). `IsNotRootTenant` unused. | Critical | Partly |
| [languages](level-07/languages.md) | Security finding SEC-38 (private). `GetDefaultLanguage`/`GetLanguageByCode` return disabled languages. | High | Partly |
| [app-headless-cms-workflows](level-07/app-headless-cms-workflows.md) | Security finding SEC-39 (private). | High | No |
| [api-workflows](level-07/api-workflows.md) | Step e-mail notifications are wired in DI but never invoked; reviewers are never notified. Approve/reject authorization is correctly enforced in the domain layer. | Medium | No |
| [background-tasks](level-07/background-tasks.md) | A task already `RUNNING` can be executed again concurrently (no re-entrancy guard, blind read-then-write store). Status guards reimplemented 3x. Timeout handling is correct. | High | No |
| [api-record-locking](level-07/api-record-locking.md), [app-record-locking](level-07/app-record-locking.md) | Lock acquisition is non-atomic (check-then-put). Locks are enforced only by the admin UI; the API does not reject updates to locked entries. | High | No |
| [api-headless-cms-storage](level-07/api-headless-cms-storage.md) | Whole legacy plugin-based filter system is dead code. `searchable-json` where-filters can reach the db-utils `StartsWithFilter` crash. | Medium | No |
| [api-headless-cms-utils-os](level-07/api-headless-cms-utils-os.md) | Confirms the api-opensearch regex-vs-glob dynamic-template bug affects every real CMS index. | Medium | No |
| [app-file-manager — features](level-07/app-file-manager/features-and-modules.md) | `FileUploader.uploadMany` shares one `AbortController` per batch and matches results by filename. Paste-to-upload skips client size/type checks. `GetFileFeature` registered twice. | Medium | No |
| [app-file-manager — list](level-07/app-file-manager/file-list-and-details.md) | `FileDetailsPresenter.loadFile` has no stale-response guard. | Medium | No |
| [app-headless-cms-scheduler](level-07/app-headless-cms-scheduler.md) | `fetchModel`/`fetchEntry` have no stale-response guard. | Medium | No |
| [api-headless-cms-testing](level-07/api-headless-cms-testing.md) | No bugs; shared harness (~26 callers) has no tests of its own. | Test gap | — |

## Level 8 — top findings

`app-website-builder` (four slices) and `api-website-builder` (two slices) are under `level-08/`.

| Package | Finding | Severity | Verified |
| ------- | ------- | -------- | -------- |
| [api-headless-cms-bulk-actions](level-08/api-headless-cms-bulk-actions.md) | Security finding SEC-40 (private). Two GraphQL builder modules are dead. | Critical | Yes |
| [webhooks](level-08/webhooks.md) | Security findings SEC-41, SEC-42 (private). HMAC encoding differs between signing and verification. `WebhookVerifyPayload` never registered. | High | Yes (SEC-41) |
| [api-file-manager](level-08/api-file-manager.md) | Security findings SEC-45, SEC-46, SEC-47 (private). | High | No |
| [api-aco](level-08/api-aco.md) | Security findings SEC-43, SEC-44 (private). Folder move has no cycle detection. `ListCache` and `FoldersCacheFactory` unused. | High | No |
| [api-headless-cms-scheduler](level-08/api-headless-cms-scheduler.md) | SEC-36 addendum (private). Two delete-cancellation handlers overlap. | Medium | No |
| [background-tasks-aws](level-08/background-tasks-aws.md), [background-tasks-standalone](level-08/background-tasks-standalone.md) | Neither transport deduplicates task triggers (random Step Functions execution name; standalone spawns a new worker unconditionally), so the level-7 double-execution bug is unmitigated. | High | No |
| [api-scheduler-aws](level-08/api-scheduler-aws.md), [api-scheduler-standalone](level-08/api-scheduler-standalone.md) | AWS silently falls back to a no-op scheduler on transient service-discovery errors. Standalone never retries failed jobs. | High | No |
| [api-website-builder — pages](level-08/api-website-builder/pages-and-graphql.md) | Page path uniqueness is never enforced; `GetPageByPath` returns an arbitrary match. `utils/resolve.ts` duplicates api-graphql. | Medium | No |
| [api-website-builder — experiments](level-08/api-website-builder/experiments-and-redirects.md) | Redirects REST route reads `Result.value` without `isFail()`, crashing instead of 403. Redirect loops not prevented. | Medium | No |
| [app-website-builder — editor SDK](level-08/app-website-builder/editor-sdk-and-misc.md) | Undo/redo sends an empty diff to the preview, desyncing it. Another `ListCache` reimplementation. Preview postMessage target origin is correctly scoped. | High | No |
| [app-website-builder — presentation](level-08/app-website-builder/presentation.md) | `PageEditor` load effect has no stale-response guard; autosave can hit the wrong page. Pages/Redirects list stacks duplicated. | Medium | No |
| [app-website-builder — features](level-08/app-website-builder/features.md) | Settings repositories write the cache before the mutation succeeds, with no rollback. | High | No |
| [app-website-builder — BaseEditor](level-08/app-website-builder/base-editor.md) | Module-level drag state shared across editor instances. Box-model editors duplicated 4x. Expression-binding UI is disabled (dead). | Medium | No |
| [api-headless-cms-ddb](level-08/api-headless-cms-ddb.md), [api-headless-cms-sql](level-08/api-headless-cms-sql.md) | "List revisions" order differs: DynamoDB oldest-first, SQL newest-first. Also SEC-48 (private, low). SQL package has no executable tests. | Medium | No |
| [api-headless-cms-es-tasks](level-08/api-headless-cms-es-tasks.md) | Whole package (~7.6k lines) has no consumers. `enableIndexing` hardcodes tenant `root`. | Low (dead code) | No |
| [api-search-index-tasks](level-08/api-search-index-tasks.md) | Index marked done before creation succeeds. | Medium | No |

## Level 9 — top findings

`ai-powerups` is split into two slices under `level-09/ai-powerups/`.

| Package | Finding | Severity | Verified |
| ------- | ------- | -------- | -------- |
| [ai-powerups — API](level-09/ai-powerups/api.md) | Security finding SEC-52 (private). Admin assistant tool approval defaults to safe. | Critical | Yes |
| [ai-powerups — admin](level-09/ai-powerups/admin.md) | Security finding SEC-49 (private). AI generation responses matched only by action name; late responses overwrite user edits. Generation flow triplicated. | High | No |
| [api-file-manager-standalone](level-09/api-file-manager-standalone.md) | Security finding SEC-51 (private). No time-limited signed links for private files. | Critical | Yes |
| [api-file-manager-s3](level-09/api-file-manager-s3.md) | Reimplements api-file-manager's upload utilities instead of importing (also carries SEC-47). No multipart cleanup. Uses the level-0 wcp threat-detection gate. `WidthCollection` unused. | High | No |
| [api-audit-logs](level-09/api-audit-logs.md) | Security finding SEC-50 (private). Login/auth events are not audited. `cleanupApiKey` duplicated 4x; shared copy unused. | High | Yes |
| [api-headless-cms-workflows](level-09/api-headless-cms-workflows.md), [api-website-builder-workflows](level-09/api-website-builder-workflows.md) | SEC-39 confirmed on the backend for CMS and website builder (private). Website-builder publish gate throws on non-NotFound lookup failures. | High | Yes |
| [api-website-builder-scheduler](level-09/api-website-builder-scheduler.md) | SEC-36 addendum (private). Cancel handlers read `Result.value` without `isFail()`. Schedule use cases are not on the real call path. | High | No |
| [app-website-builder-workflows](level-09/app-website-builder-workflows.md) | `ToggleReadonly`/`ToggleEditorMode` duplicate each other and are both mounted. | Low | No |
| [api-headless-cms-ddb-es](level-09/api-headless-cms-ddb-es.md) | Entry mutations write primary table then ES-bridge table non-atomically; failures leave entries unsearchable. Unique-values aggregation hardcodes size 1,000,000. | High | No |
| [api-headless-cms-pg-os](level-09/api-headless-cms-pg-os.md) | OpenSearch path skips storage converters that ddb-es applies (value-shape drift). Same unbounded aggregation. | Medium | No |
| [api-search-index-tasks-os](level-09/api-search-index-tasks-os.md) | `OsIndexManager.list()` swallows errors and returns `[]`, so indices can stay in reindex settings. | Medium | No |
| [api-headless-cms-tasks](level-09/api-headless-cms-tasks.md) | Task trigger correctly authorizes before triggering (good pattern). No test for the rejection. | — | — |
| [api-headless-cms-aco](level-09/api-headless-cms-aco.md), [api-file-manager-aco](level-09/api-file-manager-aco.md) | Confirm SEC-44 reaches every folder-aware model (private). | High | No |
| [api-aco-ddb](level-09/api-aco-ddb.md), [api-aco-sql](level-09/api-aco-sql.md) | Correct tenant scoping. SQL adapter still uses legacy extension-plugin registration. | Low | No |
| [api-website-builder-scheduler](level-09/api-website-builder-scheduler.md), [app-website-builder-scheduler](level-09/app-website-builder-scheduler.md) | Frontend delegates to app-scheduler, so the DateTimePicker timezone bug applies. | High | Yes |

## Levels 10–14 — top findings

| Package | Finding | Severity | Verified |
| ------- | ------- | -------- | -------- |
| [remote-components](level-10/remote-components.md) | Security findings SEC-53 and SEC-54 (private). Server and browser bundlers duplicate the esbuild config; AI generate/refine duplicate provider resolution. | Critical | Yes (SEC-53) |
| [api-audit-logs-ddb](level-10/api-audit-logs-ddb.md) | `expiresAt` is not declared on the entity, so dynamodb-toolbox strips it and DynamoDB TTL never fires — audit logs are never expired. | High | No |
| [api-audit-logs-sql](level-10/api-audit-logs-sql.md) | Security finding SEC-56 (private). | High | No |
| [api-event-handler-standalone](level-11/api-event-handler-standalone.md) | Security finding SEC-55 (private). No tests in the package. | Medium | No |
| [api-event-handler-aws](level-11/api-event-handler-aws.md) | API Gateway tenant loader checks the tenant header with exact casing instead of the shared case-insensitive helper used by the Function URL path. | Medium | No |
| [api-event-handler-core](level-10/api-event-handler-core.md) | Shared per-request composition (`registerApiRequestStack`) has no tests for its load-bearing registration order. | Test gap | — |
| [api-event-handler-aws-ddb-os](level-12/api-event-handler-aws-ddb-os.md), [api-event-handler-standalone-sql](level-12/api-event-handler-standalone-sql.md) | No smoke tests. OpenSearch endpoint becomes `https://undefined` when its env var is unset. | Low | No |
| [api-search-index-tasks-ddb-os](level-10/api-search-index-tasks-ddb-os.md) | Unvalidated `JSON.parse(cursor)`. | Low | No |
| [webiny](level-14/webiny.md) | Re-exports ~85 deep internal paths from ~40 packages, all pinned `0.0.0`; any internal rename silently breaks the public export map. | Medium | No |
| [project-template-base](level-10/project-template-base.md) | `FeatureFlagsGate` wrapper duplicated in both project templates instead of living here. | Low | No |
| [app-serverless-cms](level-10/app-serverless-cms.md), [project-standalone-template](level-13/project-standalone-template.md), [project-aws-template](level-13/project-aws-template.md) | Agent-reported "missing backend packages" **refuted** in main-session verification: they arrive transitively via `api-event-handler-core` and the composition roots. Only the implicitness is noteworthy. | — | Refuted |

## Cross-cutting observations

- Most level-0 packages have no tests at all (`error`, `feature`, `wcp`, `mcp`, `sdk`, `pulumi-sdk`, `lexical-theme`, and others), including heavily used ones such as `error` (~260 consumer files).
- Client/instance caching helpers are repeatedly broken (`aws-sdk`, `app-utils`), and copy-pasted caching code drifts between copies.
- The same bug travels with copy-pasted code: `api-file-manager-s3` re-implements api-file-manager's key utilities; `decodeCursor` ASCII bug in `utils` and `db-dynamodb`; hardcoded Timer in both sync adapters; `ListCache` copied four times (three in `admin-ui`, one in `app-admin`).
- The shared OIDC token verification (`api-core`) is used by Cognito, Auth0 and Okta; one fix there covers all three (see private notes).
- CMS model field validation is incomplete on every path: UI has no fieldId uniqueness check, API create/update allows reserved field IDs, code-defined models skip uniqueness validation.
- Several whole feature packages expose GraphQL operations with no authorization at all (`ai-powerups`, `remote-components`, `api-scheduler`, bulk actions; details private). A namespace-level authorization gate or a lint rule for resolvers without permission checks would prevent recurrence.
- Background tasks run with authorization disabled (`background-tasks` `TaskManager`), so every task-triggering entry point must authorize first. Scheduled actions and bulk actions currently do not (private notes).
- Missing stale-response guards in async loaders: `cms-nextjs`, `app-headless-cms` `loadRevision`, `app-file-manager` `loadFile`, `app-headless-cms-scheduler`, `app-website-builder` `PageEditor`, `ai-powerups` generation over websockets. A shared latest-request-wins helper would cover all of them.
- Check-then-write without an atomic condition: `background-tasks` task execution, `api-record-locking` lock acquisition, `api-core-sql` `TableManager.ensure()`.
- Both form systems (`@webiny/form` and `app-admin` form model) over-cache validation results.
- Roles/Teams/API Keys CRUD is triplicated on both backend (`api-core`) and frontend (`app-admin`).
- Dead exports are common in level 1 (`handler`, `utils`, `cms-sdk`, `lexical-nodes`, `website-builder-sdk`).
