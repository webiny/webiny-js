# Phase 6 plan fix log

## Review round 1

Files: `00-shared.md` (S) plus the overviews named per item. Verified against code: `Ai.listModels()` / `listModelsByConnections()` (`api-core/src/features/ai/Ai.ts`, the latter reads connection factories), the resolver's own source (`ResolveAiCapabilityUseCase`: settings connection presets with `apiKeyEncrypted`, `sdkNameFromModel`), the WB SEO key (`properties.seo.{title,description,metaTags,canonicalUrl,noIndex,noFollow}` in `website-builder-sdk/src/types.ts` and `SeoSettingsGroup`; `properties.title` in `toWbPageReviewTarget.ts`), `controller.runtime.isAborted()` (`TaskController.ts`), flat adapter files in both `features/target/` folders, `advancedPublishingWorkflow` flag in `WorkflowsFeature.ts`.

1. Model source (red) -> new DI service `ConfiguredAiModelsService` (`list`, `findConnection`; `Ai.listModels()` filtered by providers with a connection preset with `apiKeyEncrypted`; id `providerId/modelId`, name `modelName`), built in Task 15 and used by the resolver, `ListWorkflowAiModelsUseCase` and `AiStepType.checkConfig`; test helpers fake settings + `Ai.listModels`. Touched: S (architecture 8, Global Constraints, Review Focus 6 new, R165, R169, R176, A60, Tasks 15, 16, 17), 6.8 and 6.9 overviews (task tables, Review Focus, Done when).
2. Gating (red) -> R177: `listAiModels` schema, `AiStepType`, `AiStepRunner` and all workflows-dependent pieces only when `aiPowerups` and `advancedPublishingWorkflow` are both on; test aiPowerups on + workflows off. Touched: S (architecture 9, R176, R177, R178, Review Focus 6, Tasks 16, 19), 6.9 and 6.10 overviews.
3. WB write scope (red) -> R172 explicit allowlist `properties.title`, `properties.seo.{title,description,canonicalUrl,noIndex,noFollow}`; path, language, metaTags, social and the rest read-only; port writes the full merged `properties`; tests path/language unchanged and other keys preserved. Touched: S (architecture 7, Review Focus 3, R172, Task 13), 6.7 overview.
4. Save lock-out -> R165 and Task 14: `checkConfig` only for new or changed steps (by step id, deep compare). Touched: S (architecture 8, R165, Task 14), 6.8 overview.
5. No-runner fallback -> R168, Task 4: neutral `The step failed.` / `The step was aborted.`; automation texts unchanged. Touched: S (R168, Task 4), 6.2 overview.
6. Bypass test -> Review Focus 4, Task 10, 6.5 Done when: AsyncLocalStorage, no restore test; `isActive()` false after return/throw and for a concurrent outside save, update awaited inside `bypass.run`. Touched: S, 6.5 overview.
7. Cancel during the call -> R175, A56, A59, Review Focus 1, Task 3 (`isAborted` in run params), Task 19 (abort in `stopWhen`/`onStepFinish`/before tools, aborted reason, test). Touched: S, 6.10 overview.
8. Signal floor -> R175 and Task 4: id waits unaffected; remaining - 30000 < 1000 fires at once, `The AI review timed out.`; Task 4 test for an already-aborted signal. Touched: S, 6.2 overview.
9. Logger context -> R168 and Task 3: identical messages/context, `WorkflowStepRunTaskRun.test.ts` unchanged; Review Focus 5. Touched: S, 6.2 overview.
10. Tool names -> R167 regex `^[A-Za-z][A-Za-z0-9_]{0,63}$`. Touched: S.
11. E2E -> Task 20 lists the copied handler helper (`createContextHandler` equivalent) and adds `packages/ai-powerups/ci.config.json` (ddb, ddb-os,ddb). Touched: S, 6.10 overview.
12. Task 11 -> `CmsEntryReviewTargetEditor.ts` and `toEditorFields.ts` flat in `features/target/`, no barrel; applied the same to Task 13's `WbPageReviewTargetEditor.ts` for consistency. Touched: S, 6.6 and 6.7 overviews.

## Review round 2

Verified against code: `TaskController.ts` / `TaskManagerStore.ts` (isAborted reads the task loaded at run start), `StuckStepService.ts` (currently limited to `AUTOMATION_STEP_TYPE`), `AiConnectionPreset` in `ai-powerups/src/api/features/Connections/{types,index}.ts`, `Extension.ts` (plain `aiPowerups` early return, `CapabilitiesFeature.register`).

1. R175 cancel-during-call (red) -> `isAborted` replaced by async `isStale(): Promise<boolean>` built in the handler (re-reads the review, `getStaleStepRunReason`, throttled one read per `STEP_RUN_STALE_CHECK_INTERVAL_MS = 5000`, sticky); AiStepRunner checks it in `stopWhen`, `onStepFinish` and before each tool; Task 19 test flips the stored review. Touched: S (Review Focus 1, R175, A56, A59, Task 3 interface and placeholder, Task 4, Task 19, Task 20), 6.2 and 6.10 overviews.
2. Task 14 placement -> after `existing` read and savedOn conflict check, compares normalised new config with `existing.steps[].config`; test conflict / not-found wins. Touched: S, 6.8 overview.
3. Task 15 types -> `AiConnectionPreset`; `ConfiguredAiModelsFeature` registered under the plain `aiPowerups` gate in `Extension.ts` after `CapabilitiesFeature`. Touched: S, 6.8 overview.
4. ai-powerups tests -> Global Constraints: `yarn test` and `yarn test:os` once `ci.config.json` exists; Task 20 runs e2e on both one at a time and the existing test files once under `test:os`. Touched: S, 6.10 overview (table, Done when).
5. Task 19 inline -> tool set and stale check inline in `AiStepRunner.run`, no wrapper around `tool.execute` (R175, Task 19).
6. R170 -> `run` fails with `failureReasons.error` when `iteration` > 1; test in Task 19; 6.10 overview.
7. Task 4 stuck -> every `inReview` step with a task id is checked; no-runner step fails with `The step failed.`; test (R168, Task 4, 6.2 overview).
8. Cross-refs -> 6.8 overview cites Review Focus 6 only; item 5 dropped from 6.9 overview.

## Review round 3

Verified against code: `WorkflowStepRunTaskHandler.ts` (`controller.state.updateOutput({ idWaits, state })` is the existing output shape, written today only on `continue`; `idWaits` falls back to `task.iterations - 1`).

1. R170 / Tasks 3-4 / Task 19 re-entry -> the handler persists `controller.state.updateOutput({ idWaits, state })` once the id wait is over and before any runner, for every step type, so a re-entered task sees fixed `idWaits` and `iteration` 2; Task 4 handler test runs the handler twice on one task (iterations 4 then 5) with an AI-like runner and asserts the second run fails with `failureReasons.error`; phase 5 tests stay green. Touched: S (R170, R175, Task 3, Task 4), 6.2 overview.
2. R175 / Task 19 stale stop -> `stopWhen` and the pre-tool check only set a local `stale` flag; `onStepFinish` dropped (SDK swallows throws); `run` checks the flag right after `generateText` returns or throws, before reading output (`NoOutputGeneratedError`), and throws `StepRunFailure(failureReasons.aborted)`. Touched: S (R175, Review Focus 1, Task 19), 6.10 overview.
3. Tasks 19 / 20 tests -> fake timers (or the Task 4 injectable clock) advanced by `STEP_RUN_STALE_CHECK_INTERVAL_MS` after flipping the review. Touched: S (Review Focus 1, Task 4, Task 19, Task 20), 6.2 and 6.10 overviews.
