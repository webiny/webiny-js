# Code Audit Reports

Bottom-up audit of the packages in `packages/`. Packages are grouped by dependency level: level 0 has no internal `@webiny/*` dependencies, and each higher level depends only on lower levels. One report per package, at `level-XX/<package-dir>.md`.

Findings are produced by LLM agents (plus `jscpd` for copy-paste detection) and are **not verified** unless marked otherwise. Confirm each finding before fixing it.

Audited at commit `19c9ca1b91`.

## Progress

| Level | Packages | Status |
| ----- | -------- | ------ |
| 0     | 20       | Done   |
| 1–14  | 146      | Pending |

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

## Cross-cutting observations

- Most level-0 packages have no tests at all (`error`, `feature`, `wcp`, `mcp`, `sdk`, `pulumi-sdk`, `lexical-theme`, and others), including heavily used ones such as `error` (~260 consumer files).
