# @webiny/pulumi-sdk

> Level 0 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
A small Node.js wrapper around the Pulumi CLI: `Pulumi.create()` downloads the platform-appropriate Pulumi binary and AWS plugin on first use (`downloadBinaries.ts`/`downloadFile.ts`), and the `Pulumi` class builds CLI argument arrays and spawns the Pulumi process via `execa`, wrapping failures as `PulumiError`. Overall health is reasonable for its size, but binary provisioning has two real, confirmed defects (wrong architecture on Linux ARM64, and unchecked HTTP status on download) that would silently corrupt the installed CLI rather than fail loudly.

## Public API
- `Pulumi` class, `PulumiError`, and its supporting types (`Options`, `RunArgs`, `PulumiArgs`, `ExecaArgs`, `PulumiProcess`, `PulumiProcessResult`) (`src/Pulumi.ts`) — re-exported wholesale via `src/index.ts`. Consumed by `@webiny/project` (`DeployApp`, `DestroyApp`, `RefreshApp`, `RunPulumiCommand`, `GetAppOutput`, `PulumiExportService`, `PulumiGetStackOutputService`, `PulumiSelectStackService`, `PulumiLoginService`, `PulumiImportService` — ~10 call sites), `@webiny/project-aws` (`GetPulumiService`), and `@webiny/cli-aws` (deploy/destroy output handling). This is the only real public surface; `downloadBinaries`/`downloadFile` are internal implementation details, not exported.

## Bugs
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | high | `src/downloadBinaries.ts:59-70` (`getDownloadFilename`) | The `"darwin"` case checks `process.arch` against `SUPPORTED_ARCHITECTURES` (`x64`/`arm64`) and picks the matching build, but the `"linux"` case is hardcoded to `linux-x64` with no arch check at all, even though Pulumi publishes `linux-arm64` releases. | On a Linux ARM64 host (e.g. AWS Graviton CI runners, Apple Silicon Docker containers running `linux/arm64`), `downloadBinaries` downloads and installs the x64 Pulumi binary. The subsequent `execa(this.pulumiBinaryPath, ...)` call in `Pulumi.run` (`src/Pulumi.ts:161-165`) then fails with an "exec format error" instead of using the correct architecture. | high |
| 2 | medium | `src/downloadFile.ts:6-11` | `downloadFile` never checks `res.ok`/`res.status`; it only checks that `res.body` is non-null. Most HTTP error responses (404/500) still return a body. | If the computed download URL is wrong (e.g. a Pulumi version with no released asset for the current platform, or a transient CDN/proxy error page), the error page body is written to disk as if it were the `.tar.gz`/`.zip` archive. `tar.extract`/`AdmZip` then fail with a confusing "not a valid archive" error instead of a clear "download failed with status 404" error, or worse, partially succeed and leave a broken install. | high |
| 3 | medium | `src/downloadFile.ts:17-26` | The write-stream promise only listens for `'error'` on `nodeStream` (the incoming HTTP body), not on `fileStream` (the local `fs.createWriteStream`). Per Node's `EventEmitter` semantics, an unhandled `'error'` event on a stream with no listener throws and crashes the process instead of rejecting the promise. | If the local disk write fails independently of the network read (e.g. `ENOSPC` disk full, or a permissions error on the target `pulumiFolder`), `fileStream` emits `'error'` with no listener, crashing the Node process instead of surfacing a catchable rejection from `downloadFile`/`downloadBinaries`. | medium |
| 4 | low | `src/downloadBinaries.ts:26-28` | `downloadBinaries` treats "the download folder already exists" as "already installed, skip" (`if (fs.existsSync(downloadFolder)) return false;`). If a previous run was killed (SIGKILL, OOM) after the folder was created (as a side effect of `fs.ensureDir` inside `downloadFile`) but before extraction completed, the folder exists but the `pulumi` binary inside it does not. | Next run silently skips (re-)installation, and `Pulumi.run`'s `execa(this.pulumiBinaryPath, ...)` then fails with `ENOENT` because the binary was never fully extracted, with no indication that the install is the actual cause. | medium |

## Duplication
- No cross-file duplication reported by jscpd for this package (`jscpd-pulumi-sdk/jscpd-report.json` shows 0 clones for `downloadFile.ts` and `downloadBinaries.ts`; `Pulumi.ts`/`index.ts` weren't large/repetitive enough to register any clone pairs).
- No duplication of standard-library or well-known utility logic was found; the zip-slip/path-traversal guard in `extractZip` (`src/downloadBinaries.ts:89-118`) is a reasonable, self-contained implementation rather than a reinvention of something already available in `adm-zip`.

## Dead code
- None found. Every exported symbol (`Pulumi`, `PulumiError`, `FLAG_NON_INTERACTIVE`, and the option/arg types) has confirmed in-repo consumers in `@webiny/project`, `@webiny/project-aws`, or `@webiny/cli-aws`.

## Convention issues
- None significant. This package predates/doesn't use the `@webiny/di` abstraction/implementation pattern (it's a plain SDK class), so the "one abstraction per file"/DI-naming conventions don't apply here. `src/index.ts` only re-exports `Pulumi.ts`, which matches the "minimal barrel exports" convention — `downloadBinaries.ts`/`downloadFile.ts` are correctly kept internal.

## Test gaps
- No `__tests__` directory exists anywhere in this package. None of the following are covered: `Pulumi.run`'s argument-building logic (kebab-casing, array/boolean flag expansion, the `preview` vs. non-interactive flag branch), `ensureAwsPluginIsInstalled`'s stale-plugin cleanup loop, or any part of `downloadBinaries`/`downloadFile` (platform/arch selection, zip-slip guard, error handling). Given Bugs #1-#4 are all in this untested provisioning path, this is the most consequential gap in the package.

## Recommendations
1. Fix `getDownloadFilename`'s Linux branch (`src/downloadBinaries.ts:65-66`) to select `linux-arm64` vs `linux-x64` based on `process.arch`, mirroring the existing `darwin` branch (Bug #1).
2. Add an HTTP status check in `downloadFile` (`src/downloadFile.ts:7-9`) that throws before writing the body when `!res.ok`, and add an `'error'` listener on `fileStream` so local write failures reject the promise instead of crashing the process (Bugs #2, #3).
3. Add unit tests for `Pulumi.run`'s argument-building (`src/Pulumi.ts:94-180`) and for `downloadBinaries`/`downloadFile`'s platform selection and error paths, since this is currently the only untested, load-bearing logic in a package every deploy/destroy/refresh command depends on.
