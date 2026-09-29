# @webiny/utils

> Level 1 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

`@webiny/utils` is a grab-bag of small, mostly stateless helper functions (ID/version
generation and parsing, base64 cursor encode/decode, error/object normalization, retry, a
sha256-based cache-key helper) plus two DI "feature" modules built on `@webiny/feature`:
`Timer` (Lambda-remaining-time abstraction) and `Compression` (pluggable gzip/jsonpack
compression). It is the most widely imported package audited so far — roughly 163 files
import directly from `"@webiny/utils"`, plus more via deep imports such as
`@webiny/utils/features/Timer` or `@webiny/utils/features/compression`. Overall health is
fine for the exports that are actually consumed, but a substantial fraction of the package's
surface (`composeAsync`/`composeSync`, `middleware`, `removeNullValues`,
`getWebinyVersionHeaders`/`WEBINY_VERSION_HEADER`, the legacy `Compressor`/
`createDefaultCompressor`/`CompressionPlugin` classes) is dead code with zero consumers
outside the package itself, and `decodeCursor` has a silent unicode-corruption bug. Other
packages should reuse `encodeCursor`/`decodeCursor`, `createCacheKey`, `executeWithRetry`,
`parseIdentifier`/`createIdentifier` and `parseZodError` rather than reimplementing them.

## Public API

- `parseIdentifier` / `createIdentifier` (`~/parseIdentifier.ts`, `~/createIdentifier.ts`) —
  split/join a record's generated ID and version (`id#version`); ~14+ call sites, e.g.
  `api-headless-cms-ddb`, `db-dynamodb`.
- `encodeCursor` / `decodeCursor` (`~/cursor.ts`) — base64(JSON) pagination cursors; used by
  `api-headless-cms-ddb/src/operations/entry/DdbListEntries.ts` and
  `api-headless-cms-sql/src/operations/entry/queryHelpers.ts`. Two other packages
  (`db-dynamodb`, `api-opensearch`) maintain their own near-duplicate implementations instead
  of importing this one (see Duplication).
- `mdbid` / `generateId` / `generateAlphaNumericId` family (`~/mdbid.ts`, `~/generateId.ts`) —
  ID generators; ~34+ call sites across `api-file-manager*`, `api-websockets-standalone`, etc.
- `createCacheKey` (`~/cacheKey.ts`, sha256 via `@noble/hashes`) — used by
  `background-tasks`, `aws-sdk` (`client-s3`, `client-cognito-identity-provider`),
  `api-headless-cms-tasks`.
- `createZodError` / `parseZodError` (`~/createZodError.ts`) — used by `background-tasks` and
  `webhooks` domain error classes to turn a `ZodError` into a `WebinyError`/issue list.
- `executeWithRetry` (`~/executeWithRetry.ts`, wraps `p-retry`) — 6+ callers, e.g.
  `api-aco-ddb/FolderLevelPermissionsStorageOperations.ts`,
  `api-file-manager-s3/InvalidateCacheTask.ts`, `db-dynamodb/utils/scan.ts`.
- `removeUndefinedValues` (`~/removeUndefinedValues.ts`) — used in
  `api-headless-cms` content-model use cases (`CreateModel`, `CreateModelFrom`, `UpdateModel`).
- `Timer` feature (`features/Timer/*`, `timerFactory`/`CallbackTimer`/`CountdownTimer`) —
  registered/consumed via `@webiny/feature` DI, e.g. `background-tasks`,
  `api-headless-cms-ddb-es` (Lambda remaining-time tracking).
- `Compression` feature (`features/compression/*`, `CompressionFeature`/`CompressionHandler`)
  — registered by ~12 higher-level features (`api-headless-cms`, `api-audit-logs-ddb`,
  `api-website-builder`, `api-sync-ddb-to-opensearch`, `api-sync-pg-to-opensearch`, `api`,
  etc.); this is the actively used successor to the legacy `Compressor` class.

## Bugs

| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|----------|----------|---------|-------------------|------------|
| 1 | medium | `packages/utils/src/cursor.ts:24` | `decodeCursor` converts the base64-decoded buffer with `.toString("ascii")` instead of `"utf8"`, while `encodeCursor` (line 10) encodes with the default UTF-8. `"ascii"` strips the high bit of every byte, so any multi-byte UTF-8 character is silently mangled rather than raising an error. | A cursor built from data containing any non-ASCII character (e.g. `encodeCursor(["café", 123])`) round-trips through `decodeCursor` as `["cafC)", 123]` — verified by direct reproduction — instead of throwing or returning the original value. `JSON.parse` still succeeds, so callers get silently corrupted pagination state rather than a decode error. Current in-repo callers (`DdbListEntries.ts`, `queryHelpers.ts`) only pass numeric strings, so the bug is currently latent, but it is exported as a general-purpose public API and nothing documents the ASCII-only restriction. | high (reproduced); impact on current call sites is low since none pass non-ASCII input today |

## Duplication

- Within package: `getObjectProperties.ts:4-6` declares its own local `interface GenericRecord`
  instead of importing the identical shared type already exported from
  `packages/utils/src/GenericRecord.ts` (used by `exception.ts` for the same purpose).
- Across packages: `encodeCursor`/`decodeCursor` (`~/cursor.ts`) are reimplemented
  independently in `packages/db-dynamodb/src/utils/cursor.ts` (same base64(JSON) scheme, but
  without the try/catch safety net) and again, differently, in
  `packages/api-opensearch/src/cursors.ts`. Neither package imports `@webiny/utils`'s version.
- jscpd found no intra-package clones for `packages/utils/src` (0 duplicate pairs reported).

## Dead code

- `composeAsync` / `composeSync` (`~/compose.ts`) — grep across `packages/` and `apps/` finds
  zero importers outside `packages/utils/src/index.ts` (re-export) and
  `packages/utils/__tests__/compose.test.ts`.
- `middleware` (`~/middleware.ts`) — codegraph shows its only caller is inside its own file;
  two unrelated packages (`api-sync-system`, `api-websockets`) define their own,
  independent `middleware` functions and do not import this one.
- `removeNullValues` (`~/removeNullValues.ts`) — zero consumers found anywhere in the repo
  outside its own `dist` typings/barrel re-export.
- `getWebinyVersionHeaders` / `WEBINY_VERSION_HEADER` (`~/headers.ts`) — zero consumers found
  despite having a dedicated test file (`__tests__/headers.test.ts`).
- `features/compression/legacy/Compressor.ts` (`Compressor` class, `createDefaultCompressor`)
  and `legacy/CompressionPlugin.ts` (abstract `CompressionPlugin`) — zero consumers found;
  fully superseded by the DI-based `CompressionFeature`/`CompressionHandler`. Only the
  underlying `createGzipCompression`/`createJsonpackCompression` plugin factories are still
  imported directly by a few packages (`api-aco`, `project`, `ai-powerups`).

## Convention issues

- `cursor.ts` and `features/compression/legacy/Compressor.ts` use `console.log`/
  `console.error` directly for error reporting. `ai-context/code-style/no-console-in-backend.md`
  targets `api-*` packages specifically, but `@webiny/utils` is consumed by backend code, so
  these calls propagate the pattern downstream; low priority since `utils` predates the DI
  logger and has no natural place to inject one.
- The duplicated `GenericRecord` interface in `getObjectProperties.ts` (see Duplication) is a
  minor violation of the project's preference for reusing existing named types rather than
  re-declaring them locally.

## Test gaps

- No tests exist for: `executeWithRetry`, `removeNullValues`, `removeUndefinedValues`,
  `cacheKey.createCacheKey`, `getObjectProperties`, `exception.convertException`,
  `middleware`, `mdbid`, or any of the `Timer` feature classes
  (`CallbackTimer`, `CountdownTimer`, `timerFactory`) and the new DI compression classes
  (`CompressionHandler`, `GzipCompression`, `JsonpackCompression`) — only the underlying
  legacy `gzip`/`jsonpack` plugin functions have direct tests.
- `cursor.test.ts` only exercises ASCII payloads (`"abcdef"`, `"1234"`, arrays of ASCII
  strings/numbers); the unicode-corruption bug above (`decodeCursor` bug #1) has no test
  coverage in either direction.

## Recommendations

1. Fix `decodeCursor`'s `"ascii"` → `"utf8"` at `packages/utils/src/cursor.ts:24` and add a
   unicode round-trip test case to `cursor.test.ts`.
2. Point `db-dynamodb/src/utils/cursor.ts` and `api-opensearch/src/cursors.ts` at
   `@webiny/utils`'s `encodeCursor`/`decodeCursor` (or extract one shared implementation)
   instead of maintaining two more independent copies of the same base64(JSON) scheme.
3. Remove (or explicitly document why they're kept) the dead exports: `composeAsync`,
   `composeSync`, `middleware`, `removeNullValues`, `getWebinyVersionHeaders`/
   `WEBINY_VERSION_HEADER`, and the legacy `Compressor`/`createDefaultCompressor`/
   `CompressionPlugin` classes — trimming ~6 unused exports reduces the package's public
   surface and the risk of someone building new code on the unmaintained legacy path.
