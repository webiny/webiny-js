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
            expectOk(await repository.create(data));
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

        const budget = 900000 - STEP_RUN_TIMEOUT_MARGIN_MS;
        const index = setTimeoutSpy.mock.calls.findIndex(([, delay]) => delay === budget);
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
            error: { message: "The step run failed.", code: "Workflows/StepRun/Failed" }
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
        expect(stored.steps[0]).toMatchObject({
            state: "failed",
            comment: "The fake step failed."
        });
        expect(workflowEventTypes()).toEqual(["Workflows/Review/StepFailed"]);
        // The first invocation's crash is logged, raw; the task stored only the fixed error.
        expect(loggedErrors.map(logged => logged.message)).toEqual([
            "The step run failed with an unexpected error."
        ]);
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
            error: { message: "The step run failed.", code: "Workflows/StepRun/Failed" }
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
