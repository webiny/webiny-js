# Component Extraction — Phase 0 investigation report

**Status:** Investigation only. No implementation code written. No existing files modified.
**Method:** Webiny MCP server confirmed available; skills loaded for pattern grounding
(`webiny-api-tasks-catalog`, `webiny-cms-bulk-actions`, `webiny-infrastructure-extensions`,
`webiny-api-file-manager-catalog`, `webiny-api-key-value-store-catalog`, `webiny-website-builder`,
`webiny-ai-powerups-content`, `webiny-api-permissions`, `webiny-admin-permissions`,
`webiny-admin-architect`, `webiny-admin-router-catalog`, `webiny-admin-ui-extensions`). All code
claims are cited to indexed source.

> **Two input docs still outstanding:** the process design and the screen specification were not
> attached. Section 5 (constraints) and part of #34 are answered from the codebase where possible and
> flagged where they depend on those docs. Everything else (A–D, reuse, storage, topology, phasing) is
> complete on codebase evidence.

---

## 1. Answers

### A. Theme extraction: the background job

**A1 — Where it lives / registration.** Package `packages/api-theme-extraction` (`@webiny/api-theme-extraction`).
Feature entry `src/feature.ts:25` (`ThemeExtractionFeature`) registers the browser provider, screenshot
store, caches, crawl/analyse use cases, the task, and the GraphQL schema factory. API glue:
`extensions/themeExtraction/ThemeExtractionExtension.ts` (`createFeature`, calls
`ThemeExtractionFeature.register(container)` + an `ExtractionSettings` borrowing the AI Power-Ups
provider, `:87-95`). Wired at `webiny.config.tsx:73` (`<Api.Extension src="@/extensions/themeExtraction/…" />`);
`webiny.config.tsx:67` bumps `<Infra.Api.MaxBundleSize size={8388608} />` (8 MiB) because extraction
bundles `puppeteer-core` into the shared API handler. **No dedicated admin extension** — the Admin "From a
website" option is gated by a capability probe `ThemeQuery.themeExtractionAvailable` (`extraction.gql.ts:55-60`).

**A2 — Task definition + registration pattern.** `TaskDefinition` from
`@webiny/api-core/features/task/TaskDefinition`. Job: `ThemeExtractionTaskImpl implements
TaskDefinition.Interface<Input,Output>` (`ThemeExtractionTask.ts:68`), exported via
`TaskDefinition.createImplementation({ implementation, dependencies })` (`:285-294`). Metadata (`:72-78`):
`id="themeExtraction"`, `maxIterations=1`, `isPrivate=false`, `databaseLogs=true`. New-task pattern: (1)
implement the interface + `createImplementation`; (2) `container.register(TheTask)` in a feature's
`register()` (`feature.ts:34`); (3) register the feature via `<Api.Extension>`. Standalone example:
`extensions/tasks/SelfCleaningTask.ts` (wired at `webiny.config.tsx:118`). Trigger at runtime:
`TaskService.trigger({ definition, name, input })` (`extraction.gql.ts:91`).

**A3 — Continuation / checkpointing.** Framework fully supports it; **this task deliberately does not use it**
(`maxIterations=1`, `ThemeExtractionTask.ts:76`, with a header comment that each step is individually
time-bounded to fit one 15-min invocation). Available machinery (`background-tasks` augmentation of
`TaskController`, `TaskController/augmentation.ts`): `controller.runtime.isCloseToTimeout(seconds?)`,
`isAborted()`, `getRemainingSeconds()` (`:69-74`; task already reads these at `:115,207`);
`controller.response.continue(data, { seconds | date })` (`response/abstractions/TaskResponse.ts:21`) →
result `ITaskResultContinue { status: CONTINUE, input, wait? }`. **State across iterations:**
`controller.state.getInput()/updateInput()/getOutput()/updateOutput()` (`augmentation.ts:29-36`); the
continue payload becomes the next iteration's `input`, persisted to DynamoDB by `DatabaseResponse`
(`DatabaseResponse.ts:71-117`). `ExtractionLock` already anticipates resume — re-acquiring your own lock
succeeds (`KeyValueExtractionStores.ts:95-99`).

**A4 — Child tasks / fan-out + concurrency.** Natively supported. Within a running task:
`controller.task.trigger(params)` and `controller.task.listChildren(definitionId?)` (`augmentation.ts:53-64`).
`ITaskTriggerParams` carries `parent: { id }` (`TaskService/abstractions.ts:67-73`); tasks store `parentId`
(`:81`). Each triggered task is a **separate Step Function execution / Lambda invocation** of the one
`background-task` Lambda (`ApiBackgroundTask.ts:67-78`). **No native per-definition concurrency cap** — bounded
only by AWS Lambda account concurrency. Theme extraction imposes its own single-flight `ExtractionLock`
(tenant-scoped, explicitly non-atomic, `KeyValueExtractionStores.ts:65-75`) and processes pages **sequentially
on purpose** ("a 2 GB Lambda running Chromium has no headroom for concurrent page loads",
`CrawlSiteUseCase.ts:252-253`).

**A5 — Lambda settings.** All in `packages/project-aws/src/pulumi/apps/api/ApiBackgroundTask.ts`:
`memorySize: 2048` (`:49`), `timeout: 900` (15 min, `:44`). **Ephemeral storage: NOT configured** → defaults
to 512 MB (grep: zero `ephemeralStorage` hits anywhere). The function clones the GraphQL function's base
config (`:23`). **Every `TaskDefinition` runs on this one shared `background-task` Lambda.** Task-level bound:
`maxIterations=1`.

**A6 — Chromium layer.** `ApiBackgroundTask.ts:29-43` unions GraphQL layers with `getLayerArn("sharp")` +
`getLayerArn("chromium")` (`:40`). ARN source `@webiny/aws-layers` — `layers.js:58-75` maps every region to
`arn:aws:lambda:<region>:632417926021:layer:chromium:1` (Webiny-owned public layer, **region-specific, not
env-specific**, Chromium 123.0.1, runtime `nodejs22.x`). Layer build: `scripts/layers/chromium.js`
(`chromium-v123.0.1-layer.zip`). Runtime: `ChromiumBrowserProvider.ts` uses `@sparticuz/chromium-min`
(`123.0.1`) + `puppeteer-core` (`^22.6.0`); pack inflates from `/opt/nodejs/.../@sparticuz/chromium/bin` into
`/tmp` (`:119-127`); AL2023 workaround forces `AWS_LAMBDA_JS_RUNTIME=nodejs20.x` and patches
`LD_LIBRARY_PATH` (`:83-97`). Override envs `WEBINY_CHROMIUM_EXECUTABLE_PATH` / `_PACK_PATH`
(`launchConfig.ts:49-50`).

**A7 — Puppeteer config + visit sequence.** Launch (`ChromiumBrowserProvider.ts:424-440`):
`headless:true`, `defaultViewport {1440×900}`, args from `chromium.args`. Honest UA
`WebinyThemeExtractor/1.0` (`launchConfig.ts:19-21`). Per page (`capturePage`, `:179-279`, fresh tab):
`setViewport` desktop 1440×900 / mobile 390×844; optional `emulateMediaFeatures(prefers-color-scheme:dark)`;
**request interception aborts `media`** (hero videos), records `font` responses; `goto(url, {waitUntil:
"domcontentloaded"})` 30 s cap; `waitForNetworkIdle({idleTime:500})` best-effort; bot-wall check
(`assertNotChallenged`, throws `BotChallengeError`); **consent/cookie dismissal** (`dismissBannersScript`,
2000 ms cap) **before** sampling; `samplePageScript({maxElements:1500})` 20 s cap; screenshots **sequential**,
per-crop scroll (above-fold 0 / mid `vh*1.5` / footer `scrollHeight`) + fixed **400 ms** settle for lazy
imagery. **No explicit font-loading or animation-freeze wait** beyond network idle + 400 ms. Per-op ceilings
`DEFAULT_TIMEOUTS` (`launchConfig.ts:165-177`).

**A8 — jsdom.** Dev/test only — appears solely in `@vitest-environment jsdom` pragmas
(`dismissBanners.test.ts:2`, `samplePage.test.ts:2`) to unit-test the in-page scripts. Real capture is
Chromium/puppeteer; computed-style extraction runs **inside real Chromium** via `page.evaluate`, not jsdom.

**A9 — Screenshots.** Yes. Stored in **S3** via `S3ScreenshotStore` (same `process.env.S3_BUCKET` as File
Manager, prefix `theme-extraction/<extractionId>/<slug>.png`, `image/png`; **not** File Manager files,
`:15-24`). ≤8 per crawl (`PAYLOAD_CAPS.screenshots`, `payload.ts:35`). Captured **for the AI model call, not
served to the Admin UI** (no code path fetches them for admin). `CachedCrawl` stores only screenshot
keys+labels, never bytes. Cleanup: prefix deleted on cache replace + S3 lifecycle expiry after
`CRAWL_CACHE_MAX_AGE_DAYS=7`.

**A10 — Progress reporting.** Three channels: (1) **Websockets** push via `WebsocketsSendToIdentityUseCase`
(`ThemeExtractionTask.ts:271-282`), actions `theme.extraction.progress|done|failed`
(`ExtractionProgress.ts:90-92`), weighted monotonic percent interpolated per page (`:27-77`,
`ThemeExtractionTask.ts:148-159`), best-effort. (2) **Polling** GraphQL `ThemeQuery.getThemeExtraction(taskId)`
reads the task record (`extraction.gql.ts:139-176`). (3) **DB task logs** (`databaseLogs=true`) in the Admin
Background Tasks viewer.

**A11 — Failures / per-item.** Whole-task: `controller.response.error(message)` → status `FAILED`, surfaced via
websocket + persisted `task.output.error.message` + DB logs. **Per-page partial failure is supported:** an
unreadable *interior* page is logged and skipped, crawl continues (`CrawlSiteUseCase.ts:266-281`); only the
**entry page** is fatal (`:205-208`); per-screenshot failures recorded in `failedScreenshots` as *degraded*,
not fatal (`ChromiumBrowserProvider.ts:352-358`); dark-mode + mobile crops degrade silently. Task still
returns `done` with partial results reflected in `sampledUrls`/`failedScreenshots`.

### B. Theme extraction: artifacts and storage

**A12 — Artifact + format.** Terminal output is a **draft Theme CMS entry** holding a DTCG `TokenDocument`,
created via `CreateThemeUseCase` (`AnalyseCrawlUseCase.ts:176-185,207`). `tokens.css` / `tokens.json` (DTCG) /
`manifest.json` are **generated on read** from the snapshot, never persisted (`ThemeArtifactService.ts:16-67`),
served over REST at `GET /_webiny/theme/{file}` (`StableThemeRoute.ts:21`, active) and
`GET /_webiny/theme/preview/{themeId}/{version}/{file}` (`ThemePreviewRoute.ts:16`).

**A13 — Intermediate state.** Screenshots stream to S3 **as each page is captured** (`CrawlSiteUseCase.ts:391-398`).
`CachedCrawl` (`{ payload, screenshots[], extractionId, crawledOn, roleSignals? }`) is written **once** at the
crawl→analyse boundary to the tenant KeyValueStore (`:304-342`, best-effort). Analyse reads screenshots back
from S3 (`AnalyseCrawlUseCase.ts:216-241`). Runs in **one invocation (`maxIterations=1`)** — no continuation;
the crawl cache is the only recovery seam (retry reuses the cache instead of re-reading the site).

**A14 — Versioning + pinning.** Themes are **CMS content-entry revisions** (`version:number` + stable
`entryId`; revision ids `entryId#0004`). A separate document `schemaVersion` (`THEME_SCHEMA_VERSION=1`) tracks
token-doc shape. **Pin path:** `GetThemeByIdRepository.execute(id)` → `GetEntryByIdUseCase`; build the revision
id with `toRevisionId(entryId, version)` — exactly what `ThemePreviewRoute.ts:51` does. Active version is a KV
pointer `ActiveThemePointer { entryId, id, version, activatedOn }` via `ActiveThemeStore`. **Recommendation:**
store `{ entryId, version }`, resolve via `GetThemeByIdRepository.execute(toRevisionId(entryId, version))`.

**A15 — Generation manifest.** **Exists** — `manifest.json` is first-class:
`theme-common/src/artifacts/manifest.ts` `generateManifestArtifact(snapshot,{themeId,version})` →
`ThemeManifest` (`:46-58`): own `manifestVersion:1`, `themeId`, `version`, `cssVariablePrefix`, `policy`
(`allowArbitraryColor`, `allowArbitraryFontSize`, `defaultMode`), and `slots[]`. Each `ManifestSlot`:
`path`, `displayName`, `description` (model guidance), `cssVariables[]`, resolved `values.light`/`values.dark`.
Filtered to **bindable semantic slots** (`isManifestSlot`, `:65-76`). Fetched on demand
(`ThemeArtifactService.project()` `"manifest.json"`) at `/_webiny/theme/manifest.json` (active) or the preview
route (specific version). **This is the theme→component-generator contract.**

**A16 — Large-binary storage.** Both patterns exist; extraction deliberately uses **raw S3**:
`S3ScreenshotStore.ts` (`@webiny/aws-sdk/client-s3`, same bucket, own prefix, lifecycle cleanup; rationale
`:15-24` — transient working data must not appear in the FM media library). Alternative for durable assets:
**File Manager** — presigned POST `getPresignedPostPayload.ts:21-58` (key `tenants/{tenant}/files/{key}`),
`CreateFileUseCase`, renderable URL via `FileUrlGenerator` + asset-delivery route (metadata mirrored to KV
`FileManager/File/{id}/Metadata`). **Recommendation:** raw-S3 for transient/working images; File Manager only
if the admin must render them as durable, user-managed assets.

**A17 — Content-addressed storage.** **None exists.** `hashObject` (`website-builder-sdk/src/HashObject.ts`)
is a **non-cryptographic** 32-bit rolling hash used for change detection, not addressing. Closest precedents
are **deterministic derived keys**: crawl-cache key = normalized URL (`crawlCacheKey()`), screenshot key =
`theme-extraction/{id}/{slug}.png`, FM key = `tenants/{tenant}/files/{key}`. Artifact immutability is by
`{themeId, version}`, cache-busted by version number, not digest. **Recommendation for small JSON stage
artifacts:** tenant KeyValueStore under a deterministic human-readable key (crawl-cache / `ActiveThemeStore`
precedent); if you need dedup, fold a digest into the key rather than adding a CAS abstraction (and upgrade
`hashObject` to a real digest first).

### C. The components module

**C18 — Package + data model.** `packages/remote-components`. Component = **private CMS model**
`wbyRemoteComponent` (`WbyRemoteComponentModel.ts:4-31`, `builder.private`, `$publishing:false`). Fields (all
`fields.text()`): `name*`, `label*`, `description`, `aiContext`, `source` (JSX, compressed), `css`
(compressed), `bundledJs`/`bundledJsSha256`, `bundledCss`/`bundledCssSha256`, `aiPrompt`, `status`,
`sdkVersion`. **Code stored as strings on the CMS entry** (source/css/compiled bundle + sha256). Versioning is
CMS-entry revisions, **but edits update the latest revision in place** (`UpdateRemoteComponentRepository.ts:32-46`)
— no user-facing version history; `sdkVersion` is the SDK runtime contract, not component versioning.

**C19 — AI generation entry point.** GraphQL mutation → background task → use-case. Mutation
`generateRemoteComponent(data)` (`RemoteComponentSchema.ts:164-166`, resolver `:275-298`) triggers a task, returns
`{ id }` (async, result over websockets). Task `GenerateRemoteComponentTask` (`remoteComponentsGenerateComponent`),
calls `GenerateRemoteComponentUseCaseImpl.execute(input)` then `CreateRemoteComponentUseCase` to persist. Input
`IGenerateRemoteComponentInput` (`abstractions.ts:3-9`): `{ prompt: string; name?; label?; description?;
additionalFileIds?: string[] }`.

**C20 — Structured spec vs prompt.** **Prompt-only.** No prop-list / token-binding / contract field in the
input. The prop-list + token catalog live only inside the **system prompt** (`buildComponentPrompt.ts`,
`tokenCatalogSection.ts`); the model is told to *emit* a manifest, never *given* one. **A structured contract
requires a new input type + prompt assembly.**

**C21 — Image / multimodal.** **Already multimodal and wired.** `buildUserContent`
(`GenerateRemoteComponentUseCase.ts:84-108`) builds `ContentPart[] = TextPart | FilePart`
(`FilePart={type:"file", data:Uint8Array, mediaType}`); `resolveImageFiles` (`:110-132`) loads
`additionalFileIds`, **filters to `image/*`**, appends as file parts; passed as the user message `content` to
`ai.generateText`. The `Ai` abstraction wraps the **Vercel AI SDK** (`generateText` from `"ai"`), which supports
text+file parts. **A reference screenshot works today** via `additionalFileIds` (both generate and refine).

**C22 — AI provider abstraction + config.** **`Ai`** at `packages/api-core/src/features/ai/` — thin wrapper
over Vercel AI SDK; pluggable `AiSdkFactory` implementations (`AnthropicSdkFactory`, `OpenAiSdkFactory`),
model ids `"<providerId>/<modelId>"`. **Configured from AI Power-Ups settings** — the use-case reads
`GetSettingsUseCase` (`@webiny/ai-powerups`), takes `settings.providers.presets[0]`, decrypts
`apiKeyEncrypted`, passes an inline connection (`GenerateRemoteComponentUseCase.ts:34-59`). Uses the **raw
`Ai.generateText`** path (not the higher-level `CmsGenerateEntryContentUseCase`) and re-implements provider
selection (always `presets[0]`) — a shared helper would be needed so classify/plan/generate don't each
re-select.

**C23 — Token-binding validation.** **Prompt-instruction only.** Post-generation validation is
`validateComponentSource.ts:9-44` — checks no `import`/`require`, presence of `export default function` +
`export const manifest` + manifest `name`. **It does NOT verify `var(--wby-*)` names or lint bindings.** Token
correctness is unenforced. (Note: `manifest.json` gives the allowed slot list, so a validator is easy to add.)

**C24 — Name uniqueness / collisions.** **Not enforced.** `name` is a plain required text field, no unique
constraint; create is unconditional (`CreateRemoteComponentRepository.ts:21-54`), no lookup-by-name. Two
same-named components can coexist; nothing merges/versions/rejects. CMS scoping is per-tenant/locale.

**C25 — Programmatic create-from-code (promote).** **Exists.** `createRemoteComponent(data)` mutation
(`RemoteComponentSchema.ts:157`, input `:101-110` `{ name*, label*, description, aiContext, source*, css,
aiPrompt, status }`) → `CreateRemoteComponentUseCase` → `CreateRemoteComponentRepository` writes source/css
directly to a CMS entry (`status:"draft"`, empty bundle; a separate `bundleRemoteComponent` compiles later).
This is what the AI task itself uses internally. **Clean promote target — call `CreateRemoteComponentUseCase`
directly, no AI.**

**C26 — Admin UI + list screen.** `packages/remote-components/src/admin/`. List in
`presentation/ComponentList/` (`ComponentListPage.tsx`), routes in `src/admin/routes.ts`, editor in
`ComponentEditor/`. List = MobX `observer` + feature/DI (`useFeature(ComponentListFeature)`), built from
**`@webiny/admin-ui`** primitives: `DataTable<RemoteComponentDto>` + `Button`, `DropdownMenu`, `Tag`, `Text`,
`TimeAgo`, `Heading`, `Scrollbar`, `Separator`, `IconButton`; row actions via `useRouter().goToRoute`.

### D. Platform patterns

**D27 — Storage pattern for own entities.** Theme uses two stores by shape: (1) **private CMS model** for the
entity itself — `wbyTheme` (`theme.model.ts:3-43`, `builder.private`), giving revisions + publish/live pointer
+ locking + tenant isolation "for free"; repositories wrap CMS use-cases (`CreateEntryUseCase`,
`ListLatestEntriesUseCase`), `searchableJson` for filterable fields, plain `json` for large read-by-id blobs;
model registered as a plugin + resolved per-request into DI (`ThemeFeature.ts:29,58-68`). (2)
**tenant KeyValueStore** for the singleton active pointer (`ActiveThemeStore.ts:8-52`). **Recommendation:**
jobs/runs/stage-artifacts/overrides = **private CMS models** (one per entity); "current run per tenant"
singleton = KeyValueStore. Do not hand-roll DynamoDB storage ops — nothing in Theme does.

**D28 — Tenant scoping.** KeyValueStore is **automatically per-tenant** (`KeyValueStore.ts:12-25` passes
`{ scope: tenant.id }`, callers never see tenant). CMS entries are inherently tenant-scoped; the private model
inherits it. Background jobs run in the originating tenant/identity context; inside the task, identity via
injected `IdentityContext` (`ThemeExtractionTask.ts:84,273`). Pattern: never thread tenant manually — inject
`TenantContext`/`IdentityContext` and let KV + CMS + TaskService scope for you.

**D29 — Single permission, dual enforcement.** Declaration: one permission via `createPermissionSchema`
(`permissionsSchema.ts:13-24`, `prefix:"theme"`, entity `theme`, permission `theme.theme`, scopes `["full"]`,
actions `rwd`/`pw`; **no `own` scope**). API: `createPermissionsAbstraction` + `createPermissionsFeature`
(`permissions/abstractions.ts:5`, wired `ThemeFeature.ts:31`); enforced in use-cases via
`permissions.canRead/canCreate("theme")` (`GetActiveThemeUseCase.ts:16`) — even the extraction trigger is gated
on **theme** perms, not task perms (`extraction.gql.ts:71,120,148`). Admin: `<Security.Permissions name="theme"
schema={THEME_PERMISSIONS_SCHEMA} />` (`app-theme/src/Extension.tsx:46-52`) for the roles editor;
`createHasPermission(ThemePermissions)` (`HasPermission.tsx:5`) wraps routes + menu (`<HasPermission
entity="theme">…</HasPermission>`, `Extension.tsx:54-77`). Admin schema mirrors API.

**D30 — Routes + menu.** `Route` instances (`app/src/features/router/Route.ts:14`) with name/path/zod params
(`app-theme/src/routes.ts`: `/theme`, `/theme/:id`). Registered declaratively as `<AdminConfig.Route>` +
`<AdminConfig.Menu>` inside the admin `Extension.tsx` (`:16,57-76`); links via `useRouter().getLink(route)`;
menus can nest via `parent=` (AiPowerUps under `settings.system`). **Second view = purely additive JSX:** add a
`Route` to `routes.ts`, render another `<AdminConfig.Route>` inside the same `<HasPermission>` block, add a
sibling `<Menu.Link>`. No central route table.

**D31 — Admin UI target.** **`@webiny/admin-ui`** — confirmed the only design system: `packages/ui`
(legacy `@webiny/ui`) **does not exist**; zero `"@webiny/ui"` references in any package.json. Theme screens
import from `@webiny/admin-ui` (also via the `webiny/admin/ui` alias). Workspace-pinned `0.0.0`. **No competing
/ migrating design system.** Screens designed against `@webiny/admin-ui` kit classes are correct.

**D32 — Long-running-job UI pattern.** Copy Theme's flow: backend `TaskDefinition` emitting discrete stages
via a `report()` helper (`ThemeExtractionTask.ts:239-253`) + DB logs; progress transport = websockets to
identity (`WebsocketsSendToIdentityUseCase`); admin subscription hook `useExtraction.ts:47-86`
(`useWebsockets().onMessage`) feeding an observable repo. Admin components from `@webiny/admin-ui`:
**`SteppedProgress`** (ready-made per-stage indicator, `packages/admin-ui/src/SteppedProgress`), `ProgressBar`
(`ExtractThemePanel.tsx:78`), `Tag` status variants (`ThemeStatusTag.tsx`). **No generic tasks-list admin
screen exists** — build your own list over CMS-backed job entities (like `ThemeListView`), reuse
`SteppedProgress` + the websocket hook. Don't invent a queue or progress protocol.

### E. Constraints and risks

**E33 — Storage footprint per page + binding constraint.** *Theme extraction's own footprint is tiny and not
representative:* per crawl ≈ one capped low-KB DynamoDB `CachedCrawl` item (`PAYLOAD_CAPS`: colors ≤40,
fontSizes ≤20, spacing/radii/shadows ≤15, each `{value, share, occurrences, properties[]}`) + ≤8 PNGs in S3
(screenshot **keys+labels** in DynamoDB, **bytes only in S3**). *But the Component-Extraction design intends far
more per page* — serialized DOM + computed styles + geometry + a full-page screenshot for up to a few hundred
pages. Rough per-page estimate: DOM+styles+geometry JSON ≈ 0.5–5 MB (uncapped, vs theme extraction's hard caps),
full-page PNG ≈ 0.2–3 MB (theme extraction applies **no downscale** — `screenshotLongestEdge` is only a plan
hint, actual PNG is unbounded by document height). Few hundred pages → **hundreds of MB to a few GB** total.
**Binding constraint is NOT S3** (handles GBs trivially, and it's the established sink). It is **the shared
2 GB / 512 MB-`/tmp` `background-task` Lambda**, and only *if capture accumulates in memory*: Chromium alone
wants most of 2 GB, and a single very tall full-page PNG buffer can spike memory; `/tmp` is 512 MB with
Chromium already unpacking into it. **Mitigation (mandatory): stream each page's artifact to S3/CMS immediately
(as theme extraction already does for screenshots), never accumulate; downscale/cap screenshots (sharp is on
the layer); fan out in bounded batches.** With per-page streaming, memory/`/tmp` stay bounded and S3 is the only
thing that grows.

**E34 — What the current infra cannot support without change.** (Codebase-derived; spec-dependent items in
§5.) (i) **Capture at scale on the shared Lambda** — one 2 GB/512 MB-`/tmp` Lambda shared by all background
tasks, no per-task concurrency cap. Heavy parallel capture competes with every other background task and each
child needs the full 2 GB + Chromium `/tmp`. Needs: app-level concurrency throttle **and likely** a dedicated
capture Lambda + raised `ephemeralStorage` (both **Pulumi changes** in `ApiBackgroundTask.ts` / a new
function). (ii) **Ephemeral storage is unconfigured (512 MB)** — no mechanism today sets it; a Pulumi change is
required to raise `/tmp`. (iii) **Screenshots aren't served to the admin** — the gate/inspect UX needs an
auth-gated delivery route (precedent: `ThemePreviewRoute`) or File Manager records. (iv) **Generation is
prompt-only** — a structured component contract (props, token bindings, ref screenshot) needs a new
structured-input path or prompt-encoding (multimodal already works). (v) **No token-binding validation** — needs a
post-generation validator against `manifest.json` slot names. (vi) **No component name uniqueness / collision
handling** — Promote needs a policy + code. None of these are blockers; each is a scoped addition.

**E35 — Capture code coupled to token extraction + refactor size.** The capture stack in
`packages/api-theme-extraction` splits cleanly:
- **Generic, reusable (belongs in a shared package):** `browser/ChromiumBrowserProvider.ts` (launch, layer
  discovery, AL2023 `LD_LIBRARY_PATH` workaround, screenshot capture, scroll/settle), `browser/launchConfig.ts`
  (UA, `DEFAULT_TIMEOUTS`, executable/pack discovery), `dismissBanners` (consent overlays), bot-wall detection
  (`assertNotChallenged`/`BotChallengeError`), `storage/S3ScreenshotStore.ts` (parameterize the prefix), the
  `BrowserProvider` DI abstraction. These are the hard, brittle, already-solved parts (Chromium-on-Lambda,
  layer, `/tmp`, consent, bot detection, per-op timeouts).
- **Token-coupled (stays in api-theme-extraction):** `crawl/samplePage.ts` (in-page computed-style sampler,
  `maxElements:1500`, ~19 token-oriented fields), `buildModelPayload` + `PAYLOAD_CAPS`, `roleSignals`,
  `mergeObservations`, `AnalyseCrawlUseCase`. Component Extraction needs a **different in-page evaluator**
  (serialized DOM + geometry + segmentation data + per-block screenshots), not token histograms.
- **Refactor size: moderate.** The `BrowserProvider` abstraction already isolates the browser behind DI, and
  the in-page evaluate function is passed in — so the extraction is mostly "move ~6–8 files into a new shared
  package (e.g. `@webiny/site-capture`), repoint theme-extraction imports, parameterize the S3 prefix, and make
  the in-page sampler pluggable." Infra is already shared (the layer is attached to the common background-task
  Lambda), so **no infra change is needed merely to reuse the browser** — infra changes are only for capture
  *at scale* (E34). Estimate: ~1 new package, a handful of moved files, one seam (pluggable sampler) to add.

---

## 2. Reuse assessment — the capture layer

**Verdict: reusable after extraction into a shared package. Not as-is; not a rewrite.**

- **Not reusable as-is:** the crawl orchestrator's *output contract* is token histograms (`ModelPayload` with
  hard caps, dark-mode probe, role signals) and only ≤8 screenshots for a single model call — the wrong shape
  and scale for per-page segmentation of hundreds of pages.
- **Not a rewrite:** the genuinely hard parts — headless Chromium on a 2 GB Lambda, the region-mapped layer,
  `/tmp` inflation, the AL2023 runtime-library workaround, consent-overlay dismissal, bot-wall detection, the
  full set of per-operation timeouts and network/settle heuristics — are done, battle-tested, and identical for
  either consumer.
- **Therefore: extract the browser/capture primitives into a shared package** (`@webiny/site-capture` or
  similar) and have both Theme Extraction (token sampler) and Component Extraction (DOM/geometry/segment
  sampler + full-page/segment screenshots) consume it via the existing `BrowserProvider` DI seam with a
  **pluggable in-page evaluator**. Moderate effort (§E35). This extraction should land **early** (see phasing)
  because both apps depend on it and doing it later means migrating a second consumer.

---

## 3. Recommended storage decision

Following the Theme precedent (private-CMS-for-entities + KV-for-pointers + raw-S3-for-binaries):

| Data | Store | Precedent |
|---|---|---|
| **Job / Run** (one per extraction run) | private CMS model (`builder.private`) | `wbyTheme` (`theme.model.ts`), `wbyRemoteComponent` |
| **Stage state + artifact refs** (per run, 9 stages) | fields on the Run entity (`searchableJson` for status/filter, plain `json` for small blobs) + **artifact bodies by ref** | Theme `searchableJson`/`json` split |
| **Large stage artifacts** (per-page DOM/geometry, cluster data) | raw S3 under a feature prefix, keys stored on the Run | `S3ScreenshotStore` |
| **Screenshots** (full-page + per-segment) | raw S3 (feature prefix, lifecycle TTL), served via an auth-gated route | `S3ScreenshotStore` + `ThemePreviewRoute` auth pattern |
| **Generated components (pre-promote)** | private CMS entities held "inside the job" (a job-scoped status), promoted via `CreateRemoteComponentUseCase` | `wbyRemoteComponent` create-from-code |
| **"Current run per tenant" pointer / lock** | tenant KeyValueStore | `ActiveThemeStore`, `ExtractionLock` |
| **Overrides** (user edits to a stage's artifact) | a field/child entity on the Run, versioned so re-run staleness is detectable | Theme revisions |

**Staleness:** stamp each stage artifact with a monotonic `stageVersion` (or content digest) on the Run;
re-running stage N bumps N and marks N+1…9 stale. Deterministic KV/S3 keys embed `{ runId, stage, version }`.
**Screenshot serving to the admin** is the one open storage decision — transient raw-S3 + auth-gated route
(cheap, TTL, matches "throwaway job data") vs File Manager (durable, user-manageable, costs an FM record and
shows in the media library). Recommend the former unless product wants durable, user-managed captures — flag
for Sven (§6).

---

## 4. Proposed task topology (nine stages)

Framework facts that shape this: continuation via `response.continue(input,{seconds})` carrying cursor state;
fan-out via `controller.task.trigger({definition,input,parent})` + `listChildren`; **no native concurrency
cap** (self-throttle); every task shares the one 2 GB Chromium `background-task` Lambda.

**Shape: one task per stage, orchestrated by a Run entity acting as the gate ledger — not one monolith.**
Each stage is an independently re-runnable gate, so:

1. **Run entity** (private CMS) holds per-stage status (`pending|running|done|stale|failed`) + artifact refs.
2. A GraphQL mutation `runStage(runId, stage)` calls `TaskService.trigger({ definition: stageTaskId, input:
   { runId }, parent })`. The stage task reads the prior stage's artifact by ref, writes its own, updates the
   Run's stage status, and pushes websocket progress. **Stages do not auto-advance** by default (gate model);
   an optional "auto-run to completion" can chain triggers on `onDone`.
3. Re-running a stage bumps its `stageVersion` and marks downstream stale (plain repository logic, no task
   needed).

**Per-stage topology:**

- **1 Discover** (deterministic, cheap): single task (or synchronous use-case) → URL list artifact.
- **2 Capture** (deterministic, **heavy, fan-out**): a **parent Capture task** splits the URL list into
  batches (≈5–10 pages, matching theme extraction's "5 pages/invocation, sequential, 2 GB Chromium" reality)
  and `trigger`s **one child task per batch** with `parent:{id}`. Children run Chromium **sequentially within
  the batch**, stream each page's artifact + screenshots to S3 immediately, and mark themselves done. The
  parent uses `continue` + `isCloseToTimeout` to wait, enumerates via `listChildren`, aggregates, and marks
  Capture done. **Self-throttle** child triggering in waves (e.g. ≤N in flight) — there is no native cap and
  every child loads Chromium on the shared 2 GB Lambda.
- **3 Segment** (deterministic, per-page → **fan-out like Capture** if page count is large): segment each
  captured page into blocks; write a block list per page.
- **4 Cluster** (deterministic): cross-page dedup/cluster of blocks → representative set. Single task, reads all
  segment artifacts (barrier over Segment).
- **5 Classify** (model-backed): `Ai` abstraction (AI Power-Ups presets). Classify representative blocks;
  optionally multimodal (block screenshot). Fan-out per cluster or batch, bounded.
- **6 Plan** (model-backed): propose a component contract (props, token bindings from `manifest.json`) per
  chosen block. Model-backed, one item per component.
- **7 Generate** (model-backed, **fan-out per component**): call the component generator once per planned
  component, **passing the reference screenshot** (multimodal already supported via `additionalFileIds`) and
  the token catalog. Bounded parallelism.
- **8 Assemble** (deterministic): collect generated components into the job, run token-binding validation
  against `manifest.json`, bundle.
- **9 Promote** (deterministic, non-AI): call `CreateRemoteComponentUseCase` per component to move it into the
  Library (apply the name-collision policy here).

**Artifact handoff:** every stage reads prior artifacts by ref (S3 key / KV key / Run field) and writes its own
+ updates the Run. No stage holds another's data in memory. **Capture and Generate are the only heavy fan-out
stages; the model stages reuse the one `Ai` abstraction** (extract a shared provider-selection helper so
classify/plan/generate don't each re-read `presets[0]`).

---

## 5. Constraints list (platform vs design)

Codebase-derived (spec items flagged pending the two missing docs):

1. **Shared background-task Lambda, no concurrency cap** → Capture fan-out must self-throttle and probably wants
   a **dedicated capture Lambda** (Pulumi change) so it doesn't starve other background tasks / vice-versa.
2. **Ephemeral `/tmp` = 512 MB, unconfigured** → raising it is a **Pulumi change** (`ApiBackgroundTask.ts`); may
   be needed for large captures + Chromium unpack. No config path exists today.
3. **Screenshots not downscaled, unbounded by page height** → memory/`/tmp` spike risk; add a **sharp** downscale
   (already on the layer) + per-page streaming (mandatory).
4. **`maxIterations` default 50** → a multi-wave Capture parent may need a higher explicit `maxIterations`.
5. **API bundle already at 8 MiB (puppeteer-core)** → the shared background-task Lambda bundle must be watched
   as capture deps grow.
6. **Generation is prompt-only** → structured Plan→Generate contract needs a new input path (or prompt-encoding).
7. **No token-binding validation** → add a validator against `manifest.json` in Assemble.
8. **No component name uniqueness** → Promote needs a collision/versioning policy.
9. **Screenshots not admin-served** → add an auth-gated delivery route for the inspect/override UX.
10. **[SPEC-DEPENDENT — pending process design + screen spec]** exact per-stage artifact schemas, override
    semantics, max page count, whether full serialized DOM must be stored (footprint), and the per-stage status
    screen layout. Cannot be finalized without the two docs.

---

## 6. Open questions for Sven

1. **Screenshot durability:** transient raw-S3 + auth-gated route (recommended) vs File Manager durable assets?
2. **Max pages per job** — drives footprint, fan-out sizing, and whether a dedicated capture Lambda is required.
3. **Dedicated capture Lambda** vs the shared `background-task` Lambda (isolation + raised memory/`/tmp` vs infra
   cost)?
4. **Full serialized DOM per page** required (large footprint), or is block-tree + geometry + screenshot enough?
5. **Generate input:** new structured component-contract input on the generate use-case, vs encoding the contract
   into the prompt? (Multimodal screenshot already works.)
6. **Name-collision policy on Promote:** reject / auto-version / suffix / overwrite?
7. **Stage advancement:** manual gate-by-gate only, or an optional auto-run-to-completion?
8. **The two spec docs** (process design + screen specification) — needed to close §5 #10.

---

## 7. Proposed implementation phasing

**First shippable slice = a tracer bullet: one page → one promoted component through all nine gates.**

- **Phase 1 — vertical tracer bullet (no scale).** Run entity + stage-gate ledger + the GraphQL `runStage`
  trigger + websocket progress + a minimal admin Run screen (`SteppedProgress` + a list like `ThemeListView`).
  Single-page path: Discover(1 URL) → Capture(1 page, on the shared browser) → Segment(1) → Cluster(passthrough)
  → Classify(1) → Plan(1) → Generate(1, **passing the page screenshot** via the existing multimodal path) →
  Assemble(validate against `manifest.json`) → Promote(1 via `CreateRemoteComponentUseCase`). Proves topology +
  artifact handoff + the Generate/Promote reuse end-to-end with zero infra changes.
- **Phase 1.5 — extract `@webiny/site-capture`.** Lift the generic browser/capture primitives out of
  `api-theme-extraction` behind the existing `BrowserProvider` seam with a pluggable sampler; repoint theme
  extraction. Do this before scaling capture (both apps depend on it).
- **Phase 2 — Capture at scale.** Parent/child batch fan-out + self-throttle + per-page streaming + screenshot
  downscale; multi-page Segment fan-out. Infra: evaluate dedicated capture Lambda + raised ephemeral storage.
- **Phase 3 — model stages at scale.** Cluster/Classify dedup, Plan/Generate fan-out with a shared provider
  helper, structured Generate contract, stage re-run + staleness + overrides UX.
- **Phase 4 — hardening.** Token-binding validation, name-collision policy, admin status-UI polish, infra
  tuning.

**Recommendation:** ship Phase 1 first — it de-risks the nine-gate topology and the Generate→Promote reuse
(the two novel bets) with no infra work, and produces a demoable end-to-end result on one page. Fold the
`site-capture` extraction in immediately after, before any capture-at-scale work.
