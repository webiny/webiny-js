# @webiny/remote-components

> Level 10 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/remote-components` lets tenant users author, AI-generate, bundle, and publish user-written React "remote components" (stored as a private headless-CMS entry with source, CSS, and pre-bundled JS/CSS plus their SHA-256 hashes) that are later loaded and executed both in the Admin sandbox editor and on live sites via `sdk-frontend`/`sdk-nextjs`. The server-side bundler (`api/bundler/bundleComponent.ts`, esbuild-wasm) correctly recomputes `sha256` from the actual bundled output, and the admin sandbox iframe (`SandboxIframe.tsx`) correctly scopes its `postMessage` channel to the preview domain's real origin — a better pattern than the `ComponentSandbox` issue already tracked against `sdk-nextjs`. Two security findings are tracked privately (SEC-53, SEC-54). Other packages should reuse this package's `bundleComponent`/`validateComponentSource` (source-safety checks: no imports/require, must have a default-exported component + a `manifest` export) rather than re-deriving component-bundling logic, and its `Result`-based use-case/repository DI pattern is otherwise a reasonable model to follow.

## Public API
- `RemoteComponents` (`src/RemoteComponents.tsx`) — the admin extension component; registered by `packages/project-aws-template/template/webiny.config.base.tsx` (per codegraph, 1 real consumer outside tests).
- `REMOTE_COMPONENT_MODEL_ID` / `RemoteComponentDto` (`src/index.ts`) — the only other exports from the package barrel; minimal, consistent with repo convention.
- `bundleComponent`/`bundleComponents`/`validateComponentSource` (`src/api/bundler/index.ts`) — the server-side bundling pipeline; used internally by `BundleRemoteComponentUseCase` and covered by the package's one test file.
- GraphQL: `Query.remoteComponents.{getRemoteComponent,listRemoteComponents}` and `Mutation.remoteComponents.{createRemoteComponent,updateRemoteComponent,deleteRemoteComponent,bundleRemoteComponent,generateRemoteComponent,refineRemoteComponent}` (`RemoteComponentSchema.ts`) — the only externally reachable surface; consumed by the Admin UI presenters in this same package and, for reading bundles, by `sdk-frontend`'s `ComponentsSdk.ts` (`loadComponents`/`ListRemoteComponentsResponse`).

## Bugs
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | critical | packages/remote-components/src/api/graphql/RemoteComponentSchema.ts | Security finding SEC-53 — see private notes. | — | high |
| 2 | critical | packages/remote-components/src/admin/presentation/ComponentEditor/ComponentEditorPresenter.ts | Security finding SEC-54 — see private notes. | — | high |
| 3 | low | packages/remote-components/src/api/graphql/RemoteComponentSchema.ts:112-125 | `UpdateRemoteComponentInput` omits `aiContext`, which `CreateRemoteComponentInput` (line 101-110) and the `RemoteComponent` output type (line 76) both have, so a component's AI context can be set at creation time but never edited afterward through `updateRemoteComponent`. | A user creates a component with `aiContext: "X"`, later wants to correct it via the update mutation, and finds there is no field to change it — the value is stuck until the record is recreated. | high |
| 4 | low | packages/remote-components/src/admin/bundler/browserBundler.ts:13-17 vs packages/remote-components/package.json | The browser bundler hardcodes `esbuild-wasm@0.28.1` as a CDN URL (`https://unpkg.com/esbuild-wasm@0.28.1/esbuild.wasm`), while `package.json` declares `esbuild-wasm: "^0.28.2"` as the installed dependency used by the server-side bundler — the two bundlers can silently drift to different esbuild versions, and the browser one depends on `unpkg.com` being reachable at edit time. | If `unpkg.com` is unreachable (offline/air-gapped admin deployment, or CDN outage) the in-browser live-preview bundler fails entirely even though the server-side bundler works fine; separately, a future bump of the `package.json` dependency has no effect on the browser bundler unless the hardcoded URL is updated too. | high |

## Duplication
Within the package (per jscpd, 2.77% duplicated lines):
- `api/features/generateComponent/GenerateRemoteComponentUseCase.ts` and `api/features/refineComponent/RefineRemoteComponentUseCase.ts` share ~80 duplicated lines across three blocks (AI-settings loading, provider/API-key resolution, error handling) — a natural candidate for a shared "resolve AI provider" helper.
- `api/features/generateComponent/GenerateRemoteComponentTask.ts` and `api/features/refineComponent/RefineRemoteComponentTask.ts` duplicate ~10 lines of task-result/error-notification wiring.
- `api/features/getComponent/GetRemoteComponentRepository.ts`, `updateComponent/UpdateRemoteComponentRepository.ts` and `deleteComponent/DeleteRemoteComponentRepository.ts` each duplicate the same ~16-line "load model, fetch entry by id, map not-found" block.
- `admin/presentation/ComponentEditor/ComponentEditorPresenter.ts:157-198` (save) and `:270-316` (publish) duplicate ~22 and ~13 lines of bundling/error-handling logic respectively.
- Cross-file: `admin/bundler/browserBundler.ts:353-366` (browser esbuild `build()` call) and `api/bundler/bundleComponent.ts:157-170` (server esbuild `build()` call) duplicate the same esbuild config object almost verbatim — the two bundlers (browser-preview vs. server-authoritative) could share this config builder.

No duplication of lower-level dependency utilities was found; the package's own `Result`/error patterns correctly reuse `@webiny/feature/api`'s `BaseError`/`Result` rather than reimplementing them.

## Dead code
None found with clear evidence — the two lowest-traffic exports checked (`RemoteComponentBundleError`, and `RemoteComponentDto`/`REMOTE_COMPONENT_MODEL_ID` barrel exports) all have live consumers inside the package or in `sdk-frontend`.

## Convention issues
None significant. The abstractions.ts-per-feature files each define a paired UseCase+Repository abstraction (not a single abstraction), but this matches the pattern already established elsewhere in the monorepo for this feature-module style, not a local deviation. Barrel exports (`src/index.ts`) are minimal per convention.

## Test gaps
The package has exactly one test file (`__tests__/bundleComponent.test.ts`, 207 lines / 10 cases), covering only `bundleComponent`/`bundleComponents`/`validateComponentSource`. Entirely untested: every GraphQL resolver in `RemoteComponentSchema.ts`, every use case/repository (`create`/`get`/`list`/`update`/`delete`/`bundle`/`generate`/`refine`), the AI generate/refine tasks and prompt builders, the admin presenters (`ComponentEditorPresenter`, `ComponentListPresenter`, `CreateComponentPresenter`), `SandboxPreviewEvents`/`SandboxIframe` messaging, and the browser bundler. Given this package decides what JavaScript gets executed in the admin and on live sites, this is a significant gap. Security finding SEC-53 needs its own regression tests — see private notes.

## Recommendations
1. Address security finding SEC-53 (see private notes).
2. Address security finding SEC-54 (see private notes).
3. Add resolver/use-case-level test coverage for the CRUD and bundling flows (not just the pure `bundleComponent` helper), so a future regression in permission checks or hash handling is caught by CI rather than by an audit.
