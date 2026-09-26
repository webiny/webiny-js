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
| 5–14  | 91       | Pending |

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
| [api-mailer](level-04/api-mailer.md) | Unconfigured SMTP silently falls back to `DummyMailTransport`, so `sendMail()` (e.g. password reset) reports success without sending. | Medium | No |
| [project-standalone](level-04/project-standalone.md) | `createAdminApp.ts`/`createApiApp.ts` copied from project-aws and unused. | Low (dead code) | No |
| [app-websockets](level-04/app-websockets.md) | `WebsocketsSubscriptionManager.onOpen` stores subscriptions in `subscriptions.close`, so open callbacks fire on close instead. | High | Yes |
| [sdk-nextjs](level-04/sdk-nextjs.md) | Security finding SEC-19 (private). | Critical | Yes |
| [app-graphql-playground](level-04/app-graphql-playground.md) | Security finding SEC-20 (private). `useResizableSplit` duplicated with app-sdk-playground. | High | No |
| [app-workflows](level-04/app-workflows.md) | Approve/reject moves an item into a bucket without incrementing its `total`, so the Content Reviews widget under-counts until reload. | Medium | No |
| [app-audit-logs](level-04/app-audit-logs.md) | `useAuditLogsList` has no error handling on `useCase.execute`, leaving the list loading forever on error. Confirms admin-ui `CodeEditor` stale preview. | Medium | No |
| [api-headless-cms-bulk-actions-aws](level-04/api-headless-cms-bulk-actions-aws.md) | Handler ignores the `taskService.trigger()` result and always returns `{ success: true }`. | Medium | No |
| [app-admin-ui](level-04/app-admin-ui.md) | User menu renders "undefined undefined" for profiles without a name. `MissingPermissionsWidget` unused. | Low | No |
| [app-mailer](level-04/app-mailer.md), [app-sdk-playground](level-04/app-sdk-playground.md), [app-headless-cms-common](level-04/app-headless-cms-common.md) | No significant bugs; no tests. | — | — |

## Cross-cutting observations

- Most level-0 packages have no tests at all (`error`, `feature`, `wcp`, `mcp`, `sdk`, `pulumi-sdk`, `lexical-theme`, and others), including heavily used ones such as `error` (~260 consumer files).
- Client/instance caching helpers are repeatedly broken (`aws-sdk`, `app-utils`), and copy-pasted caching code drifts between copies.
- The same bug travels with copy-pasted code: `decodeCursor` ASCII bug in `utils` and `db-dynamodb`; hardcoded Timer in both sync adapters; `ListCache` copied four times (three in `admin-ui`, one in `app-admin`).
- Both form systems (`@webiny/form` and `app-admin` form model) over-cache validation results.
- Roles/Teams/API Keys CRUD is triplicated on both backend (`api-core`) and frontend (`app-admin`).
- Dead exports are common in level 1 (`handler`, `utils`, `cms-sdk`, `lexical-nodes`, `website-builder-sdk`).
