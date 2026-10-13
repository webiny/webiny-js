# Phase 5 plan fix log

Finding -> fix, one line each. Files: `00-shared.md` (S) and the `5.*/00-5.*.md` overviews.

1. S Architecture: "three hard-coded review branches" is wrong (5 importers; only validator and listStepTypes go through the registry) -> reworded.
2. R132: `ai` row was fixed `available: false`; code uses the `aiPowerups` flag via `FeatureFlags` (throwing read = persistence error) -> R132 keeps today's behaviour.
3. R138: automation unavailable text was "No automations are available."; existing text and test is "No automation is defined." -> kept.
4. R138: row order (registry order + ai last) contradicts the existing review, ai, automation order -> fixed display order stated.
5. R138 and Task 3: `ListAutomationDefinitionsUseCase` errors lacked `WorkflowPersistenceError` (permission read can throw, R87) -> added; layout and feature registration spelled out; response type added.
6. R138: `z.toJSONSchema` can throw on unrepresentable schemas -> `unrepresentable: "any"`.
7. Task 1: `ReviewStepType.validate` must take over `validateReviewConfig`; validator keeps structural checks and step normalisation; `WorkflowValidator.test.ts` message and `MODEL_NAMESPACE_PATTERN` noted; impl naming follows the repo pattern (`ReviewStepTypeImpl` + exported `ReviewStepType`).
8. Task 3: `ListWorkflowStepTypesUseCase` keeps its `FeatureFlags` dependency -> stated.
9. R135: task `state` persistence was vague -> `controller.state.updateOutput` / `getOutput`.
10. R139/Task 4: `ReviewStepRun.taskId: string` but a failed reach has `taskId: null` -> `string | null`.
11. R140: `runs[].startedOn` is null for a step failed from `pending` -> fallback chain startedOn, reachedOn, finishedOn.
12. R143: a new review does not exist until the one save (first save is a create) -> the handler also waits on review-not-found; wait counted by `iterations <= STEP_RUN_TASKID_WAIT_TRIES`; seconds constant named. A52 updated (id from `mdbid()` in `RequestReviewUseCase`, verified).
13. R145: `DEFAULT_AUTOMATION_MAX_ITERATIONS` named.
14. R148 (answers: validated "before run"): handler re-parses settings before every run with the R146 reason -> added.
15. R149/Tasks 9, 10: `ReviewStepRunTriggerService` only wraps `TaskService.trigger` for one caller (no-wrapper rule) -> trigger inlined in `AutomationStepType.reach`; service and `ReviewStepRunTriggerError` removed; Task 9 renamed `task-09-abort-service-and-constants.md`; Review Focus 3 points to Task 10.
16. Task 10: `reachRun` failing after a successful trigger leaked the task -> abort via `ReviewTaskAbortService`.
17. R150 vs D36/D62/spec 9.2: only the save block is exempted; move rule (D84) and delete/trash (D134) are not -> bypass narrowed to `BlockUpdateWhileInReview`; Task 8, Review Focus 3, 5.3 overview updated; WB package no longer touched.
18. R151/Task 13: `DeleteTargetReviews` is `DeleteTargetReviewsUseCase` -> fixed.
19. R156 and Global Constraints: `@webiny/background-tasks` first imported in Task 11 (augmentation), not Task 9 (api-core `TaskService` only) -> moved; overview rows updated.
20. Task 12: `controller.response.continue({ input, delay })` does not exist; the param is `wait` (seconds) -> fixed.
21. Task 11: definition/handler registration pattern (`TaskDefinition.createImplementation`, `handler` pointing at `TaskHandler.createImplementation`) spelled out as in `DeleteModelTask`.
22. Task 5: exhaustive `toAssignmentRecordValues` switch and `ReviewEvent` union need the new facts/events -> added.
23. Task 6: `actionableStepId` already returns a failed step; stale "always false until phase 5" comments -> noted.
24. Task 7: `GetRunnableTaskDefinitionUseCase.execute` is synchronous (Result) and the throw must sit inside `resolve(async ...)`; same error as unknown definition -> stated.
25. Task 4: mapper path (`features/review/shared/ReviewEntryMapper.ts`), shared `WorkflowsReviewStep` GraphQL type, fixtures -> stated.
26. R158/Tasks 16, 17: WB response type is `WbPageReviewResponse` (not `WebsiteBuilderPageReviewResponse`); roots `CmsMutation`/`WbMutation`; `taskId`/`runs` come from the shared type, apps add none; CMS task mirrors `ReassignCmsEntryReviewStep` for `stepId`. 5.4 overview updated.
27. Interfaces Task 9/14 and R157: `FakeTaskService` assigned to Task 9, `FakeGetTask` to Task 14 (was unassigned); consumers lists fixed (Task 15 does not use Task 9).

Open (needs a ruling): R150 narrowed to the save block on the strict reading of D62; D36 says an automation "may change anything", so whether automations may also move the target (D84 move blocks) is undecided.

## Pre-flight 2 — contract/5.1/5.2/5.4/5.5

Finding -> fix. Files: `00-shared.md` (S), task files by number.

1. S, P2: `StepType.reach` error union could not carry what `review.fail` returns (writer 7-11: T10 swallowed `ReviewStepNotCurrentError`) -> R131 and the Task 1 interface widened to `ReviewInvalidStateError | ReviewStepNotCurrentError`; new R159 (never swallow); Task 10 and ReviewStepReacher entries note it. Task 1 abstraction code, produces line and JSDoc updated.
2. S, P3: malformed step config at reach reused the missing-definition text -> R146 gains `The automation step configuration is not valid.`; Task 10 interface line states it; Task 2 interface notes the inline `safeParse`; Task 18 guide failure list and Review Focus 4 name it.
3. S, P4 and P7: `did not finish in <n>` used the runner ceiling; wait/iteration counting unspecified -> R145 rewritten (definition's own `maxIterations`, also in `onMaxIterations`), new R163 (`iteration` = task iterations minus id-waits; `maxIterations` counts runs; non-id-wait guard failures end the task); Task 2 `AutomationRunParams.iteration` comment; Task 18 guide item 5.
4. S, P5: requester identity of the run was only stated for the trigger -> new R161 (handler wraps `run` and its engine calls in `withIdentity(requester)`, never `withoutAuthorization`; pinning test; verify how tasks restore identity); Review Focus 3 gains the Task 12 test; Task 18 guide item 6 reworded.
5. S, P6: `continue` signature -> new R162 `controller.response.continue(data, { seconds })`; R143 and the Task 12 interface updated.
6. S, P8: R158 said both restarts return `canRestart` -> reworded (updated review; `canRestart` read through the review get operations); Task 18 spec edit 7 carries it; Tasks 16/17 already read it through get queries.
7. S, P9: accepted deviations were unrecorded -> new R160 (restart clears timestamps, `candidateTeamIds []`, `stepReached.taskId` + 5 expectations, `outcome` String, automation row `configSchema` JSON schema, interim review-like reach before Task 10, `RestartReviewStepFeature` in `ReviewLifecycleFeature`, zod devDep, guide path).
8. S, P1: helper names diverged between tasks -> R157 now lists the one set (`TestAutomationDefinition` + `runCalls`, `registerTestAutomation(container, overrides?)`, `createAutomationStep`, `createTestStepType`, `FakeTaskService` with `triggeredTasks`/`abortedTasks`/`fakeTaskFaults`/`resetFakeTasks`, `FakeGetTask`, `FakeTaskController`, `FailingReviewSave`, `stepRunReviews.ts`) and says app packages keep package-local copies with the same names; Task 2 interface and Task 3 consumers aligned.
9. Task 2: `registerTestAutomation(overrides?)` returned a callback -> now `registerTestAutomation(container, overrides?)` returning the instance (cast to the abstraction in one place); every call site in Task 2 and Task 3 tests rewritten (`setup: container => { registerTestAutomation(container, ...) }`); registry tests no longer build callbacks.
10. Task 2: interim review-like reach of an automation step not stated -> note added (accepted interim, R160); placeholder `reach` wording in the contract fixed.
11. Task 2/3 helper exports in S contradicted the tasks (`createTestStepType(overrides?)`, `createAutomationStep(overrides?)`) -> S now matches the task files (`createTestStepType(options)` in `TestStepType.ts`, `createAutomationStep(params)` in `TestAutomationDefinition.ts`).
12. Task 16: CMS `TestAutomationDefinition` was a DI-only stub with no `runCalls` and a one-argument `registerTestAutomation` -> rewritten to the contract (class, `runCalls`, `TestAutomationOverrides`, `registerTestAutomation(container, overrides?)` still usable as a `legacyPlugins` function plugin, verified against `createCmsTestHandler`).
13. Task 16: `FakeTaskService` copy differed from Task 9's (`abortedTasks: string[]`, no reset) -> aligned (`TriggeredTask.name`, `AbortedTask { id, message }`, `resetFakeTasks()`, task numbering reset); test `beforeEach` uses `resetFakeTasks()`.
14. Task 16 and 17, real bug: after a restart the step is `inReview` with a fake task id; single reads run stuck detection (Task 14) and the CMS `NoopGetTask` returns `null` (WB: the real task storage does not know it), so the step would be failed as lost and the "again" and `canRestart` false assertions break -> package-local `FakeGetTask` (running, `createdBy` = the trigger identity) registered by `registerFakeTaskService` in both packages; `@webiny/background-tasks` devDependency noted (Task 14 adds it for CMS, already in WB). The Task 14 `NoopGetTask` comment ("no CMS test builds an in-review automation step") is wrong once Task 16 exists: reported to the 5.3 fixer.
15. Task 17: "same exports as Task 16" list updated (`testAutomationSettingsSchema`, `resetFakeTasks`, `FakeGetTask`, `runCalls`); GraphQL test note on imported helpers added in Tasks 16 and 17.
16. Task 18: consumed-names list said "`WorkflowStepRun` task" -> `workflowsStepRun` private task definition; guide item 7 gains the step-config failure reason; spec edit 7 gains P8 wording.
17. Verified against current code: `REVIEW_STEP_TYPE` importers (5), `WorkflowValidator` and `StoreWorkflowUseCase` shapes, `ListWorkflowStepTypesUseCase` body and test file imports (`FeatureFlags`, `ThrowingFeatureFlags`, `zod`), `WorkflowsSchemaFactory` resolver path, existing `__tests__/__helpers` list, CMS/WB test helper exports and paths used by Tasks 16 and 17 (`identities`, `permissions`, `engine`, `entries`, `Scripted*`, `Throwing*`, `userContext`, `extraModels`), `seedFailedStep`, `getReviewViewerFlags` / `applyTargetAccess`, and every stale "phase 5" comment, spec, roadmap and decisions anchor quoted in Task 18 (all present). No placeholders found in 5.1, 5.2, 5.4, 5.5 or the contract.

Open for the 5.3 fixer: Task 9/14 CMS `NoopGetTask` comment (item 14); Task 12 must carry the R161 identity test and the R162/R163 semantics.

## Pre-flight 2 — 5.3

Tasks 7-15 checked against current code (`BackgroundTasksGraphQLSchema` resolver, `ErrorResponse` shape, `createTaskDefinition` helper, `ReviewSaver`, `ReviewRepository`, `TaskService`, `GetTaskUseCase`, `TaskControl`/`TaskManager`, `TaskResponse.continue`, CMS and WB test contexts, `BlockUpdateWhileInReview`).

1. Task 7: no change needed. Verified: `ErrorResponse` returns `{ data: null, error: { code, message, data, stack } }` (stack not selected by the test queries), the resolver sits in `resolve(async ...)`, helper `createTaskDefinition` lacked `isPrivate` (the task adds it), the listed existing tests exist.
2. Task 8: no change needed. Verified the singleton flag is shared by the CMS test container and the hook, helper names (`updateName`, `move`, `trash`, `deletePermanently`, `countEngineCalls`) and the doc comment text of `BlockUpdateWhileInReview`.
3. Task 9 (P1): saver test builds its review with Task 5's `createPendingAutomationReview` / `automationActor` (was a hand-built `Review.request`); CMS `NoopTaskService` replaced by a package-local `FakeTaskService` with the same name and exports as the api-workflows one (R157); `GenericRecord` import dropped (`TaskService.TaskInput`, no `@webiny/api` dep in the CMS package); comment explains the `as never` casts; production registration order noted.
4. Task 10 (P2): reacher error union is now `ReviewInvalidStateError | ReviewStepNotCurrentError` (`ReviewStepReacher.Error`); the two "InvalidState only" filters are gone, whatever `review.fail` / `review.reachRun` / `StepType.reach` returns is returned; `RequestReviewUseCase` error map gains `stepNotCurrent` (it was the one caller without it; R159's "callers already handle both" was wrong for it); new test pins the pass-through with a local step type whose `reach` fails.
5. Task 10 (P3): an unparsable step config fails with `The automation step configuration is not valid.` (own reason); the check order is now config, definition, models, settings, trigger; test updated.
6. Task 11 (P4): `onMaxIterations` names the automation definition's own `maxIterations` (default 50) from the review snapshot via `AutomationDefinitionRegistryService` (new handler dependency), never the 10000 ceiling; three new tests.
7. Task 11 (P2): hooks distinguish a review not found (info) from a failed read (`Logger.error`).
8. Task 11 (P1): `FakeTaskController` is created here (first handler test), moved out of Task 12; the placeholder `run` test uses it instead of an `as never` stub; test context registers the automation with `registerTestAutomation(container, overrides?)`.
9. Task 12 (P5, R161): the run and the failure path execute inside `IdentityContext.withIdentity(requester)` (built from `review.createdBy` as in R149, new `IdentityContext` dependency); verified with `TaskControl` / `TaskManager` that the runner already restores `task.createdBy` and runs `definition.run` inside `withoutAuthorization` (hooks run outside it) and recorded this in the task; new test pins that the automation and the approve call see the requester identity (decorator on `ApproveReviewStepUseCase`), outer identity restored.
10. Task 12 (P7, R163): waits only when the review is not found or the step does not carry this task's id yet (review active, in progress); every other guard result ends the task at once; `iteration = task.iterations - idWaits` (`idWaits` kept in the task output next to `state`, one whole `updateOutput({ idWaits, state })` write); the automation's `maxIterations` counts runs; tests rewritten (immediate-end cases, waits not counted, limit 2 after 3 waits, default 50).
11. Task 12 (P3, P2): unparsable config uses the fixed reason; failed read/fail/save in the failure path are logged and returned as task errors; target-sync failure after the fail write is logged; a discarded stale failure logs its reason; placeholder test of Task 11 removed.
12. Task 12 (P6): `continue(input, { seconds })` throughout; contract note rewritten (R162).
13. Task 13: no change needed (verified `CancelTargetReviews` goes through `CancelReviewUseCase`, constructor and use-case code match the repo).
14. Task 14: NoopGetTask comment fixed (Task 16 registers a package-local `FakeGetTask`), `NoopTaskService` references renamed to `FakeTaskService`; a target-sync failure after marking a step stuck is now logged (R159) and the test expects the log.
15. Task 15 (P1): test registers the automation through `registerTestAutomation(container)`; reacher union noted; registration note: the code registers use-case features in `WorkflowsFeature` (not `ReviewLifecycleFeature`), contradicting R160's wording.
16. 5.3 overview table updated for the above.

### Pre-flight 2 — follow-up after the 5.3 fixer

18. S: R163 notes the task output `{ idWaits, state }` written in one `updateOutput`; R160 and Task 15 interface now say `RestartReviewStepFeature` is registered in `WorkflowsFeature`; R159 names `ReviewStepReacher.Error` and the `stepNotCurrent` addition to `IRequestReviewUseCaseErrors` (Task 10); `FakeTaskController` is Task 11's (R157, Task 9 interface line); R157 notes the CMS `FakeTaskService` copy comes from Task 9.
19. Task 16: Task 9 now creates the CMS `FakeTaskService` (registered by default), so Task 16 no longer creates it: it creates `FakeGetTask.ts` (`FakeGetTask`, `registerFakeGetTask`, built on Task 9's `triggeredTasks`, overriding Task 14's `NoopGetTask`); tests use `registerFakeGetTask` and `resetFakeTasks`.
20. Task 17: WB keeps `FakeTaskService.ts` (real `BackgroundTasksFeature` there; reuse Task 9's conditional copy if present, plus `registerFakeTaskService`) and creates `FakeGetTask.ts`; tests register both.
21. Error unions: `RestartReviewStepUseCase.Error` already includes `ReviewStepNotCurrentError`; wrappers in Tasks 16/17 derive their union from it, so no text change needed.
22. Cross-file name scan (registerTestAutomation, FakeTaskService, FakeGetTask, createFakeTaskController, FailingReviewSave/reviewSaveFaults, StepRunFailure, WorkflowBypassService, ReviewTaskAbortService, StuckStepService, RestartReviewStepUseCase, canRestartByPermission, both registry services, getStaleStepRunReason, STEP_RUN_TASK_DEFINITION_ID, NoopGetTask): signatures consistent, no stale `NoopTaskService`; no further changes.
