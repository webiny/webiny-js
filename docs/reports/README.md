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
| 2–14  | 135      | Pending |

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

## Cross-cutting observations

- Most level-0 packages have no tests at all (`error`, `feature`, `wcp`, `mcp`, `sdk`, `pulumi-sdk`, `lexical-theme`, and others), including heavily used ones such as `error` (~260 consumer files).
- Dead exports are common in level 1 (`handler`, `utils`, `cms-sdk`, `lexical-nodes`, `website-builder-sdk`).
