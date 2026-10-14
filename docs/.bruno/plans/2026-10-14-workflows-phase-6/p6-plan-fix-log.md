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
