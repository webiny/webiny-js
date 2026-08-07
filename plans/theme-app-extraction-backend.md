# Theme extraction — enablement plan

## TL;DR (important reframe)

**The extraction backend is already built.** `@webiny/api-theme-extraction` is a ~50-file package
(puppeteer crawler, AI analysis, token assignment, progress store, S3 screenshots, DynamoDB
lock/cache, GraphQL schema + resolvers, background task — all with tests). The GraphQL error you hit
is **not** a missing feature: the package's `ThemeExtractionFeature` is simply **not registered in the
running API**, so its schema never loads.

This is therefore an **integration + deployment-config** task, not a build task. No new extraction
code is required.

## Changes already applied in this repo

- **Framework (`@webiny/api-theme-extraction`):** widened the AI-connection seam so extraction can be
  handed the provider the project already configured, instead of only a named registry connection:
  - `IExtractionModelSettings.connection` is now `string | IAiConnectionInline`
    (`features/shared/abstractions.ts`).
  - `AnalyseCrawlUseCase.ask()`'s `connection` param widened to match, and its debug log now prints
    only a **safe descriptor** (a named connection's id, or an inline connection's provider) — never
    the inline API key.
  - Added a **`crawlLimit` clamp** (`clampCrawlLimit` in `crawl/urlScoring.js`, `MAX_CRAWL_LIMIT = 10`),
    applied in the `extractTheme` resolver — see "Cost / runaway protection" below.
  - Verified: package typechecks, builds, and all 244 tests pass (5 new for the clamp).
- **Project (`extensions/`):** `extensions/themeExtraction/ThemeExtractionExtension.ts` — a
  `createFeature` that (a) registers `ThemeExtractionFeature` and (b) registers an `ExtractionSettings`
  implementation pointing extraction at the AI provider configured in **AI Power-Ups settings** (the
  same source AI Image Enhance and AI page generation use). It reads AI Power-Ups via
  `webiny/api/ai-powerups` (already part of the framework) and imports `@webiny/api-theme-extraction`
  directly — which is now added to the root `package.json` and linked (`yarn`).

## Cost / runaway protection

A runaway loop is well-prevented by the existing design:

- **One model call per run.** The analyse phase makes exactly one `ai.generateText` call — no tool/step
  loop, no re-prompting. One extraction = one model invocation.
- **`maxIterations = 1`** — the task can't re-invoke itself via the continue-loop.
- **No infra auto-retry.** The background-task Step Function `Catch`es errors to a `Fail` state (no
  `Retry` on the task Lambda), and the task returns a clean `response.error()` rather than crashing.
- **5-minute model-call timeout**, **one-at-a-time `ExtractionLock`** per tenant, a **7-day crawl
  cache**, per-page 60s / 15-min Lambda ceilings, and a `canCreate("theme")` permission gate.

Residual levers were **cost size** and **frequency**, not looping:

- **Size — FIXED.** `crawlLimit` was forwarded unclamped, and page count drives the single call's
  (image-heavy) token cost. It is now clamped to `[1, MAX_CRAWL_LIMIT]` (10) in the resolver; an
  omitted value still falls through to `DEFAULT_CRAWL_LIMIT` (5).
- **Frequency — still open (optional).** The lock stops concurrency but not sequential repeats: there
  is no per-tenant daily quota, cooldown, or spend cap. Add one only if deliberate repeated runs are a
  concern.

## Evidence

- `packages/api-theme-extraction/` contains the full pipeline: `browser/` (puppeteer-core Chromium,
  robots, bot-wall, timeouts), `crawl/` (URL scoring, inventory, page sampling, observations),
  `features/crawl` + `features/analyse` (the two phases), `model/` (payload, prompt, token
  assignment), `features/extract/ThemeExtractionTask.ts` (the task), `storage/` (S3 screenshots, KV
  lock + artifact cache), `graphql/` (typeDefs + resolvers).
- `graphql/extraction.typeDefs.ts` matches the client **exactly**: `input ThemeExtractionInput
{ url, name, crawlLimit, force }`, `extend type ThemeMutation { extractTheme(data:
ThemeExtractionInput!): ThemeExtractionStartedResponse! }` → `{ taskId, extractionId }`, plus
  `getThemeExtraction` and `abortThemeExtraction`. The websocket actions
  (`theme.extraction.progress|failed|done`) match `app-theme/useExtraction.ts`.
- Resolvers are complete: `extractTheme` gates on `canCreate("theme")`, validates the URL, mints an
  `extractionId`, triggers the task, returns `{ taskId, extractionId }`; `getThemeExtraction` reads
  the task via `TasksCrud`; `abortThemeExtraction` calls `taskService.abort`.
- `@webiny/api-theme` **is** registered in your running API (the error suggests `ThemeMutation`), but
  `@webiny/api-theme-extraction` is referenced nowhere outside its own package.
- `ExtractionSettings` (which model / connection) has **no implementation** anywhere — by design; the
  feature's own comment says the project must register one.

## Root cause of the error

`ThemeExtractionFeature.register(container)` is never called during API bootstrap → the extraction
typeDefs/resolvers are never added → `ThemeExtractionInput` and `extractTheme` don't exist on the
schema → `"Unknown type ThemeExtractionInput"` / `"Cannot query field extractTheme"`.

## Enablement checklist (the actual work)

All of this happens in the **project that runs the API** (where `ThemeFeature` is already registered)
and in its deploy config — not in the framework packages, which are done.

### 1. Register the feature in the API — handled by the extension

- `@webiny/api-theme-extraction` is now a dependency in the root `package.json` (linked via `yarn`).
  AI Power-Ups needs no direct dep — the extension reads it through `webiny/api/ai-powerups`.
- `extensions/themeExtraction/ThemeExtractionExtension.ts` already calls
  `ThemeExtractionFeature.register(container)`. It imports the feature from the subpath
  `@webiny/api-theme-extraction/feature.js` (the package's `exports` map is `"./*": "./*"`, so this
  resolves) rather than the package index — deliberately, because the index is kept puppeteer-free and
  re-exporting the feature there would drag the browser driver into anything importing the pure
  helpers.
- Register the extension the usual way (via the project's `webiny.config.tsx`).
- Ensure api-core's `Ai` feature is available (it is, platform-side) — `AnalyseCrawl` depends on it.

### 2. `ExtractionSettings` implementation — DONE (points extraction at AI Power-Ups)

Webiny's existing AI features (AI Image Enhance, AI page generation) don't use a named connection —
they read the provider configured in **AI Power-Ups settings** (`GetSettingsUseCase` →
`providers.presets[0]`), decrypt the key, and pass an **inline** `{ sdkName, apiKey }` connection to
`Ai.generateText`. Extraction now does the same, via the extension in step 1 (see "Changes already
applied"). `model` must still be `"<provider>/<model>"` or `Ai` rejects it — which is exactly what AI
Power-Ups stores.

**Without any `ExtractionSettings` impl**, the task fails at the analyse step with a "configure a
model" error (intentional early failure).

### 3. AI provider — configure once in AI Power-Ups

- Because the extension reads `providers.presets[0]`, just configure the model + API key under **AI
  Power-Ups settings** once; extraction reuses the same provider as AI Image Enhance / page
  generation. No separate connection registry or key handling is needed.

### 4. Chromium runtime (the background-task Lambda)

- Attach the `chromium` Lambda layer (`scripts/layers/chromium.js`, Chromium 123) to the
  **background-task function** (puppeteer-core ships no browser).
- The executable is resolved from a candidate list (`/opt/chromium`, `/opt/bin/chromium`, …). If the
  first deploy can't find it, the error lists every path tried — set
  `WEBINY_CHROMIUM_EXECUTABLE_PATH` (or `WEBINY_CHROMIUM_PACK_PATH`) to fix it.
- The background-task Lambda is the shared 900s / 1024 MB function. The one-at-a-time
  `ExtractionLock` guards against two concurrent crawls OOM-ing it; consider raising memory if large
  pages OOM.

### 5. S3 screenshots

- `S3ScreenshotStore` uses `process.env.S3_BUCKET` (the file-manager bucket, under a
  `theme-extraction/` prefix). Ensure that env var is present on the background-task function.
- The S3 lifecycle rule already exists — `packages/project-aws/.../CoreFileManager.ts` expires the
  `theme-extraction/` prefix after `CRAWL_CACHE_MAX_AGE_DAYS` (7). **No new infra needed** (keep the
  two values in step if you change either).

### 6. DynamoDB KV (lock + artifact cache)

- `KeyValueExtractionLock` and `KeyValueArtifactCache` use the platform KV (DynamoDB conditional
  writes). Confirm the KV table/env is present (standard in a Webiny project). Note the lock is
  best-effort per tenant, not a distributed mutex — acceptable given one function.

### 7. Build + deploy

- Build `@webiny/api-theme-extraction` and the API; redeploy the API with the chromium layer attached
  and the env vars set.

## Verification

1. Introspect the deployed schema: `ThemeExtractionInput` and `ThemeMutation.extractTheme` are
   present.
2. Admin → New theme → "from a website". Watch websocket progress:
   `checking-rules → crawling → analysing → creating-theme → done`.
3. Reload mid-run → the UI recovers via `getThemeExtraction(taskId)`.
4. A draft theme is created with `metadata.source = "extraction"`; the `ExtractionReviewBanner` shows
   `entryUrl`, `summary`, `confidence`, and the `uncertain[]` list.
5. Abort during a run frees the slot (next run isn't refused).

## Risks / unknowns

- **Chromium path** settles on the first deploy; the diagnostic makes that a one-line env fix, not a
  debug cycle.
- **puppeteer in a 1 GB Lambda** is the heaviest thing the API runs — OOM risk on heavy pages,
  mitigated by the lock + per-page 60s timeout + 5-page default.
- **AI cost/latency** — 5 pages + screenshots → one model call under a 5-minute ceiling.
- **WAF / bot walls** — surfaces as `BotChallengeError`; the user-agent is honest by default and
  overridable via `WEBINY_THEME_EXTRACTION_USER_AGENT` for a customer extracting their own site.
- The running API is your **project** (not this repo), so steps 1–3, 5 (env) and 7 live there. The S3
  lifecycle (step 5 infra) and the chromium layer script already exist in the framework/project-aws.

## Explicitly NOT needed

- No new crawl / analyse / task / schema / resolver code. It exists and is tested — do not rebuild it.
- The only framework change made was widening the AI-connection seam (see "Changes already applied").
  The feature is registered via the subpath import, so no index re-export was needed.
