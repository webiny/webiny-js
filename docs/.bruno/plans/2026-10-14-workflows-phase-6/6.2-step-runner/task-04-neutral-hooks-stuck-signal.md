### Task 4: Neutral hooks, actor, stuck detection, timeout signal, stale check service, self-cleanup

Spec 5.1, 7.4; D7, D27, D28, D57, D87; R144, R146, R148, R152, R159, R161, R163, R168, R170, R175, R179; A53, A56; Review Focus 1 (the stale stop needs a real stored-review check, and the neutral handler keeps the guard) and 5 (no automation behaviour changes); D132. Task 3 made the handler dispatch by step type with a placeholder signal. This task finishes the neutral handler and adds the shared stale check:

- **Neutral hooks (R168).** `onError`, `onAbort` and `onMaxIterations` read the step from the review snapshot after the stale guard passes, pick `runner = runners.get(step.type)` and store `runner.failureReasons.error`, `runner.failureReasons.aborted` and `runner.maxIterationsReason(step)`. A step whose type has no runner (the `ai` type turned off by a flag or licence) gets the neutral fixed texts `The step failed.` (`onError`, `onMaxIterations`) and `The step was aborted.` (`onAbort`), so no hook ever throws. Automation keeps its texts because its runner exists (`The automation failed.`, `The automation was aborted.`, `The automation did not finish in <n> iterations.`): the phase 5 hook tests, built with the automation runner registered, run unchanged. The handler drops its `AutomationDefinitionRegistryService` dependency and the `automationStepConfigSchema` / `DEFAULT_AUTOMATION_MAX_ITERATIONS` imports (they live in `AutomationStepRunner` since Task 3).
- **Stuck detection per runner (R168, R152).** `StuckStepService.check` handles every `inReview` current step that carries a task id, whatever its type (no longer only `AUTOMATION_STEP_TYPE`). The reason is `runner.failureReasons.stuck`; a step with no runner is still checked and, when stuck, fails with `The step failed.`. Grace, task statuses, the stale guard and every log are unchanged. A `review` step carries no task id, so it is still never looked up.
- **The timeout signal (R175, user answer Q4).** After the id wait is over and before the runner is called, the handler builds an `AbortController` from the task's remaining runtime: `budget = controller.runtime.getRemainingMilliseconds() - STEP_RUN_TIMEOUT_MARGIN_MS` (30000). When `budget < STEP_RUN_MIN_TIMEOUT_MS` (1000) the signal is aborted at once; otherwise a `setTimeout(budget)` aborts it, and the timer is cleared in a `finally` after the runner returns or throws (a plain `setTimeout`, so tests can observe it and fake timers can drive it; `AbortSignal.timeout` could not be). The id-wait iterations return before this code, so they are unaffected. The runner decides what an aborted signal means (the AI runner fails with `The AI review timed out.`, Task 19); the handler only passes it. The automation runner ignores it.
- **`StepRunStaleCheckService` (R175, Review Focus 1).** A new DI service (`features/stepRun/StepRunStaleCheckService/{abstractions,StepRunStaleCheckService,feature,index}.ts`, dependencies `ReviewRepository` and `Logger`), registered by `WorkflowsFeature`. `isStale({ reviewId, stepId, task: { id, createdById } }): Promise<Result<boolean, ReviewPersistenceError>>` re-reads the review through `ReviewRepository` and applies `getStaleStepRunReason` with the task identity (the same guard as the post-run re-guard), because `controller.runtime.isAborted()` only sees the task loaded at run start and stays false when another request cancels. A review that is no longer found is stale (`ok(true)`). A failed or throwing read is logged (`"Could not read the review to check the step is current."`, context `{ error, taskId, reviewId, stepId }`) and answered with a failed Result (`fail(error)` when the read failed with a `ReviewPersistenceError`, otherwise `fail(new ReviewPersistenceError(error))`; a throwing read becomes `fail(new ReviewPersistenceError(error))`): the answer is fail-closed (a failed read is NOT "not stale"), so a caller that is about to write refuses on a failed Result, while a caller that only decides whether to keep going (the AI runner's stop check, Task 19) treats a failed Result as not stale and keeps going because the post-run guard still protects its own write. The service logs every failure, so callers do not log it again. The method never rejects. The service does one read per call: it does not throttle and keeps no state. **Throttling and stickiness belong to the caller**, `AiStepRunner` (Task 19, R175): it calls the service at most once per `STEP_RUN_STALE_CHECK_INTERVAL_MS` (5000, constant added here) with its own local state and, once it has seen `true`, keeps answering `true`; the throttle and sticky tests live in Task 19, not here. The handler does not call the service and `StepRunnerRunParams` has no `isStale` (Task 3); the automation runner never uses it, so an automation run makes exactly the repository reads it made in phase 5.
- **The `singleRun` pre-run write and re-entry (R170, R175).** For a runner with `singleRun` true only, once the id wait is over and BEFORE the runner is called, the handler refuses a re-entered task whose `iteration` is greater than 1 through the one failure path with `runner.failureReasons.error` (the runner is not called, nothing is written to the output), and otherwise persists `controller.state.updateOutput({ idWaits, state })` (the existing output shape, `state` as read or `null`). A re-entered task (the platform re-invoked it after the process died mid-call) then reads the fixed `idWaits` and gets a real `iteration` of 2. Without that write the output is only written on `continue`, `idWaits` would fall back to `iterations - 1` and `iteration` would be 1 again. A runner with `singleRun` false (automation) gets no pre-run write, so every phase 5 `outputUpdates` expectation stays unchanged. A failing output write is the task error, like the `continue` write (the runner is not called).
- **Actor.** The approve and reject `actor` is `runner.getActor(requester)` (Task 3, pinned there with a fake runner whose actor is the step owner); `actorTeamIds: []`.
- Two additions to `features/stepRun/constants.ts` beyond the contract's `STEP_RUN_TIMEOUT_MARGIN_MS` and `STEP_RUN_STALE_CHECK_INTERVAL_MS`: `STEP_RUN_MIN_TIMEOUT_MS = 1000` (the signal floor, R175) and the two neutral texts `STEP_RUN_NEUTRAL_FAILED_REASON` / `STEP_RUN_NEUTRAL_ABORTED_REASON`, shared by the hooks and stuck detection.

- **Self-cleanup (R179).** `WorkflowStepRunTaskDefinition.selfCleanup` changes from `"never"` to `"always"` (`WorkflowStepRunTaskDefinition.ts:17`; the doc comment says why). Every outcome is already on the step (success through the runner, failure and abort through the fixed-text hooks; raw errors live in the logs), so the finished task has nothing left to keep. The platform turns the task's database logs off for a self-cleaning definition (`TaskDefinitionDefaultsDecorator.databaseLogs`), but an abort still writes one log row: `TaskService.abort` creates a log (`TasksCrud.createLog`) when the task has none, whatever `databaseLogs` says. So this task also changes `deleteTaskLogs` in `packages/background-tasks/src/api/crud/cleanupTaskSubtree.ts`: it always lists the task's logs by task id (`listLogs({ where: { task: task.id } })`) and deletes them, with no `definition.databaseLogs` check and no definition lookup (the cleanup removes whatever exists; the abort semantics are unchanged). A cleaned-up step run task therefore leaves no log rows, the abort log included. **When the platform deletes the task, verified in `packages/background-tasks`:** `SelfCleaningTaskHandlerDecorator` wraps every handler; its `onDone`, `onError` and `onAbort` first `await` the definition's own hook (a throwing hook is swallowed and logged, so the task is still cleaned) and only then call `CleanupTaskSubtreeUseCase`. The hooks are called after the run's final status was saved (`TaskControl.runEvents` for done and error; `TaskService.abort` after it set `aborted`). A task that reaches `maxIterations` runs `onMaxIterations` (which writes the step) and returns an error result, whose `onError` then triggers the cleanup. So cleanup always runs AFTER the hook wrote the step. Pinned by existing background-tasks tests for `onDone` (`SelfCleaningTaskHandlerDecorator.test.ts` "invokes the handler's onDone before cleanup", `selfCleanup.integration.test.ts` "user's onDone runs before cleanup fires") and by two new unit tests and three new integration tests here (`onError` and `onAbort` ordering, and the abort log of an `"always"` task being removed), and by the `cleanupTaskSubtree` unit tests (logs are swept whatever `databaseLogs` or the definition says, across pages). A throw from `definition.run` (the handler) is caught by `TaskManager` and becomes an error result, so `onError` fires and the cleanup runs; a hook that throws is swallowed and the task is still cleaned. The catch-without-events path (no hook, no cleanup) is reached only when `manager.run`, `databaseResponse.from` or `runEvents` itself throws (existing behaviour, unchanged): then the task stays and `StuckStepService` handles it. **Accepted decision:** if the step-writing hook itself fails, the cleanup still runs; the step stays `inReview` with no task and `StuckStepService` fails it once the grace measured from the step start has passed (a long step is failed at the next read). Cost: in that double failure the step carries the stuck reason instead of the hook's reason. **Accepted trace (cancel while the run continues):** `ReviewTaskAbortService` aborts the task, `onAbort` runs and the cleanup deletes it while the handler may still be running; the cancelled in-flight step then ends and the platform logs one "Task returned an error result" line per cancelled in-flight step. This is accepted: it is better than `selfCleanup` `"never"`, where that late result overwrote the `aborted` status. Nothing in phase 6 reads a finished `workflowsStepRun` task: `StuckStepService` (`GetTaskUseCase`) already gives a missing task the grace measured from the step start and fails the step as stuck afterwards (pinned by the phase 5 stuck tests for a null task and by Task 4's stuck tests); Task 20 stubs `GetTaskUseCase` to answer `null`. **Cancel after cleanup:** `ReviewTaskAbortService` treats a `TaskNotFoundError` from the abort like the existing `TaskAbortError` (an info log `The step run task had already ended.`, not an error log), because a task that finished and was cleaned up is gone; a failed abort for any other reason still logs the error. `TaskService.abort` reads the task with `getTask`, which answers `null` on any read failure, so a storage error during an abort is logged as the info "already ended" rather than an error (accepted).

Pinned by tests: the neutral and per-runner hook texts, stuck detection per runner and for a no-runner step, the signal (timer value, cleared, floor, already-aborted fails through the one failure path, id waits unaffected), `StepRunStaleCheckService` (false while current, true after a cancel, after a restart under another task and when not found, a failed Result and one log for a failed and for a throwing read, no throttle and no state; the throttle and sticky tests are Task 19's), its registration, and the `singleRun` re-entry (the handler run twice on one task); the definition's `selfCleanup` `"always"`, cleanup after the `onError` and `onAbort` hooks (background-tasks unit and integration tests), an abort of an already deleted task logging info only, and the cleanup deleting the abort log of an `"always"` task (`cleanupTaskSubtree` and `selfCleanup.integration.test.ts`). Phase 5 handler, hook and stuck tests run unchanged; the one phase 5 expectation that changes is `selfCleanup` in `WorkflowStepRunTask.test.ts` (and its test title).

**Files:**
- Modify: `packages/api-workflows/src/features/stepRun/constants.ts`
- Modify: `packages/api-workflows/src/features/stepRun/WorkflowStepRunTask/WorkflowStepRunTaskHandler.ts`
- Modify: `packages/api-workflows/src/features/stepRun/StuckStepService/StuckStepService.ts`
- Modify: `packages/api-workflows/src/features/stepRun/StuckStepService/abstractions.ts` (doc comment only)
- Modify: `packages/api-workflows/src/features/stepRun/WorkflowStepRunTask/WorkflowStepRunTaskDefinition.ts` (R179: `selfCleanup`, doc comment)
- Modify: `packages/api-workflows/src/features/stepRun/ReviewTaskAbortService/ReviewTaskAbortService.ts` (`TaskNotFoundError` logs info)
- Modify: `packages/background-tasks/src/api/crud/cleanupTaskSubtree.ts` (`deleteTaskLogs` sweeps logs whatever `databaseLogs` says)
- Create: `packages/api-workflows/src/features/stepRun/StepRunStaleCheckService/abstractions.ts`
- Create: `packages/api-workflows/src/features/stepRun/StepRunStaleCheckService/StepRunStaleCheckService.ts`
- Create: `packages/api-workflows/src/features/stepRun/StepRunStaleCheckService/feature.ts`
- Create: `packages/api-workflows/src/features/stepRun/StepRunStaleCheckService/index.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Modify: `packages/api-workflows/__tests__/__helpers/FakeTaskController.ts` (one optional parameter)
- Create: `packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskSignals.test.ts`
- Create: `packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRunnerHooks.test.ts`
- Create: `packages/api-workflows/__tests__/stepRun/StuckStepServiceRunners.test.ts`
- Create: `packages/api-workflows/__tests__/__helpers/FailingReviewGet.ts`
- Create: `packages/api-workflows/__tests__/stepRun/StepRunStaleCheckService.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts` (one assertion)
- Modify: `packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts` (one expectation and the test title, R179)
- Modify: `packages/api-workflows/__tests__/stepRun/ReviewTaskAbortService.test.ts` (one test)
- Modify: `packages/api-workflows/__tests__/__helpers/FakeTaskService.ts` (`FakeAbortFault` gains `"gone"`)
- Modify: `packages/background-tasks/__tests__/decorators/SelfCleaningTaskHandlerDecorator.test.ts` (two ordering tests)
- Modify: `packages/background-tasks/__tests__/runner/selfCleanup.integration.test.ts` (two ordering tests, one abort-log test)
- Modify: `packages/background-tasks/__tests__/crud/cleanupTaskSubtree.test.ts` (the fake `listLogs` pages; two tests change: logs are swept without `databaseLogs` and without a definition; one added: a task whose logs span pages)

**Interfaces:**
- Consumes:
  - Task 3: `StepRunner` (`~/features/stepRun/StepRunner/index.js`: `Interface`, `Outcome`, `Params`, `FailureReasons`; `singleRun`, `failureReasons`, `maxIterationsReason(step)`, `getActor(requester)`, `run(params)`), `StepRunnerRegistryService` (`get(type): StepRunner.Interface | null`), the handler's `runners` constructor member and its `run` as left by Task 3, `StepRunFailure`, test helpers `TestStepRunner`, `registerTestStepRunner`, `createFakeStepReview(taskId?, type?)`, `FAKE_STEP_TYPE`, `fakeActor` (`~tests/__helpers/TestStepRunner.js`).
  - Existing: `getStaleStepRunReason`, `ReviewRepository.get(id)`, `ReviewNotFoundError`, `controller.runtime.getRemainingMilliseconds()` (`TaskController`), `controller.state.updateOutput(values)`, `createFakeTaskController` (`FakeTaskControllerParams`: `iterations`, `createdById`, `output`, `outputUpdateError`; result `{ controller, task, outputUpdates }`), `captureLoggedErrors` / `loggedErrors` / `loggedInfos`, `RecordingEventPublisher` / `recordedEvents` / `workflowEventTypes`, `FailingReviewSave`, `resetFakeTasks`, `fakeGetTask` (`set(id, status, createdById?, finishedOn?)`, `calls`, `reset()`), `expectOk`, `requester`, `AUTOMATION_STEP_ID`, `STEP_RUN_STUCK_GRACE_MS`, `GetReviewUseCase`.
- Produces (matches the contract):
  - `features/stepRun/constants.ts`: `STEP_RUN_TIMEOUT_MARGIN_MS = 30000`, `STEP_RUN_STALE_CHECK_INTERVAL_MS = 5000` (contract), plus `STEP_RUN_MIN_TIMEOUT_MS = 1000`, `STEP_RUN_NEUTRAL_FAILED_REASON = "The step failed."`, `STEP_RUN_NEUTRAL_ABORTED_REASON = "The step was aborted."`.
  - The handler passes `signal` (`StepRunner.Params`) and, for `singleRun`, persists `{ idWaits, state }` first; hooks and stuck detection as above. Consumed by Tasks 17 (stuck for `ai`) and 19 (`AiStepRunner` reads `signal`, relies on the pre-run write and injects `StepRunStaleCheckService`).
  - `features/stepRun/StepRunStaleCheckService` (`~/features/stepRun/StepRunStaleCheckService/index.js`): `StepRunStaleCheckService` with `isStale(params: { reviewId: string; stepId: string; task: StepRunTaskIdentity }): Promise<Result<boolean, ReviewPersistenceError>>` (namespace `Interface`, `Params`); registered by `WorkflowsFeature` (`StepRunStaleCheckFeature`). Consumed by Task 19.
  - `WorkflowStepRunTaskDefinition.selfCleanup === "always"` (R179), and the platform guarantee that a cleaned-up task's logs (the abort log included) are deleted whatever `definition.databaseLogs` says (`cleanupTaskSubtree`). No new export; nothing in later tasks reads a finished step run task.
  - Test helper `FailingReviewGet` (`~tests/__helpers/FailingReviewGet.js`): a `ReviewRepository` decorator whose `get` fails or throws on demand and counts reads (`reviewGetFaults`).
  - `createFakeTaskController` gains the optional `remainingMilliseconds` (default 900000, so every existing test is unchanged).

- [ ] **Step 1: Write the failing tests**

Modify `packages/api-workflows/__tests__/__helpers/FakeTaskController.ts`: add the optional parameter

```ts
export interface FakeTaskControllerParams {
    taskId?: string;
    /** Defaults to the requester: the trigger runs as the requester (R149). */
    createdById?: string;
    /** `iterations` of the task; 1 on the first run. */
    iterations?: number;
    input?: StepRunTaskInput;
    /** What the previous iteration wrote with `updateOutput`. */
    output?: ITaskOutput;
    /** Makes `updateOutput` throw, as a storage failure would. */
    outputUpdateError?: Error;
    /** What `controller.runtime.getRemainingMilliseconds()` answers; 900000 when omitted (R175). */
    remainingMilliseconds?: number;
}
```

and change the `runtime` member of the controller to:

```ts
        runtime: {
            isCloseToTimeout: () => false,
            isAborted: () => false,
            getRemainingSeconds: () =>
                Math.floor((params.remainingMilliseconds ?? 900000) / 1000),
            getRemainingMilliseconds: () => params.remainingMilliseconds ?? 900000
        }
```

Create `packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskSignals.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TaskHandler } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { resetFakeTasks } from "~tests/__helpers/FakeTaskService.js";
import { FailingReviewSave } from "~tests/__helpers/FailingReviewSave.js";
import {
    captureLoggedErrors,
    loggedErrors,
    loggedInfos
} from "~tests/__helpers/CapturingLogger.js";
import {
    createFakeTaskController,
    type FakeTaskControllerParams
} from "~tests/__helpers/FakeTaskController.js";
import {
    RecordingEventPublisher,
    recordedEvents,
    workflowEventTypes
} from "~tests/__helpers/RecordingEventPublisher.js";
import { AUTOMATION_STEP_ID } from "~tests/__helpers/stepRunReviews.js";
import {
    createFakeStepReview,
    registerTestStepRunner,
    TestStepRunner,
    type TestStepRunnerOptions
} from "~tests/__helpers/TestStepRunner.js";
import { expectOk } from "~tests/__helpers/fixtures.js";
import type { ReviewData } from "~/domain/review/types.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { STEP_RUN_TIMEOUT_MARGIN_MS } from "~/features/stepRun/constants.js";
import { StepRunFailure } from "~/features/stepRun/StepRunFailure.js";
import { WorkflowStepRunTaskHandler } from "~/features/stepRun/WorkflowStepRunTask/index.js";
import type { StepRunTaskInput } from "~/features/stepRun/types.js";

const DEFINITION = {
    id: "workflowsStepRun",
    title: "Workflow step run",
    isPrivate: true,
    maxIterations: 10000
};

const INPUT: StepRunTaskInput = { reviewId: "review-1", stepId: AUTOMATION_STEP_ID };

const setup = async (options: TestStepRunnerOptions = {}) => {
    const runner = new TestStepRunner(options);
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerDecorator(FailingReviewSave);
            container.registerDecorator(RecordingEventPublisher);
            registerTestStepRunner(container, runner);
        }
    });
    const handler = context.container.resolveImplementation(
        WorkflowStepRunTaskHandler
    ) as TaskHandler.Interface<StepRunTaskInput>;
    const repository = context.container.resolve(ReviewRepository);

    const runController = (fake: ReturnType<typeof createFakeTaskController>) => {
        return handler.run({
            input: fake.task.input,
            controller: fake.controller,
            definition: DEFINITION
        });
    };

    return {
        runner,
        runController,
        read: async (): Promise<ReviewData> => expectOk(await repository.get("review-1")),
        seed: async (data: ReviewData): Promise<void> => {
            expectOk(await repository.save(data));
            recordedEvents.length = 0;
        },
        run: (controllerParams: FakeTaskControllerParams = {}) => {
            const fake = createFakeTaskController(controllerParams);
            return { ...fake, result: runController(fake) };
        }
    };
};

describe("workflowsStepRun timeout signal (R175, user answer Q4)", () => {
    beforeEach(() => {
        resetFakeTasks();
        loggedErrors.length = 0;
        loggedInfos.length = 0;
        recordedEvents.length = 0;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("fires at the remaining runtime minus the margin, and clears its timer when the runner returns", async () => {
        const { run, seed, runner } = await setup();
        await seed(createFakeStepReview());
        const remaining = 900000;
        const budget = remaining - STEP_RUN_TIMEOUT_MARGIN_MS;
        const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
        const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
        let abortedBefore: boolean | null = null;
        let abortedAfter: boolean | null = null;
        let timerIndex = -1;
        runner.runImpl = async params => {
            abortedBefore = params.signal.aborted;
            timerIndex = setTimeoutSpy.mock.calls.findIndex(([, delay]) => delay === budget);
            // Fire the handler's timer by hand, as the clock would at `budget`.
            (setTimeoutSpy.mock.calls[timerIndex][0] as () => void)();
            abortedAfter = params.signal.aborted;
            return { type: "approved" };
        };

        const { result } = run({ iterations: 4, remainingMilliseconds: remaining });
        await result;

        expect(budget).toBe(870000);
        expect(timerIndex).toBeGreaterThanOrEqual(0);
        expect(abortedBefore).toBe(false);
        expect(abortedAfter).toBe(true);
        expect(clearTimeoutSpy).toHaveBeenCalledWith(setTimeoutSpy.mock.results[timerIndex].value);
    });

    it("clears its timer when the runner throws", async () => {
        const { run, seed, runner } = await setup();
        await seed(createFakeStepReview());
        const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
        const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
        runner.runImpl = async () => {
            throw new StepRunFailure("The fake step failed on purpose.");
        };

        const { result } = run({ iterations: 4, remainingMilliseconds: 900000 });
        await result;

        const index = setTimeoutSpy.mock.calls.findIndex(([, delay]) => delay === 870000);
        expect(index).toBeGreaterThanOrEqual(0);
        expect(clearTimeoutSpy).toHaveBeenCalledWith(setTimeoutSpy.mock.results[index].value);
    });

    it.each([
        { remaining: 31000, aborted: false },
        { remaining: 30999, aborted: true },
        { remaining: STEP_RUN_TIMEOUT_MARGIN_MS, aborted: true },
        { remaining: 0, aborted: true }
    ])(
        "starts the signal aborted only when less than a second is left after the margin (remaining $remaining ms)",
        async ({ remaining, aborted }) => {
            const { run, seed, runner } = await setup();
            await seed(createFakeStepReview());
            let seen: boolean | null = null;
            runner.runImpl = async params => {
                seen = params.signal.aborted;
                return { type: "approved" };
            };

            await run({ iterations: 4, remainingMilliseconds: remaining }).result;

            expect(seen).toBe(aborted);
        }
    );

    it("fails the step through the one failure path when the runner gets an already-aborted signal", async () => {
        const { run, seed, read, runner } = await setup();
        await seed(createFakeStepReview());
        runner.runImpl = async params => {
            if (params.signal.aborted) {
                throw new StepRunFailure("The fake step timed out.");
            }
            return { type: "approved" };
        };

        const { result } = run({ iterations: 4, remainingMilliseconds: 1000 });

        await expect(result).resolves.toMatchObject({ status: "done" });
        const stored = await read();
        expect(stored).toMatchObject({ state: "inProgress", currentStepState: "failed" });
        expect(stored.steps[0]).toMatchObject({
            state: "failed",
            comment: "The fake step timed out."
        });
        expect(workflowEventTypes()).toEqual(["Workflows/Review/StepFailed"]);
        expect(loggedErrors).toEqual([]);
    });

    it("leaves the id-wait iterations alone, whatever the remaining runtime", async () => {
        const { run, seed, read, runner } = await setup({ singleRun: true });
        await seed(createFakeStepReview(null));
        const before = await read();

        for (const iterations of [1, 2, 3]) {
            const waiting = run({ iterations, remainingMilliseconds: 0 });
            await expect(waiting.result).resolves.toEqual({
                status: "continue",
                input: INPUT,
                wait: 2
            });
            expect(waiting.outputUpdates).toEqual([]);
        }

        expect(runner.runCalls).toEqual([]);
        expect(await read()).toEqual(before);
    });
});

// The stale check is not built here: a runner that needs it injects `StepRunStaleCheckService`
// (tested in `StepRunStaleCheckService.test.ts`) and throttles its own calls; the throttle and
// the sticky answer are tested with the AI runner (Task 19).

describe("workflowsStepRun re-entry of a singleRun runner (R170, R175)", () => {
    beforeEach(() => {
        resetFakeTasks();
        loggedErrors.length = 0;
        loggedInfos.length = 0;
        recordedEvents.length = 0;
    });

    it("persists { idWaits, state } before the runner, and refuses the re-entered task through the one failure path", async () => {
        const { runController, seed, read, runner } = await setup({ singleRun: true });
        await seed(createFakeStepReview());
        const outputAtRunnerCall: unknown[][] = [];
        const first = createFakeTaskController({ iterations: 4 });
        runner.runImpl = async () => {
            outputAtRunnerCall.push(structuredClone(first.outputUpdates));
            throw new Error("The process died.");
        };

        // First invocation: three waits for the task id, then the run (task iteration 4).
        await expect(runController(first)).resolves.toEqual({
            status: "error",
            error: { message: "The process died." }
        });

        expect(outputAtRunnerCall).toEqual([[{ idWaits: 3, state: null }]]);
        expect(runner.runCalls).toHaveLength(1);
        expect(runner.runCalls[0].iteration).toBe(1);
        expect((await read()).steps[0]).toMatchObject({ state: "inReview", comment: null });

        // The platform invokes the task again (iteration 5): the stored output fixes `idWaits`.
        const second = createFakeTaskController({ iterations: 5, output: first.outputUpdates[0] });
        await expect(runController(second)).resolves.toMatchObject({ status: "done" });

        expect(runner.runCalls).toHaveLength(1);
        expect(second.outputUpdates).toEqual([]);
        const stored = await read();
        expect(stored).toMatchObject({ state: "inProgress", currentStepState: "failed" });
        expect(stored.steps[0]).toMatchObject({ state: "failed", comment: "The fake step failed." });
        expect(workflowEventTypes()).toEqual(["Workflows/Review/StepFailed"]);
        expect(loggedErrors).toEqual([]);
    });

    it("writes nothing to the output while it waits for the task id", async () => {
        const { run, seed, runner } = await setup({ singleRun: true });
        await seed(createFakeStepReview(null));

        const waiting = run({ iterations: 2 });

        await expect(waiting.result).resolves.toEqual({
            status: "continue",
            input: INPUT,
            wait: 2
        });
        expect(waiting.outputUpdates).toEqual([]);
        expect(runner.runCalls).toEqual([]);
    });

    it("returns the task error and does not call the runner when the pre-run write fails", async () => {
        const { run, seed, read, runner } = await setup({ singleRun: true });
        await seed(createFakeStepReview());
        const before = await read();

        const { result } = run({
            iterations: 4,
            outputUpdateError: new Error("Output is not writable.")
        });

        await expect(result).resolves.toEqual({
            status: "error",
            error: { message: "Output is not writable." }
        });
        expect(runner.runCalls).toEqual([]);
        expect(await read()).toEqual(before);
    });

    it("keeps the state it read in the output it persists", async () => {
        const { runController, seed, runner } = await setup({ singleRun: true });
        await seed(createFakeStepReview());
        const outputAtRunnerCall: unknown[][] = [];
        const fake = createFakeTaskController({
            iterations: 4,
            output: { idWaits: 3, state: { keep: true } }
        });
        runner.runImpl = async () => {
            outputAtRunnerCall.push(structuredClone(fake.outputUpdates));
            return { type: "approved" };
        };

        await expect(runController(fake)).resolves.toMatchObject({ status: "done" });

        expect(outputAtRunnerCall).toEqual([[{ idWaits: 3, state: { keep: true } }]]);
        expect(runner.runCalls[0].state).toEqual({ keep: true });
        expect(runner.runCalls[0].iteration).toBe(1);
    });

    it("gives a singleRun false runner no pre-run write, only the write of a continue", async () => {
        const { runController, seed, runner } = await setup({ singleRun: false });
        await seed(createFakeStepReview());
        const outputAtRunnerCall: unknown[][] = [];
        const fake = createFakeTaskController({ iterations: 4 });
        runner.runImpl = async () => {
            outputAtRunnerCall.push(structuredClone(fake.outputUpdates));
            return { type: "continue", wait: 1, state: { page: 1 } };
        };

        await expect(runController(fake)).resolves.toEqual({
            status: "continue",
            input: INPUT,
            wait: 1
        });

        expect(outputAtRunnerCall).toEqual([[]]);
        expect(fake.outputUpdates).toEqual([{ idWaits: 3, state: { page: 1 } }]);
    });

    it("lets a singleRun false runner run again on a re-entered task (automation may continue)", async () => {
        const { runController, seed, runner } = await setup({ singleRun: false });
        await seed(createFakeStepReview());
        runner.runImpl = async () => ({ type: "continue", wait: 1 });
        const fake = createFakeTaskController({
            iterations: 5,
            output: { idWaits: 3, state: { page: 1 } }
        });

        await runController(fake);

        expect(runner.runCalls.map(call => call.iteration)).toEqual([2]);
    });
});
```

Create `packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRunnerHooks.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import {
    TaskDefinition,
    type TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import {
    TaskDataStatus,
    type TaskService
} from "@webiny/api-core/features/task/TaskService/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { resetFakeTasks } from "~tests/__helpers/FakeTaskService.js";
import { FailingReviewSave } from "~tests/__helpers/FailingReviewSave.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { NOW, expectOk, requester } from "~tests/__helpers/fixtures.js";
import { AUTOMATION_STEP_ID } from "~tests/__helpers/stepRunReviews.js";
import {
    createFakeStepReview,
    fakeActor,
    registerTestStepRunner,
    TestStepRunner
} from "~tests/__helpers/TestStepRunner.js";
import type { ReviewData } from "~/domain/review/types.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import {
    STEP_RUN_MAX_ITERATIONS,
    STEP_RUN_TASK_DEFINITION_ID
} from "~/features/stepRun/constants.js";
import { WorkflowStepRunTaskHandler } from "~/features/stepRun/WorkflowStepRunTask/index.js";
import type { StepRunTaskInput } from "~/features/stepRun/types.js";

type StepRunTask = TaskService.Task<StepRunTaskInput>;

const createTask = (id = "task-1", createdById: string = requester.id): StepRunTask => {
    return {
        id,
        name: "Workflow step: Check links",
        definitionId: STEP_RUN_TASK_DEFINITION_ID,
        executionName: "",
        input: { reviewId: "review-1", stepId: AUTOMATION_STEP_ID },
        output: { error: { message: "Boom" } },
        iterations: 3,
        taskStatus: TaskDataStatus.RUNNING,
        eventResponse: undefined,
        createdOn: NOW,
        savedOn: NOW,
        createdBy: { id: createdById, displayName: requester.displayName, type: "admin" }
    };
};

const DEFINITION: TaskDefinition.Metadata = {
    id: STEP_RUN_TASK_DEFINITION_ID,
    title: "Workflow step run",
    isPrivate: true,
    maxIterations: STEP_RUN_MAX_ITERATIONS
};

type HookName = "onError" | "onMaxIterations" | "onAbort";

/** `runner` null registers no runner of the fake type: only the built-in automation runner exists. */
const setup = async (runner: TestStepRunner | null) => {
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerDecorator(FailingReviewSave);
            if (runner) {
                registerTestStepRunner(container, runner);
            }
        }
    });
    const handler = context.container.resolveImplementation(
        WorkflowStepRunTaskHandler
    ) as TaskHandler.Interface<StepRunTaskInput>;
    const repository = context.container.resolve(ReviewRepository);

    return {
        read: async (): Promise<ReviewData> => expectOk(await repository.get("review-1")),
        seed: async (data: ReviewData): Promise<void> => {
            expectOk(await repository.save(data));
        },
        call: async (hook: HookName, task: StepRunTask): Promise<void> => {
            await handler[hook]!.bind(handler)({ task, definition: DEFINITION });
        }
    };
};

const RUNNER_REASONS: { hook: HookName; reason: string }[] = [
    { hook: "onError", reason: "The fake step failed." },
    { hook: "onAbort", reason: "The fake step was aborted." },
    {
        hook: "onMaxIterations",
        reason: `The fake step "${AUTOMATION_STEP_ID}" did not finish in 3 iterations.`
    }
];

const NEUTRAL_REASONS: { hook: HookName; reason: string }[] = [
    { hook: "onError", reason: "The step failed." },
    { hook: "onAbort", reason: "The step was aborted." },
    { hook: "onMaxIterations", reason: "The step failed." }
];

describe("workflowsStepRun hooks use the runner of the step's type (R168)", () => {
    beforeEach(() => {
        resetFakeTasks();
        loggedErrors.length = 0;
    });

    it.each(RUNNER_REASONS)(
        "$hook stores the runner's own reason for its step type",
        async ({ hook, reason }) => {
            const { call, seed, read } = await setup(new TestStepRunner());
            await seed(createFakeStepReview());

            await call(hook, createTask());

            const stored = await read();
            expect(stored.currentStepState).toBe("failed");
            expect(stored.steps[0]).toMatchObject({
                state: "failed",
                comment: reason,
                owner: fakeActor,
                taskId: "task-1"
            });
        }
    );

    it("takes the reasons from the runner registered for the step's type, not another runner", async () => {
        const { call, seed, read } = await setup(
            new TestStepRunner({
                type: "other-type",
                failureReasons: { error: "The other step failed." }
            })
        );
        await seed(createFakeStepReview());

        await call("onError", createTask());

        expect((await read()).steps[0].comment).toBe("The step failed.");
    });

    it("takes the maximum iteration reason from the runner's own limit", async () => {
        const { call, seed, read } = await setup(new TestStepRunner({ maxIterations: 9 }));
        await seed(createFakeStepReview());

        await call("onMaxIterations", createTask());

        expect((await read()).steps[0].comment).toBe(
            `The fake step "${AUTOMATION_STEP_ID}" did not finish in 9 iterations.`
        );
    });
});

describe("workflowsStepRun hooks for a step type with no runner (R168)", () => {
    beforeEach(() => {
        resetFakeTasks();
        loggedErrors.length = 0;
    });

    it.each(NEUTRAL_REASONS)(
        "$hook stores the neutral fixed text and never throws",
        async ({ hook, reason }) => {
            const { call, seed, read } = await setup(null);
            await seed(createFakeStepReview("task-1", "no-such-runner"));

            await expect(call(hook, createTask())).resolves.toBeUndefined();

            const stored = await read();
            expect(stored.currentStepState).toBe("failed");
            expect(stored.steps[0]).toMatchObject({ state: "failed", comment: reason });
        }
    );

    it("logs the task error of onError and stores none of it", async () => {
        const { call, seed, read } = await setup(null);
        await seed(createFakeStepReview("task-1", "no-such-runner"));

        await call("onError", createTask());

        expect((await read()).steps[0].comment).toBe("The step failed.");
        expect(loggedErrors.map(logged => logged.message)).toEqual([
            "The step run task ended with an error."
        ]);
    });

    it.each(NEUTRAL_REASONS)(
        "$hook still writes nothing for a stale task of such a step",
        async ({ hook }) => {
            const { call, seed, read } = await setup(null);
            await seed(createFakeStepReview("task-1", "no-such-runner"));

            await call(hook, createTask("task-other"));
            await call(hook, createTask("task-1", "user-someone-else"));

            expect((await read()).steps[0]).toMatchObject({ state: "inReview", comment: null });
        }
    );
});
```

Create `packages/api-workflows/__tests__/stepRun/StuckStepServiceRunners.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { TaskDataStatus } from "@webiny/api-core/features/task/TaskService/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { fakeGetTask } from "~tests/__helpers/FakeGetTask.js";
import {
    RecordingEventPublisher,
    recordedEvents,
    workflowEventTypes
} from "~tests/__helpers/RecordingEventPublisher.js";
import {
    createFakeStepReview,
    FAKE_STEP_TYPE,
    registerTestStepRunner,
    TestStepRunner
} from "~tests/__helpers/TestStepRunner.js";
import { expectOk } from "~tests/__helpers/fixtures.js";
import type { ReviewData } from "~/domain/review/types.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { GetReviewUseCase } from "~/features/review/GetReview/index.js";

/** One review ("review-1") is stored; `runner` null registers no runner of the fake type. */
const setup = async (seed: ReviewData, runner: TestStepRunner | null) => {
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerDecorator(RecordingEventPublisher);
            if (runner) {
                registerTestStepRunner(container, runner);
            }
        }
    });
    expectOk(await context.container.resolve(ReviewRepository).save(seed));
    recordedEvents.length = 0;

    return { getReview: context.container.resolve(GetReviewUseCase) };
};

describe("Stuck detection covers every step type (R152, R168)", () => {
    beforeEach(() => {
        fakeGetTask.reset();
        loggedErrors.length = 0;
        recordedEvents.length = 0;
    });

    it("fails a stuck step with the stuck reason of its own runner", async () => {
        fakeGetTask.set("task-1", TaskDataStatus.SUCCESS);
        const { getReview } = await setup(createFakeStepReview("task-1"), new TestStepRunner());

        const review = expectOk(await getReview.execute({ id: "review-1" }));

        expect(fakeGetTask.calls).toEqual(["task-1"]);
        expect(review).toMatchObject({
            state: "inProgress",
            currentStepState: "failed",
            currentStepType: FAKE_STEP_TYPE
        });
        expect(review.steps[0]).toMatchObject({
            state: "failed",
            comment: "The fake step ended without a result."
        });
        expect(workflowEventTypes()).toEqual(["Workflows/Review/StepFailed"]);
        expect(loggedErrors).toEqual([]);
    });

    it.each([TaskDataStatus.FAILED, TaskDataStatus.ABORTED])(
        "fails a stuck step of such a type when its task is %s (finished long ago)",
        async status => {
            fakeGetTask.set("task-1", status);
            const { getReview } = await setup(createFakeStepReview("task-1"), new TestStepRunner());

            const review = expectOk(await getReview.execute({ id: "review-1" }));

            expect(review.steps[0]).toMatchObject({
                state: "failed",
                comment: "The fake step ended without a result."
            });
        }
    );

    it("fails a stuck step whose type has no runner with the neutral text", async () => {
        fakeGetTask.set("task-1", TaskDataStatus.SUCCESS);
        const { getReview } = await setup(createFakeStepReview("task-1", "no-such-runner"), null);

        const review = expectOk(await getReview.execute({ id: "review-1" }));

        expect(review).toMatchObject({
            state: "inProgress",
            currentStepState: "failed",
            currentStepType: "no-such-runner"
        });
        expect(review.steps[0]).toMatchObject({ state: "failed", comment: "The step failed." });
        expect(workflowEventTypes()).toEqual(["Workflows/Review/StepFailed"]);
    });

    it.each([TaskDataStatus.PENDING, TaskDataStatus.RUNNING])(
        "leaves a step whose task is %s alone, whatever its type",
        async status => {
            fakeGetTask.set("task-1", status);
            const withRunner = await setup(createFakeStepReview("task-1"), new TestStepRunner());
            const first = expectOk(await withRunner.getReview.execute({ id: "review-1" }));

            const withoutRunner = await setup(
                createFakeStepReview("task-1", "no-such-runner"),
                null
            );
            const second = expectOk(await withoutRunner.getReview.execute({ id: "review-1" }));

            expect(first.steps[0]).toMatchObject({ state: "inReview", comment: null });
            expect(second.steps[0]).toMatchObject({ state: "inReview", comment: null });
        }
    );

    it("keeps the stale guard for a step of such a type: a task somebody else created is not stuck", async () => {
        fakeGetTask.set("task-1", TaskDataStatus.SUCCESS, "user-intruder");
        const { getReview } = await setup(createFakeStepReview("task-1", "no-such-runner"), null);

        const review = expectOk(await getReview.execute({ id: "review-1" }));

        expect(review.steps[0]).toMatchObject({ state: "inReview", comment: null });
        expect(workflowEventTypes()).toEqual([]);
    });

    it("never looks up a task for a step that has no task id, as a review step has none", async () => {
        const { getReview } = await setup(createFakeStepReview(null, "review"), null);

        const review = expectOk(await getReview.execute({ id: "review-1" }));

        expect(fakeGetTask.calls).toEqual([]);
        expect(review.steps[0]).toMatchObject({ state: "inReview", comment: null });
    });
});
```

Create `packages/api-workflows/__tests__/__helpers/FailingReviewGet.ts` (a `ReviewRepository` decorator like `FailingReviewSave`; every call counts, `mode` makes `get` fail or throw):

```ts
import { Result } from "@webiny/feature/api";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";
import type { ReviewData } from "~/domain/review/types.js";

export interface ReviewGetFaults {
    /** `fail` returns a failed Result, `throw` throws; `null` passes through. Sticky: reset per test. */
    mode: "fail" | "throw" | null;
    /** How many times `get` was called. */
    reads: number;
}

export const reviewGetFaults: ReviewGetFaults = { mode: null, reads: 0 };

class FailingReviewGetImpl implements ReviewRepository.Interface {
    public constructor(private decoratee: ReviewRepository.Interface) {}

    public async get(id: string): ReturnType<ReviewRepository.Interface["get"]> {
        reviewGetFaults.reads += 1;
        if (reviewGetFaults.mode === "fail") {
            return Result.fail(new ReviewPersistenceError(new Error("Storage is down.")));
        }
        if (reviewGetFaults.mode === "throw") {
            throw new Error("Storage threw.");
        }
        return this.decoratee.get(id);
    }

    public getActiveByTarget(
        params: ReviewRepository.ActiveByTargetParams
    ): ReturnType<ReviewRepository.Interface["getActiveByTarget"]> {
        return this.decoratee.getActiveByTarget(params);
    }

    public countInProgressByWorkflow(
        workflowId: string
    ): ReturnType<ReviewRepository.Interface["countInProgressByWorkflow"]> {
        return this.decoratee.countInProgressByWorkflow(workflowId);
    }

    public listInProgressByWorkflow(
        workflowId: string
    ): ReturnType<ReviewRepository.Interface["listInProgressByWorkflow"]> {
        return this.decoratee.listInProgressByWorkflow(workflowId);
    }

    public listByTarget(
        params: ReviewRepository.ByTargetParams
    ): ReturnType<ReviewRepository.Interface["listByTarget"]> {
        return this.decoratee.listByTarget(params);
    }

    public list(
        params: ReviewRepository.ListParams
    ): ReturnType<ReviewRepository.Interface["list"]> {
        return this.decoratee.list(params);
    }

    public listInReviewByOwners(
        ownerIds: string[]
    ): ReturnType<ReviewRepository.Interface["listInReviewByOwners"]> {
        return this.decoratee.listInReviewByOwners(ownerIds);
    }

    public save(review: ReviewData): ReturnType<ReviewRepository.Interface["save"]> {
        return this.decoratee.save(review);
    }

    public delete(id: string): ReturnType<ReviewRepository.Interface["delete"]> {
        return this.decoratee.delete(id);
    }
}

export const FailingReviewGet = ReviewRepository.createDecorator({
    decorator: FailingReviewGetImpl,
    dependencies: []
});
```

Create `packages/api-workflows/__tests__/stepRun/StepRunStaleCheckService.test.ts`. The service does one repository read per call and keeps no state; the review is the one-step fake review of Task 3 (`createFakeStepReview`), whose step carries `task-1`, created by the requester:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { FailingReviewGet, reviewGetFaults } from "~tests/__helpers/FailingReviewGet.js";
import { AUTOMATION_STEP_ID } from "~tests/__helpers/stepRunReviews.js";
import { createFakeStepReview } from "~tests/__helpers/TestStepRunner.js";
import { expectOk, requester } from "~tests/__helpers/fixtures.js";
import { Review } from "~/domain/review/Review.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";
import type { ReviewData } from "~/domain/review/types.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import { StepRunStaleCheckService } from "~/features/stepRun/StepRunStaleCheckService/index.js";

const LATER = "2026-10-09T11:00:00.000Z";

const CURRENT_TASK = { id: "task-1", createdById: requester.id };

const setup = async () => {
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerDecorator(FailingReviewGet);
        }
    });
    const repository = context.container.resolve(ReviewRepository);
    const saver = context.container.resolve(ReviewSaver);
    const service = context.container.resolve(StepRunStaleCheckService);

    return {
        service,
        seed: async (data: ReviewData): Promise<void> => {
            expectOk(await repository.save(data));
            reviewGetFaults.reads = 0;
        },
        /** Cancels the stored review, as a requester would while the runner works. */
        cancel: async (): Promise<void> => {
            const review = Review.fromData(expectOk(await repository.get("review-1")));
            expectOk(review.cancel({ actor: requester, now: LATER }));
            expectOk(await saver.save(review));
            reviewGetFaults.reads = 0;
        },
        /** Restarts the step under another task, as the restart use case would. */
        moveToAnotherTask: async (): Promise<void> => {
            const data = expectOk(await repository.get("review-1"));
            data.steps[0].taskId = "task-new";
            expectOk(await repository.save(data));
            reviewGetFaults.reads = 0;
        }
    };
};

describe("StepRunStaleCheckService (R175, Review Focus 1)", () => {
    beforeEach(() => {
        reviewGetFaults.mode = null;
        reviewGetFaults.reads = 0;
        loggedErrors.length = 0;
    });

    it("is ok(false) for a review whose step is this task's", async () => {
        const { service, seed } = await setup();
        await seed(createFakeStepReview());

        const result = await service.isStale({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            task: CURRENT_TASK
        });

        expect(expectOk(result)).toBe(false);
        expect(reviewGetFaults.reads).toBe(1);
        expect(loggedErrors).toEqual([]);
    });

    it("is ok(true) once the review is cancelled", async () => {
        const { service, seed, cancel } = await setup();
        await seed(createFakeStepReview());
        await cancel();

        const result = await service.isStale({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            task: CURRENT_TASK
        });

        expect(expectOk(result)).toBe(true);
        expect(loggedErrors).toEqual([]);
    });

    it("is ok(true) once the step is restarted under a new task, and ok(false) for the new task", async () => {
        const { service, seed, moveToAnotherTask } = await setup();
        await seed(createFakeStepReview());
        await moveToAnotherTask();

        const oldTask = await service.isStale({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            task: CURRENT_TASK
        });
        const newTask = await service.isStale({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            task: { id: "task-new", createdById: requester.id }
        });

        expect(expectOk(oldTask)).toBe(true);
        expect(expectOk(newTask)).toBe(false);
    });

    it("is ok(true) for a task somebody else created", async () => {
        const { service, seed } = await setup();
        await seed(createFakeStepReview());

        const result = await service.isStale({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            task: { id: "task-1", createdById: "user-intruder" }
        });

        expect(expectOk(result)).toBe(true);
    });

    it("is ok(true) when the review is not found, without logging an error", async () => {
        const { service } = await setup();

        const result = await service.isStale({
            reviewId: "review-missing",
            stepId: AUTOMATION_STEP_ID,
            task: CURRENT_TASK
        });

        expect(expectOk(result)).toBe(true);
        expect(loggedErrors).toEqual([]);
    });

    it("fails closed and logs once when the read fails (a failed read is not a \"not stale\" answer)", async () => {
        const { service, seed } = await setup();
        await seed(createFakeStepReview());
        reviewGetFaults.mode = "fail";

        const result = await service.isStale({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            task: CURRENT_TASK
        });

        expect(result.isFail()).toBe(true);
        expect(result.error).toBeInstanceOf(ReviewPersistenceError);
        expect(result.error.message).toBe("Storage is down.");
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not read the review to check the step is current.");
        expect(loggedErrors[0].fields).toEqual({
            error: expect.objectContaining({ message: "Storage is down." }),
            taskId: "task-1",
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID
        });
    });

    it("fails closed and logs once when the read throws, and never rejects", async () => {
        const { service, seed } = await setup();
        await seed(createFakeStepReview());
        reviewGetFaults.mode = "throw";

        const result = await service.isStale({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            task: CURRENT_TASK
        });

        expect(result.isFail()).toBe(true);
        expect(result.error).toBeInstanceOf(ReviewPersistenceError);
        expect(result.error.message).toBe("Storage threw.");
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not read the review to check the step is current.");
        expect(loggedErrors[0].fields).toEqual({
            error: expect.objectContaining({ message: "Storage threw." }),
            taskId: "task-1",
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID
        });
    });

    it("reads on every call and keeps no state: no throttle, no sticky answer (those belong to the caller)", async () => {
        const { service, seed, cancel } = await setup();
        await seed(createFakeStepReview());
        const params = { reviewId: "review-1", stepId: AUTOMATION_STEP_ID, task: CURRENT_TASK };

        const before = expectOk(await service.isStale(params));
        expect(reviewGetFaults.reads).toBe(1);
        await cancel(); // resets the read counter
        const after = expectOk(await service.isStale(params));
        const again = expectOk(await service.isStale(params));

        expect([before, after, again]).toEqual([false, true, true]);
        expect(reviewGetFaults.reads).toBe(2);
    });
});
```

Modify `packages/api-workflows/__tests__/registration.test.ts` (D18): add the import next to the `StuckStepService` import

```ts
import { StepRunStaleCheckService } from "~/features/stepRun/StepRunStaleCheckService/index.js";
```

and the assertion right after `expect(container.resolveAll(StuckStepService)).toHaveLength(1);` (Task 3 added the `StepRunnerRegistryService` assertions near it):

```ts
        expect(container.resolveAll(StepRunStaleCheckService)).toHaveLength(1);
```

**R179: self-cleanup.** In `packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts`, change the first test's title and its `selfCleanup` expectation:

```ts
    it("is one private definition with a high iteration ceiling that cleans itself up", async () => {
        const { context } = await createContextHandler();

        const definitions = context.container
            .resolveAll(TaskDefinition)
            .filter(item => item.id === STEP_RUN_TASK_DEFINITION_ID);

        expect(definitions).toHaveLength(1);
        expect(definitions[0]).toMatchObject({
            id: "workflowsStepRun",
            title: "Workflow step run",
            isPrivate: true,
            selfCleanup: "always",
            maxIterations: 10000
        });
        expect(definitions[0].description).toEqual(expect.any(String));
        expect(definitions[0].handler).toBe(WorkflowStepRunTaskHandler);
    });
```

In `packages/api-workflows/__tests__/__helpers/FakeTaskService.ts`, add the `"gone"` fault (a task that was cleaned up). Add `TaskNotFoundError` to the errors import:

```ts
import { TaskAbortError, TaskNotFoundError } from "@webiny/background-tasks/api/domain/errors.js";
```

change the type

```ts
export type FakeAbortFault = FakeTaskFault | "ended" | "gone";
```

its doc line in `FakeTaskFaults`

```ts
    /**
     * `"ended"` fails like the real service does for a task that is no longer pending or running;
     * `"gone"` fails like it does for a task that no longer exists (it cleaned itself up, R179).
     */
    abort: FakeAbortFault;
```

and in `abort`, right after the `"ended"` branch:

```ts
        if (fakeTaskFaults.abort === "gone") {
            return Result.fail(new TaskNotFoundError());
        }
```

In `packages/api-workflows/__tests__/stepRun/ReviewTaskAbortService.test.ts`, add this test after "logs info, not an error, when the task had already ended":

```ts
    it("logs info, not an error, when the task is gone because it cleaned itself up (R179)", async () => {
        const service = await createService();
        fakeTaskFaults.abort = "gone";

        await expect(
            service.abort({ taskIds: ["task-1"], message: "The review was cancelled." })
        ).resolves.toBeUndefined();

        expect(loggedErrors).toEqual([]);
        expect(loggedInfos).toEqual(["The step run task had already ended."]);
    });
```

**R179: cleanup runs after the hook (background-tasks).** In `packages/background-tasks/__tests__/decorators/SelfCleaningTaskHandlerDecorator.test.ts`, inside `describe("hook wrapping")`, right after "invokes the handler's onDone before cleanup":

```ts
        it("invokes the handler's onError before cleanup", async () => {
            const calls: string[] = [];
            const cleanupTaskSubtree: CleanupTaskSubtreeUseCase.Interface = {
                execute: async () => {
                    calls.push("cleanup");
                }
            };
            const handler = makeHandler({
                onError: async () => {
                    calls.push("userHook");
                }
            });

            const dec = decorate(handler, cleanupTaskSubtree);
            await dec.onError(hookParams("always"));

            expect(calls).toEqual(["userHook", "cleanup"]);
        });

        it("invokes the handler's onAbort before cleanup", async () => {
            const calls: string[] = [];
            const cleanupTaskSubtree: CleanupTaskSubtreeUseCase.Interface = {
                execute: async () => {
                    calls.push("cleanup");
                }
            };
            const handler = makeHandler({
                onAbort: async () => {
                    calls.push("userHook");
                }
            });

            const dec = decorate(handler, cleanupTaskSubtree);
            await dec.onAbort(hookParams("always"));

            expect(calls).toEqual(["userHook", "cleanup"]);
        });
```

In `packages/background-tasks/__tests__/runner/selfCleanup.integration.test.ts`, right after "user's onDone runs before cleanup fires":

```ts
    it("user's onError runs before cleanup fires", async () => {
        const order: string[] = [];
        const contextRef: {
            current?: Awaited<ReturnType<ReturnType<typeof createLiveContextFactory>>>;
        } = {};

        const plugin = createTaskDefinition({
            id: "cleanupErrorOrderTask",
            title: "cleanupErrorOrderTask",
            selfCleanup: "always",
            run: async ({ controller }) =>
                controller.response.error({ message: "boom", code: "TEST_ERR" }),
            onError: async ({ task }) => {
                // Task must still exist while the user's hook runs.
                const live = await contextRef.current!.tasks.getTask(task.id);
                order.push(live ? "user-saw-task" : "user-task-gone");
            }
        });
        const contextFactory = createLiveContextFactory({ plugins: [plugin] });
        const context = await contextFactory();
        contextRef.current = context;

        const task = await runTask(context, "cleanupErrorOrderTask");

        expect(order).toEqual(["user-saw-task"]);
        expect(await context.tasks.getTask(task.id)).toBeNull();
    });

    it("user's onAbort runs before cleanup fires", async () => {
        const order: string[] = [];
        const contextRef: {
            current?: Awaited<ReturnType<ReturnType<typeof createLiveContextFactory>>>;
        } = {};

        const plugin = createTaskDefinition({
            id: "cleanupAbortOrderTask",
            title: "cleanupAbortOrderTask",
            selfCleanup: "always",
            run: async ({ controller }) => controller.response.done("ok"),
            onAbort: async ({ task }) => {
                // Task must still exist while the user's hook runs.
                const live = await contextRef.current!.tasks.getTask(task.id);
                order.push(live ? "user-saw-task" : "user-task-gone");
            }
        });
        const contextFactory = createLiveContextFactory({ plugins: [plugin] });
        const context = await contextFactory();
        contextRef.current = context;

        const task = await context.tasks.createTask({
            definitionId: "cleanupAbortOrderTask",
            input: {},
            name: "to-abort"
        });
        await context.tasks.abort({ id: task.id, message: "testing hook order on abort" });

        expect(order).toEqual(["user-saw-task"]);
        expect(await context.tasks.getTask(task.id)).toBeNull();
    });

    it("selfCleanup='always' removes the log row an abort writes", async () => {
        // `databaseLogs` is forced to false by the decorator, but `TaskService.abort` still
        // creates one log row (the task has none); the cleanup must delete it with the task.
        const plugin = createTaskDefinition({
            id: "cleanupAbortLogTask",
            title: "cleanupAbortLogTask",
            selfCleanup: "always",
            run: async ({ controller }) => controller.response.done("ok")
        });
        const contextFactory = createLiveContextFactory({ plugins: [plugin] });
        const context = await contextFactory();

        const task = await context.tasks.createTask({
            definitionId: "cleanupAbortLogTask",
            input: {},
            name: "to-abort"
        });
        await context.tasks.abort({ id: task.id, message: "testing the abort log cleanup" });

        expect(await context.tasks.getTask(task.id)).toBeNull();
        const { items } = await context.tasks.listLogs({ where: { task: task.id } });
        expect(items).toHaveLength(0);
    });
```

In `packages/background-tasks/__tests__/crud/cleanupTaskSubtree.test.ts`, make three changes. First, `interface Fixture` gains `logPageSize?: number;`. Second, in `makeContext` replace the `listLogs` and `deleteLog` fakes so they page and shrink as rows are deleted (a real storage does the same):

```ts
        listLogs: (async (params: any) => {
            const all = logsByTask.get(params?.where?.task) ?? [];
            const size = fx.logPageSize ?? all.length;
            const items = all.slice(0, size);
            return {
                items,
                meta: {
                    totalCount: all.length,
                    hasMoreItems: all.length > size,
                    cursor: null
                }
            };
        }) as any,
```

```ts
        deleteLog: (async (id: string) => {
            deletedLogs.push(id);
            for (const [taskId, logs] of logsByTask) {
                logsByTask.set(
                    taskId,
                    logs.filter(log => log.id !== id)
                );
            }
            return true;
        }) as any,
```

Third, replace the two tests that pinned the old gate ("skips log sweep when databaseLogs=false" and "skips log sweep when definition is missing") with:

```ts
    it("deletes a task's logs even when databaseLogs=false", async () => {
        const { container, deletedTasks, deletedLogs } = makeContext({
            tasks: [mkTask("t1", "defA")],
            logs: [mkLog("abortLog", "t1")],
            definitions: { defA: { databaseLogs: false } }
        });
        await createCleanupTaskSubtree(container)("t1");
        expect(deletedTasks).toEqual(["t1"]);
        expect(deletedLogs).toEqual(["abortLog"]);
    });

    it("deletes every log of a task whose logs span several pages", async () => {
        const { container, deletedTasks, deletedLogs } = makeContext({
            tasks: [mkTask("t1", "defA")],
            logs: [
                mkLog("log1", "t1"),
                mkLog("log2", "t1"),
                mkLog("log3", "t1"),
                mkLog("log4", "t1"),
                mkLog("log5", "t1")
            ],
            definitions: { defA: { databaseLogs: false } },
            logPageSize: 2
        });
        await createCleanupTaskSubtree(container)("t1");
        expect(deletedTasks).toEqual(["t1"]);
        expect([...deletedLogs].sort()).toEqual(["log1", "log2", "log3", "log4", "log5"]);
    });

    it("deletes a task's logs even when its definition is missing", async () => {
        const { container, deletedTasks, deletedLogs } = makeContext({
            tasks: [mkTask("t1", "defMissing")],
            logs: [mkLog("log1", "t1")],
            definitions: {}
        });
        await createCleanupTaskSubtree(container)("t1");
        expect(deletedTasks).toEqual(["t1"]);
        expect(deletedLogs).toEqual(["log1"]);
    });
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskSignals.test.ts packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRunnerHooks.test.ts packages/api-workflows/__tests__/stepRun/StuckStepServiceRunners.test.ts packages/api-workflows/__tests__/stepRun/StepRunStaleCheckService.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL. `StepRunStaleCheckService.test.ts` does not load (`Cannot find module '~/features/stepRun/StepRunStaleCheckService/index.js'`) and `registration.test.ts` fails on the same import. In `WorkflowStepRunTaskSignals.test.ts` `STEP_RUN_TIMEOUT_MARGIN_MS` is not exported by `constants.ts` (the budget expectations fail) and the handler builds no timer and no floor. In the other two files the fake-runner reasons are not used: the hooks store the automation texts (`The automation failed.`, `The automation was aborted.`, `The automation did not finish in 50 iterations.`) for every step type, including the no-runner ones, instead of `The step failed.` / `The step was aborted.`; stuck detection returns a fake or no-runner step unchanged because it only checks `AUTOMATION_STEP_TYPE`.

Run the same with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskSignals.test.ts packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRunnerHooks.test.ts packages/api-workflows/__tests__/stepRun/StuckStepServiceRunners.test.ts packages/api-workflows/__tests__/stepRun/StepRunStaleCheckService.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, same reasons.

R179 and the abort of a cleaned-up task:
`yarn test packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts packages/api-workflows/__tests__/stepRun/ReviewTaskAbortService.test.ts 2>&1 | tail -50`
Expected: FAIL. "is one private definition..." expects `selfCleanup: "always"` and receives `"never"`; "logs info, not an error, when the task is gone..." finds one error log per id instead of an info log.
Run the same two files with `yarn test:os` (one run at a time): `yarn test:os packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts packages/api-workflows/__tests__/stepRun/ReviewTaskAbortService.test.ts 2>&1 | tail -50`
Expected: FAIL, same reasons.

The background-tasks ordering tests pin existing platform behaviour, the log cleanup is new:
`yarn test packages/background-tasks/__tests__/decorators/SelfCleaningTaskHandlerDecorator.test.ts packages/background-tasks/__tests__/runner/selfCleanup.integration.test.ts packages/background-tasks/__tests__/crud/cleanupTaskSubtree.test.ts 2>&1 | tail -50`
Expected: FAIL in exactly four tests: "selfCleanup='always' removes the log row an abort writes" (one log row is left), and the three `cleanupTaskSubtree` tests "deletes a task's logs even when databaseLogs=false" / "...even when its definition is missing" / "deletes every log of a task whose logs span several pages" (no log is deleted). The four ordering tests (`onError`, `onAbort`, unit and integration) PASS already (`@webiny/background-tasks` is not an `-es` / `-os` package: `yarn test` by path only, no `test:os` run). If an ordering test fails, stop: the cleanup would delete the task before the step run hook wrote the step, and the definition must not become `"always"` until that is fixed in the decorator.

- [ ] **Step 3: Constants, handler, stuck detection**

Modify `packages/api-workflows/src/features/stepRun/constants.ts`: append

```ts
/**
 * How much of the task's remaining runtime the handler keeps back, in milliseconds, when it
 * builds the runner's abort signal (R175): the signal fires at `remaining - margin`.
 */
export const STEP_RUN_TIMEOUT_MARGIN_MS = 30000;

/**
 * Below this many milliseconds left after the margin, the signal is aborted at once instead of
 * starting a timer (R175): the step fails as timed out, restartable.
 */
export const STEP_RUN_MIN_TIMEOUT_MS = 1000;

/**
 * The most often a caller re-reads the stored review through `StepRunStaleCheckService` during a
 * run, in milliseconds (R175). The service itself does not throttle: `AiStepRunner` (Task 19) does.
 */
export const STEP_RUN_STALE_CHECK_INTERVAL_MS = 5000;

/** Stored by a failure hook or stuck detection for a step type with no runner (R168). */
export const STEP_RUN_NEUTRAL_FAILED_REASON = "The step failed.";

/** Stored by `onAbort` for a step type with no runner (R168). */
export const STEP_RUN_NEUTRAL_ABORTED_REASON = "The step was aborted.";
```

Modify `packages/api-workflows/src/features/stepRun/WorkflowStepRunTask/WorkflowStepRunTaskHandler.ts`.

Imports: remove `import { automationStepConfigSchema } ...`, `import { AutomationDefinitionRegistryService } ...` and `DEFAULT_AUTOMATION_MAX_ITERATIONS` from the constants import; add the `StepRunner` type and the new constants (the handler does not use `STEP_RUN_STALE_CHECK_INTERVAL_MS` or the stale check service). The block becomes:

```ts
import "@webiny/background-tasks/api/features/TaskController/augmentation.js";
import {
    TaskHandler,
    type TaskDefinition
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { getRequesterIdentity } from "~/domain/automation/getRequesterIdentity.js";
import { Review, REJECT_COMMENT_MIN_LENGTH } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewNotFoundError, ReviewTargetSyncError } from "~/domain/review/errors.js";
import { getStaleStepRunReason } from "~/domain/review/getStaleStepRunReason.js";
import type { ReviewStep } from "~/domain/review/types.js";
import { ApproveReviewStepUseCase } from "~/features/review/ApproveReviewStep/index.js";
import { RejectReviewStepUseCase } from "~/features/review/RejectReviewStep/index.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import {
    STEP_RUN_MIN_TIMEOUT_MS,
    STEP_RUN_NEUTRAL_ABORTED_REASON,
    STEP_RUN_NEUTRAL_FAILED_REASON,
    STEP_RUN_TASKID_WAIT_SECONDS,
    STEP_RUN_TASKID_WAIT_TRIES,
    STEP_RUN_TIMEOUT_MARGIN_MS
} from "../constants.js";
import { StepRunFailure } from "../StepRunFailure.js";
import type { StepRunner } from "../StepRunner/index.js";
import { StepRunnerRegistryService } from "../StepRunnerRegistryService/index.js";
import type { StepRunTaskInput } from "../types.js";
```

The constructor loses `definitions`:

```ts
    public constructor(
        private repository: ReviewRepository.Interface,
        private saver: ReviewSaver.Interface,
        private logger: Logger.Interface,
        private runners: StepRunnerRegistryService.Interface,
        private approveStep: ApproveReviewStepUseCase.Interface,
        private rejectStep: RejectReviewStepUseCase.Interface,
        private identityContext: IdentityContext.Interface
    ) {}
```

In `run`, the part of the `try` block from `// 4. Run the step.` up to and including the `const outcome = await runner.run({ ... });` statement (Task 3's version with the placeholder signal) becomes the code below; everything before it (the runner lookup, `output`, `idWaits`, `iteration`, `state`) and everything after it (the post-run re-guard, applying the outcome, the `catch`) stays as Task 3 left it:

```ts
                // 4. A single-run runner never continues, so the handler fixes the wait count
                // before the model (or any one-shot work) runs: a task that is invoked again
                // reads the stored `idWaits` and gets a real `iteration` of 2, which is refused
                // without calling the runner (R170, R175). A runner that may continue (automation)
                // gets no such write: its output is written only on `continue`.
                if (runner.singleRun) {
                    if (iteration > 1) {
                        throw new StepRunFailure(runner.failureReasons.error);
                    }
                    await controller.state.updateOutput({ idWaits, state });
                }

                // The signal fires near the end of the task's remaining runtime; under the
                // floor it fires at once. The id-wait iterations returned before this point (R175).
                const timeout = new AbortController();
                const budget =
                    controller.runtime.getRemainingMilliseconds() - STEP_RUN_TIMEOUT_MARGIN_MS;
                let timer: ReturnType<typeof setTimeout> | undefined;
                if (budget < STEP_RUN_MIN_TIMEOUT_MS) {
                    timeout.abort();
                } else {
                    timer = setTimeout(() => timeout.abort(), budget);
                }

                // 5. Run the step. The runner validates its own config and owns its own
                // dependencies and texts; a failure is a thrown `StepRunFailure` (R146).
                let outcome: StepRunner.Outcome;
                try {
                    outcome = await runner.run({
                        review: data,
                        step,
                        requester,
                        task: { id: task.id, createdById: task.createdBy.id },
                        iteration,
                        state,
                        signal: timeout.signal
                    });
                } finally {
                    clearTimeout(timer);
                }
```

Renumber the later comments (`// 5. Apply the outcome` becomes `// 6.`, the failure path comment `// 6.` becomes `// 7.`). Nothing else in `run` changes: the approve and reject `actor` is already `runner.getActor(requester)` (Task 3).

Replace the three hooks. Each one keeps its phase 5 structure and logs; the reason is chosen after the stale guard passes, from the runner of the step's type, with the neutral text when there is none. `onError`:

```ts
    public async onError({ task }: HookParams): Promise<void> {
        const { reviewId, stepId }: Partial<StepRunTaskInput> = task.input ?? {};
        if (typeof reviewId !== "string" || typeof stepId !== "string") {
            this.logger.info({ taskId: task.id }, "Ignored a step run hook with a bad input.");
            return;
        }
        try {
            const loaded = await this.repository.get(reviewId);
            if (loaded.isFail()) {
                if (loaded.error instanceof ReviewNotFoundError) {
                    this.logger.info(
                        { taskId: task.id, reviewId },
                        "Ignored a step run hook: no review."
                    );
                    return;
                }
                this.logger.error(
                    { error: loaded.error, taskId: task.id, reviewId },
                    "Could not read the review in a step run hook."
                );
                return;
            }
            const stale = getStaleStepRunReason(loaded.value, stepId, {
                id: task.id,
                createdById: task.createdBy.id
            });
            if (stale) {
                this.logger.info(
                    { taskId: task.id, reviewId, stepId, stale },
                    "Ignored a stale step run hook."
                );
                return;
            }
            // The guard passed, so this task is the step's current task: log its error here (never
            // stored in the step).
            this.logger.error(
                { error: task.output?.error, taskId: task.id, reviewId, stepId },
                "The step run task ended with an error."
            );
            // Fixed text only: the task's own error can carry internals (R146). The runner of the
            // step's type names it; a type with no runner gets the neutral text (R168).
            const step = loaded.value.steps.find(item => item.id === stepId);
            const runner = step ? this.runners.get(step.type) : null;
            const reason = runner ? runner.failureReasons.error : STEP_RUN_NEUTRAL_FAILED_REASON;
            const review = Review.fromData(loaded.value);
            const failed = review.fail({ stepId, reason, now: new Date().toISOString() });
            if (failed.isFail()) {
                this.logger.error(
                    { error: failed.error, taskId: task.id, reviewId, stepId },
                    "Could not fail the step after a step run error."
                );
                return;
            }
            const saved = await this.saver.save(review);
            if (saved.isFail()) {
                this.logger.error(
                    { error: saved.error, taskId: task.id, reviewId, stepId },
                    "Could not save the failed step after a step run error."
                );
            }
        } catch (error) {
            this.logger.error(
                { error, taskId: task.id, reviewId, stepId },
                "A step run error hook threw."
            );
        }
    }
```

`onMaxIterations`:

```ts
    public async onMaxIterations({ task }: HookParams): Promise<void> {
        const { reviewId, stepId }: Partial<StepRunTaskInput> = task.input ?? {};
        if (typeof reviewId !== "string" || typeof stepId !== "string") {
            this.logger.info({ taskId: task.id }, "Ignored a step run hook with a bad input.");
            return;
        }
        try {
            const loaded = await this.repository.get(reviewId);
            if (loaded.isFail()) {
                if (loaded.error instanceof ReviewNotFoundError) {
                    this.logger.info(
                        { taskId: task.id, reviewId },
                        "Ignored a step run hook: no review."
                    );
                    return;
                }
                this.logger.error(
                    { error: loaded.error, taskId: task.id, reviewId },
                    "Could not read the review in a step run hook."
                );
                return;
            }
            const stale = getStaleStepRunReason(loaded.value, stepId, {
                id: task.id,
                createdById: task.createdBy.id
            });
            if (stale) {
                this.logger.info(
                    { taskId: task.id, reviewId, stepId, stale },
                    "Ignored a stale step run hook."
                );
                return;
            }
            // The reason names the step type's own limit from the review snapshot, never the
            // 10000 ceiling of the task definition (R145, P4); a type with no runner gets the
            // neutral text (R168). The guard passed, so the step exists.
            const step = loaded.value.steps.find(item => item.id === stepId) as ReviewStep;
            const runner = this.runners.get(step.type);
            const reason = runner
                ? runner.maxIterationsReason(step)
                : STEP_RUN_NEUTRAL_FAILED_REASON;
            const review = Review.fromData(loaded.value);
            const failed = review.fail({ stepId, reason, now: new Date().toISOString() });
            if (failed.isFail()) {
                this.logger.error(
                    { error: failed.error, taskId: task.id, reviewId, stepId },
                    "Could not fail the step at the iteration ceiling."
                );
                return;
            }
            const saved = await this.saver.save(review);
            if (saved.isFail()) {
                this.logger.error(
                    { error: saved.error, taskId: task.id, reviewId, stepId },
                    "Could not save the failed step at the iteration ceiling."
                );
            }
        } catch (error) {
            this.logger.error(
                { error, taskId: task.id, reviewId, stepId },
                "A step run max iterations hook threw."
            );
        }
    }
```

`onAbort`:

```ts
    public async onAbort({ task }: HookParams): Promise<void> {
        const { reviewId, stepId }: Partial<StepRunTaskInput> = task.input ?? {};
        if (typeof reviewId !== "string" || typeof stepId !== "string") {
            this.logger.info({ taskId: task.id }, "Ignored a step run hook with a bad input.");
            return;
        }
        try {
            const loaded = await this.repository.get(reviewId);
            if (loaded.isFail()) {
                if (loaded.error instanceof ReviewNotFoundError) {
                    this.logger.info(
                        { taskId: task.id, reviewId },
                        "Ignored a step run hook: no review."
                    );
                    return;
                }
                this.logger.error(
                    { error: loaded.error, taskId: task.id, reviewId },
                    "Could not read the review in a step run hook."
                );
                return;
            }
            const stale = getStaleStepRunReason(loaded.value, stepId, {
                id: task.id,
                createdById: task.createdBy.id
            });
            if (stale) {
                this.logger.info(
                    { taskId: task.id, reviewId, stepId, stale },
                    "Ignored a stale step run hook."
                );
                return;
            }
            // The runner of the step's type names the reason; a type with no runner gets the
            // neutral text (R168).
            const step = loaded.value.steps.find(item => item.id === stepId);
            const runner = step ? this.runners.get(step.type) : null;
            const reason = runner ? runner.failureReasons.aborted : STEP_RUN_NEUTRAL_ABORTED_REASON;
            const review = Review.fromData(loaded.value);
            const failed = review.fail({ stepId, reason, now: new Date().toISOString() });
            if (failed.isFail()) {
                this.logger.error(
                    { error: failed.error, taskId: task.id, reviewId, stepId },
                    "Could not fail the step after a step run abort."
                );
                return;
            }
            const saved = await this.saver.save(review);
            if (saved.isFail()) {
                this.logger.error(
                    { error: saved.error, taskId: task.id, reviewId, stepId },
                    "Could not save the failed step after a step run abort."
                );
            }
        } catch (error) {
            this.logger.error(
                { error, taskId: task.id, reviewId, stepId },
                "A step run abort hook threw."
            );
        }
    }
```

The class comment stays as Task 3 left it. The dependency list becomes:

```ts
export const WorkflowStepRunTaskHandler = TaskHandler.createImplementation({
    implementation: WorkflowStepRunTaskHandlerImpl,
    dependencies: [
        ReviewRepository,
        ReviewSaver,
        Logger,
        StepRunnerRegistryService,
        ApproveReviewStepUseCase,
        RejectReviewStepUseCase,
        IdentityContext
    ]
});
```

Create `packages/api-workflows/src/features/stepRun/StepRunStaleCheckService/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { ReviewPersistenceError } from "~/domain/review/errors.js";
import type { StepRunTaskIdentity } from "~/domain/review/getStaleStepRunReason.js";

export interface StepRunStaleCheckParams {
    reviewId: string;
    stepId: string;
    /** The task's own identity, never values read from the task input (R148). */
    task: StepRunTaskIdentity;
}

export interface IStepRunStaleCheckService {
    /**
     * `ok(true)` when this task must no longer write to the review (R144, R175): the review is
     * gone, cancelled or finished, or the step was restarted under another task. One repository
     * read per call; no throttle and no state, the caller owns both. Fail-closed: a failed or
     * throwing read is logged here (callers do not log it again) and answered with a failed
     * Result, never with `ok(false)`, so a caller about to write can refuse. Never throws.
     */
    isStale(params: StepRunStaleCheckParams): Promise<Result<boolean, ReviewPersistenceError>>;
}

/**
 * Re-reads the stored review and applies the stale guard, for a runner whose call outlives the
 * moment it started (the AI runner): `controller.runtime.isAborted()` only sees the task loaded at
 * run start (R175). Internal (D132): no permission checks.
 */
export const StepRunStaleCheckService =
    createAbstraction<IStepRunStaleCheckService>("StepRunStaleCheckService");

export namespace StepRunStaleCheckService {
    export type Interface = IStepRunStaleCheckService;
    export type Params = StepRunStaleCheckParams;
}
```

Create `packages/api-workflows/src/features/stepRun/StepRunStaleCheckService/StepRunStaleCheckService.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewNotFoundError, ReviewPersistenceError } from "~/domain/review/errors.js";
import { getStaleStepRunReason } from "~/domain/review/getStaleStepRunReason.js";
import { StepRunStaleCheckService as Abstraction } from "./abstractions.js";

class StepRunStaleCheckServiceImpl implements Abstraction.Interface {
    public constructor(
        private repository: ReviewRepository.Interface,
        private logger: Logger.Interface
    ) {}

    public async isStale({
        reviewId,
        stepId,
        task
    }: Abstraction.Params): Promise<Result<boolean, ReviewPersistenceError>> {
        try {
            const current = await this.repository.get(reviewId);
            if (current.isFail()) {
                if (current.error instanceof ReviewNotFoundError) {
                    return Result.ok(true);
                }
                // Fail-closed: a failed read must not read as "not stale" for a caller that writes.
                this.logger.error(
                    { error: current.error, taskId: task.id, reviewId, stepId },
                    "Could not read the review to check the step is current."
                );
                return Result.fail(
                    current.error instanceof ReviewPersistenceError
                        ? current.error
                        : new ReviewPersistenceError(current.error)
                );
            }
            return Result.ok(getStaleStepRunReason(current.value, stepId, task) !== null);
        } catch (error) {
            this.logger.error(
                { error, taskId: task.id, reviewId, stepId },
                "Could not read the review to check the step is current."
            );
            return Result.fail(new ReviewPersistenceError(error as Error));
        }
    }
}

export const StepRunStaleCheckService = Abstraction.createImplementation({
    implementation: StepRunStaleCheckServiceImpl,
    dependencies: [ReviewRepository, Logger]
});
```

Create `packages/api-workflows/src/features/stepRun/StepRunStaleCheckService/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { StepRunStaleCheckService } from "./StepRunStaleCheckService.js";

export const StepRunStaleCheckFeature = createFeature({
    name: "Workflows/StepRunStaleCheck",
    register(container) {
        container.register(StepRunStaleCheckService);
    }
});
```

Create `packages/api-workflows/src/features/stepRun/StepRunStaleCheckService/index.ts`:

```ts
export { StepRunStaleCheckService } from "./abstractions.js";
```

Modify `packages/api-workflows/src/WorkflowsFeature.ts`: add the import next to the `StepRunnerRegistryFeature` import (Task 3)

```ts
import { StepRunStaleCheckFeature } from "~/features/stepRun/StepRunStaleCheckService/feature.js";
```

and register it with the step runners, so the block reads:

```ts
        // The step runners the task dispatches to, and the built-in automation runner (R168)
        StepRunnerRegistryFeature.register(container);
        AutomationStepRunnerFeature.register(container);
        // The stored-review stale check for runners whose call outlives the run start (R175)
        StepRunStaleCheckFeature.register(container);
        // The private task that runs a workflow step (R142)
        WorkflowStepRunTaskFeature.register(container);
```

Modify `packages/api-workflows/src/features/stepRun/StuckStepService/StuckStepService.ts`: in the imports remove `import { AUTOMATION_STEP_TYPE } from "~/domain/workflow/stepTypes.js";` and change the imports below it:

```ts
import {
    STEP_RUN_NEUTRAL_FAILED_REASON,
    STEP_RUN_STUCK_GRACE_MS
} from "~/features/stepRun/constants.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import { StepRunnerRegistryService } from "~/features/stepRun/StepRunnerRegistryService/index.js";
import { StuckStepService as Abstraction } from "./abstractions.js";
```

The constructor and the start of `check` become:

```ts
class StuckStepServiceImpl implements Abstraction.Interface {
    constructor(
        private getTask: GetTaskUseCase.Interface,
        private saver: ReviewSaver.Interface,
        private logger: Logger.Interface,
        private runners: StepRunnerRegistryService.Interface
    ) {}

    async check(review: ReviewData): Promise<ReviewData> {
        const step = review.steps.find(item => item.id === review.currentStepId);
        if (!step || step.state !== "inReview") {
            return review;
        }
        const taskId = step.taskId;
        if (!taskId) {
            return review;
        }
```

The failure reason comes from the runner of the step's type, the neutral text when there is none. Replace the `const stuck = Review.fromData(review); const failed = stuck.fail({ ... })` statement with:

```ts
        // The runner of the step's type names the reason; a step whose type has no runner (the
        // flag or licence was turned off) is still failed, with the neutral text (R168).
        const runner = this.runners.get(step.type);
        const stuck = Review.fromData(review);
        const failed = stuck.fail({
            stepId: step.id,
            reason: runner ? runner.failureReasons.stuck : STEP_RUN_NEUTRAL_FAILED_REASON,
            now: new Date().toISOString()
        });
```

and the registration at the end of the file becomes:

```ts
export const StuckStepService = Abstraction.createImplementation({
    implementation: StuckStepServiceImpl,
    dependencies: [GetTaskUseCase, ReviewSaver, Logger, StepRunnerRegistryService]
});
```

Modify `packages/api-workflows/src/features/stepRun/StuckStepService/abstractions.ts` (doc comments only; the `StuckStepService` constant and its namespace below stay):

```ts
export interface IStuckStepService {
    /**
     * Returns `review` unchanged, or the saved review whose current step was failed because its
     * task ended without writing a result. Never throws.
     */
    check(review: ReviewData): Promise<ReviewData>;
}

/**
 * Stuck detection for single reads (D28, D57, R152, R168): an `inReview` step of any type that
 * carries a task id, whose task is `success`, `failed` / `aborted` for longer than the grace, or
 * gone (null task) for longer than the grace, and that passes the stale guard (R144), is failed
 * with the stuck reason of the runner of its type (`The automation task ended without a result.`
 * for automation), or `The step failed.` when no runner is registered for the type. Called by
 * `GetReviewUseCase` and `GetTargetReviewUseCase` only, never by lists. Internal (D132): no
 * permission checks.
 */
```

Modify `packages/background-tasks/src/api/crud/cleanupTaskSubtree.ts` (R179): `deleteTaskLogs` no longer looks the definition up or checks `databaseLogs`; it lists and deletes the task's logs by task id. Replace the doc comment of `createCleanupTaskSubtree` and the whole `deleteTaskLogs`:

```ts
/**
 * Recursively deletes the task identified by `rootId`, all its descendants, and
 * their logs. The logs are listed by task id whatever the owning definition says
 * (`databaseLogs`, or no registered definition): a self-cleaning task writes none
 * of its own, but an abort still writes one log row, and cleanup removes whatever
 * exists. Bottom-up, best-effort: per-record errors are logged and swallowed, the
 * function never throws.
 */
```

```ts
    const deleteTaskLogs = async (task: ITask): Promise<void> => {
        try {
            // Page through every log: list the first page (no cursor), delete its rows, and list
            // again while the listed page was non-empty and more remain (deleted rows shift the
            // pages, so the cursor is never used). An empty page ends the loop; so does a page
            // in which no delete succeeded (it would come back unchanged and spin forever).
            let hasMore = true;
            while (hasMore) {
                const { items, meta } = await container.resolve(TasksCrud).listLogs({
                    where: { task: task.id }
                });
                let deleted = 0;
                for (const log of items) {
                    try {
                        await container.resolve(TasksCrud).deleteLog(log.id);
                        deleted++;
                    } catch (ex: any) {
                        console.warn(
                            `cleanupTaskSubtree: failed to delete log "${log.id}" for task "${task.id}": ${ex.message}`
                        );
                    }
                }
                hasMore = items.length > 0 && deleted > 0 && meta.hasMoreItems;
            }
        } catch (ex: any) {
            console.warn(
                `cleanupTaskSubtree: failed to list logs for task "${task.id}": ${ex.message}`
            );
        }
    };
```

The rest of the file (`listChildren`, `collectSubtree`, the returned function) is unchanged. The existing integration test "cascade sweeps child logs when the child definition has databaseLogs=true" and the "selfCleanup='always' deletes the task and writes no logs" test stay green unchanged.

Modify `packages/api-workflows/src/features/stepRun/WorkflowStepRunTask/WorkflowStepRunTaskDefinition.ts` (R179): replace the doc comment and the `selfCleanup` member. Full new file:

```ts
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { STEP_RUN_MAX_ITERATIONS, STEP_RUN_TASK_DEFINITION_ID } from "../constants.js";
import { WorkflowStepRunTaskHandler } from "./WorkflowStepRunTaskHandler.js";

/**
 * The one private task that runs a workflow step (R142). Private, so the task list never shows
 * it and the GraphQL `triggerTask` refuses it as unknown (SEC-68, Task 7); only the engine
 * triggers it, through `TaskService.trigger` in the step run reach. The ceiling is high on
 * purpose: the handler enforces the automation definition's own `maxIterations` (R145).
 *
 * The task cleans itself up (R179). Every outcome is already on the step: success through the
 * runner, failure and abort through the fixed-text `onError` / `onAbort` hooks (raw errors live
 * only in the logs). Background tasks run the definition's own hook first and delete the task
 * after it, so the step is written before the task is gone, and turn the task's database logs
 * off (an abort still writes one log row, which the cleanup now deletes). A step whose task is gone is handled by `StuckStepService` (grace from the step start).
 */
class WorkflowStepRunTaskDefinitionImpl implements TaskDefinition.Interface {
    public readonly id = STEP_RUN_TASK_DEFINITION_ID;
    public readonly title = "Workflow step run";
    public readonly description = "Runs an automation step of a workflow review.";
    public readonly isPrivate = true;
    public readonly maxIterations = STEP_RUN_MAX_ITERATIONS;
    public readonly selfCleanup = "always" as const;

    public readonly handler: TaskDefinition.Interface["handler"] = WorkflowStepRunTaskHandler;
}

export const WorkflowStepRunTaskDefinition = TaskDefinition.createImplementation({
    implementation: WorkflowStepRunTaskDefinitionImpl,
    dependencies: []
});
```

Modify `packages/api-workflows/src/features/stepRun/ReviewTaskAbortService/ReviewTaskAbortService.ts`: import `TaskNotFoundError` next to `TaskAbortError` and treat both as "nothing left to abort". Full new file:

```ts
import {
    TaskAbortError,
    TaskNotFoundError
} from "@webiny/background-tasks/api/domain/errors.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { ReviewTaskAbortService as Abstraction } from "./abstractions.js";

class ReviewTaskAbortServiceImpl implements Abstraction.Interface {
    public constructor(
        private taskService: TaskService.Interface,
        private logger: Logger.Interface
    ) {}

    public async abort(params: Abstraction.Params): Promise<void> {
        for (const taskId of params.taskIds) {
            try {
                const result = await this.taskService.abort({
                    id: taskId,
                    message: params.message
                });
                if (
                    result.isFail() &&
                    (result.error instanceof TaskAbortError ||
                        result.error instanceof TaskNotFoundError)
                ) {
                    // The task is no longer pending or running, or it already cleaned itself up
                    // (R179): nothing left to abort.
                    this.logger.info({ taskId }, "The step run task had already ended.");
                } else if (result.isFail()) {
                    this.logger.error(
                        { error: result.error, taskId },
                        "Could not abort a workflow step run task."
                    );
                }
            } catch (error) {
                this.logger.error({ error, taskId }, "Could not abort a workflow step run task.");
            }
        }
    }
}

export const ReviewTaskAbortService = Abstraction.createImplementation({
    implementation: ReviewTaskAbortServiceImpl,
    dependencies: [TaskService, Logger]
});
```

- [ ] **Step 4: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskSignals.test.ts packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRunnerHooks.test.ts packages/api-workflows/__tests__/stepRun/StuckStepServiceRunners.test.ts packages/api-workflows/__tests__/stepRun/StepRunStaleCheckService.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskSignals.test.ts packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRunnerHooks.test.ts packages/api-workflows/__tests__/stepRun/StuckStepServiceRunners.test.ts packages/api-workflows/__tests__/stepRun/StepRunStaleCheckService.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn test packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts packages/api-workflows/__tests__/stepRun/ReviewTaskAbortService.test.ts 2>&1 | tail -50`
Expected: PASS. Run the same two files with `yarn test:os` (one run at a time): `yarn test:os packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts packages/api-workflows/__tests__/stepRun/ReviewTaskAbortService.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn test packages/background-tasks/__tests__/decorators/SelfCleaningTaskHandlerDecorator.test.ts packages/background-tasks/__tests__/runner/selfCleanup.integration.test.ts packages/background-tasks/__tests__/crud/cleanupTaskSubtree.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40`
Expected: no errors.

Run: `yarn check:test:types 2>&1 | grep -iE "background-tasks" | head`
Expected: no output.

- [ ] **Step 5: Run the existing tests covering the changed code (unchanged, no expectation may change)**

Every phase 5 handler, hook, stuck and reach test, plus the Task 3 files, stays green; the background-tasks suites that touch cleanup (`packages/background-tasks/__tests__/decorators/TaskDefinitionDefaultsDecorator.test.ts`, `packages/background-tasks/__tests__/crud/trigger.test.ts`) stay green unchanged. Only two phase 5 test files changed in this task, each by the R179 edit above (`WorkflowStepRunTask.test.ts`: the `selfCleanup` expectation; `ReviewTaskAbortService.test.ts`: one added test, no expectation changed):

Run: `yarn test packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRun.test.ts packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts packages/api-workflows/__tests__/stepRun/StuckStepService.test.ts packages/api-workflows/__tests__/stepRun/ReviewTaskAbortService.test.ts packages/api-workflows/__tests__/stepRun/StepRunnerRegistryService.test.ts packages/api-workflows/__tests__/stepRun/AutomationStepRunner.test.ts packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskDispatch.test.ts packages/api-workflows/__tests__/stepTypes/AutomationReach.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS, with `git diff --stat -- packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRun.test.ts packages/api-workflows/__tests__/stepRun/StuckStepService.test.ts` printing nothing, and `git diff -- packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts` showing only the test title and `selfCleanup: "always"`.

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRun.test.ts packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts packages/api-workflows/__tests__/stepRun/StuckStepService.test.ts packages/api-workflows/__tests__/stepRun/ReviewTaskAbortService.test.ts packages/api-workflows/__tests__/stepRun/StepRunnerRegistryService.test.ts packages/api-workflows/__tests__/stepRun/AutomationStepRunner.test.ts packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskDispatch.test.ts packages/api-workflows/__tests__/stepTypes/AutomationReach.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 6: Commit**

Run the Global Constraints chain (build `@webiny/background-tasks` and `@webiny/api-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
git commit -m "feat(api-workflows): neutral step run hooks, stuck detection per runner, timeout signal, a stale check service and self-cleaning step run tasks" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn"
```
