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
            expectOk(await repository.create(data));
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
