import { beforeEach, describe, expect, it } from "vitest";
import zod from "zod";
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
import { registerTestAutomation } from "~tests/__helpers/TestAutomationDefinition.js";
import { FailingReviewSave, reviewSaveFaults } from "~tests/__helpers/FailingReviewSave.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { NOW, requester, toSaveData } from "~tests/__helpers/fixtures.js";
import {
    AUTOMATION_STEP_ID,
    automationActor,
    createRunningAutomationReview
} from "~tests/__helpers/stepRunReviews.js";
import type { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { WorkflowStepRunTaskHandler } from "~/features/stepRun/WorkflowStepRunTask/index.js";
import {
    STEP_RUN_MAX_ITERATIONS,
    STEP_RUN_TASK_DEFINITION_ID
} from "~/features/stepRun/constants.js";
import type { StepRunTaskInput } from "~/features/stepRun/types.js";

type StepRunTask = TaskService.Task<StepRunTaskInput>;

interface TaskOverrides {
    id?: string;
    createdById?: string;
    input?: unknown;
    errorMessage?: string;
}

const createTask = (overrides: TaskOverrides = {}): StepRunTask => {
    return {
        id: overrides.id ?? "task-1",
        name: "Workflow step: Check links",
        definitionId: STEP_RUN_TASK_DEFINITION_ID,
        executionName: "",
        input: (overrides.input ?? {
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID
        }) as StepRunTaskInput,
        output: overrides.errorMessage ? { error: { message: overrides.errorMessage } } : undefined,
        iterations: 3,
        taskStatus: TaskDataStatus.RUNNING,
        eventResponse: undefined,
        createdOn: NOW,
        savedOn: NOW,
        createdBy: {
            id: overrides.createdById ?? requester.id,
            displayName: requester.displayName,
            type: "admin"
        }
    };
};

const DEFINITION: TaskDefinition.Metadata = {
    id: STEP_RUN_TASK_DEFINITION_ID,
    title: "Workflow step run",
    isPrivate: true,
    maxIterations: STEP_RUN_MAX_ITERATIONS
};

type HookName = "onError" | "onMaxIterations" | "onAbort";

const createContext = async (overrides: Parameters<typeof registerTestAutomation>[1] = {}) => {
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerDecorator(FailingReviewSave);
            registerTestAutomation(container, overrides);
        }
    });
    const handler = context.container.resolveImplementation(
        WorkflowStepRunTaskHandler
    ) as TaskHandler.Interface<StepRunTaskInput>;
    const repository = context.container.resolve(ReviewRepository);
    return {
        context,
        handler,
        read: async () => {
            const loaded = await repository.get("review-1");
            if (loaded.isFail()) {
                throw loaded.error;
            }
            return loaded.value;
        },
        seed: async (review: Review) => {
            const stored = await repository.create(toSaveData(review));
            if (stored.isFail()) {
                throw stored.error;
            }
        },
        call: async (hook: HookName, task: StepRunTask) => {
            const run = handler[hook]!.bind(handler);
            await run({ task, definition: DEFINITION });
        }
    };
};

const HOOKS: { hook: HookName; reason: string; errorMessage?: string; logged: number }[] = [
    { hook: "onError", reason: "The automation failed.", errorMessage: "Boom", logged: 1 },
    {
        hook: "onMaxIterations",
        reason: "The automation did not finish in 50 iterations.",
        logged: 0
    },
    { hook: "onAbort", reason: "The automation was aborted.", logged: 0 }
];

describe("workflowsStepRun task definition (R142)", () => {
    it("is one private definition with a high iteration ceiling that keeps its task (R256)", async () => {
        const { context } = await createContextHandler();

        const definitions = context.container
            .resolveAll(TaskDefinition)
            .filter(item => item.id === STEP_RUN_TASK_DEFINITION_ID);

        expect(definitions).toHaveLength(1);
        expect(definitions[0]).toMatchObject({
            id: "workflowsStepRun",
            title: "Workflow step run",
            isPrivate: true,
            maxIterations: 10000
        });
        // No self cleanup and no database logs: the task stays until its review is deleted.
        expect(definitions[0].selfCleanup).toBeUndefined();
        expect(definitions[0].databaseLogs).toBeUndefined();
        expect(definitions[0].description).toEqual(expect.any(String));
        expect(definitions[0].handler).toBe(WorkflowStepRunTaskHandler);
    });

    it("validates the input to exactly the review id and the step id", async () => {
        const { handler } = await createContext();
        const schema = handler.createInputValidation!({ validator: zod }) as Record<
            string,
            zod.ZodType
        >;
        const validator = zod.object(schema).strict();

        expect(Object.keys(schema).sort()).toEqual(["reviewId", "stepId"]);
        expect(validator.safeParse({ reviewId: "review-1", stepId: "step-1" }).success).toBe(true);
        expect(validator.safeParse({ reviewId: "review-1" }).success).toBe(false);
        expect(validator.safeParse({ reviewId: 1, stepId: "step-1" }).success).toBe(false);
        expect(
            validator.safeParse({ reviewId: "review-1", stepId: "step-1", extra: true }).success
        ).toBe(false);
    });
});

describe.each(HOOKS)(
    "workflowsStepRun $hook (R144, R146, R148)",
    ({ hook, reason, errorMessage, logged }) => {
        beforeEach(() => {
            resetFakeTasks();
            loggedErrors.length = 0;
            reviewSaveFaults.failNext = false;
        });

        it("fails the step with the fixed reason when the task is the step's current task", async () => {
            const { call, read, seed } = await createContext();
            await seed(createRunningAutomationReview("task-1"));

            await call(hook, createTask({ errorMessage }));

            const stored = await read();
            expect(stored.currentStepState).toBe("failed");
            expect(stored.steps[0]).toMatchObject({
                state: "failed",
                comment: reason,
                owner: automationActor,
                taskId: "task-1"
            });
            // Only `onError` logs: the task's own error is logged, never stored (R146).
            expect(loggedErrors).toHaveLength(logged);
        });

        it("writes nothing for the task id of an earlier attempt (restarted step)", async () => {
            const { call, read, seed } = await createContext();
            await seed(createRunningAutomationReview("task-2"));

            await call(hook, createTask({ id: "task-1", errorMessage }));

            expect((await read()).steps[0]).toMatchObject({ state: "inReview", taskId: "task-2" });
        });

        it("writes nothing for a task not created by the requester", async () => {
            const { call, read, seed } = await createContext();
            await seed(createRunningAutomationReview("task-1"));

            await call(hook, createTask({ createdById: "user-someone-else", errorMessage }));

            expect((await read()).steps[0]).toMatchObject({ state: "inReview", comment: null });
        });

        it("writes nothing for an inactive review", async () => {
            const { call, read, seed } = await createContext();
            const review = createRunningAutomationReview("task-1");
            review.cancel({ actor: requester, now: NOW });
            await seed(review);

            await call(hook, createTask({ errorMessage }));

            const stored = await read();
            expect(stored.isActive).toBe(false);
            expect(stored.steps[0].state).not.toBe("failed");
        });

        it("writes nothing when another step is the current step", async () => {
            const { call, read, seed } = await createContext();
            const review = createRunningAutomationReview("task-1");
            review.approve({
                stepId: AUTOMATION_STEP_ID,
                actor: automationActor,
                actorTeamIds: [],
                comment: null,
                now: NOW
            });
            await seed(review);

            await call(hook, createTask({ errorMessage }));

            const stored = await read();
            expect(stored.currentStepId).toBe("editorial");
            expect(stored.steps[0]).toMatchObject({ state: "approved", comment: null });
        });

        it("writes nothing for a step that is already failed (idempotent)", async () => {
            const { call, read, seed } = await createContext();
            const review = createRunningAutomationReview("task-1");
            review.fail({ stepId: AUTOMATION_STEP_ID, reason: "The first reason.", now: NOW });
            await seed(review);

            await call(hook, createTask({ errorMessage }));

            expect((await read()).steps[0]).toMatchObject({
                state: "failed",
                comment: "The first reason."
            });
        });

        it("writes nothing and does not throw when the review does not exist", async () => {
            const { call } = await createContext();

            await expect(
                call(hook, createTask({ input: { reviewId: "review-unknown", stepId: "step-1" } }))
            ).resolves.toBeUndefined();

            expect(loggedErrors).toEqual([]);
        });

        it("does not trust an input that is not a review id and a step id", async () => {
            const { call, read, seed } = await createContext();
            await seed(createRunningAutomationReview("task-1"));

            await expect(
                call(hook, createTask({ input: { reviewId: 1, stepId: null } }))
            ).resolves.toBeUndefined();
            await expect(call(hook, createTask({ input: {} }))).resolves.toBeUndefined();

            expect((await read()).steps[0].state).toBe("inReview");
        });

        it("logs a failed save and never throws", async () => {
            const { call, read, seed } = await createContext();
            await seed(createRunningAutomationReview("task-1"));
            reviewSaveFaults.failNext = true;

            await expect(call(hook, createTask({ errorMessage }))).resolves.toBeUndefined();

            // The failed save, plus the task error that `onError` logs first.
            expect(loggedErrors).toHaveLength(logged + 1);
            expect((await read()).steps[0].state).toBe("inReview");
        });
    }
);

describe("workflowsStepRun onMaxIterations reason uses the automation's own limit (R145, P4)", () => {
    beforeEach(() => {
        resetFakeTasks();
    });

    it("names the default of 50 when the automation sets no limit, never the 10000 ceiling", async () => {
        const { call, read, seed } = await createContext();
        await seed(createRunningAutomationReview("task-1"));

        await call("onMaxIterations", createTask());

        expect((await read()).steps[0].comment).toBe(
            "The automation did not finish in 50 iterations."
        );
    });

    it("names the automation's own maxIterations", async () => {
        const { call, read, seed } = await createContext({ maxIterations: 7 });
        await seed(createRunningAutomationReview("task-1"));

        await call("onMaxIterations", createTask());

        expect((await read()).steps[0].comment).toBe(
            "The automation did not finish in 7 iterations."
        );
    });

    it("falls back to the default when the step config names no definition", async () => {
        const { call, read, seed } = await createContext({ id: "another-automation" });
        await seed(createRunningAutomationReview("task-1"));

        await call("onMaxIterations", createTask());

        expect((await read()).steps[0].comment).toBe(
            "The automation did not finish in 50 iterations."
        );
    });
});

describe("workflowsStepRun onError never stores the task's error message (R146)", () => {
    beforeEach(() => {
        resetFakeTasks();
        loggedErrors.length = 0;
    });

    it("stores the fixed reason and logs the task error", async () => {
        const { call, read, seed } = await createContext();
        await seed(createRunningAutomationReview("task-1"));

        await call("onError", createTask({ errorMessage: "x".repeat(900) }));

        const stored = await read();
        expect(stored.steps[0].comment).toBe("The automation failed.");
        expect(JSON.stringify(stored)).not.toContain("xxxxx");
        expect(loggedErrors.map(logged => logged.message)).toEqual([
            "The step run task ended with an error."
        ]);
        expect(loggedErrors[0].fields.err).toEqual({ message: "x".repeat(900) });
    });

    it("stores the same fixed reason for an error without a message", async () => {
        const { call, read, seed } = await createContext();
        await seed(createRunningAutomationReview("task-1"));

        await call("onError", createTask());

        expect((await read()).steps[0].comment).toBe("The automation failed.");
    });

    it("logs nothing when the task is stale", async () => {
        const { call, seed } = await createContext();
        await seed(createRunningAutomationReview("task-1"));

        await call("onError", createTask({ id: "task-other", errorMessage: "Boom" }));

        expect(loggedErrors).toEqual([]);
    });
});
