### Task 11: `workflowsStepRun` definition, stale guard, failure hooks

Spec 7.4; D7, D27, D57; R142, R144, R145, R146, R148, R156, R157, R159; A53; Review Focus 1. The private background task that runs an automation step is defined here with its stale guard and its three failure hooks. The run handler (Task 12) fills `run`; until then `run` returns done.

- **Definition** (`features/stepRun/WorkflowStepRunTask/WorkflowStepRunTaskDefinition.ts`, R142): id `STEP_RUN_TASK_DEFINITION_ID` (`workflowsStepRun`), title `Workflow step run`, `isPrivate = true`, `selfCleanup = "never"`, `maxIterations = STEP_RUN_MAX_ITERATIONS` (10000), a description, and `handler` pointing at the handler implementation, exactly like `DeleteModelTask` (the definition has no dependencies; the runner builds the handler on demand with `resolveImplementation`). Registered by `WorkflowsFeature`. The handler validates its input with `createInputValidation` to exactly `StepRunTaskInput { reviewId: string; stepId: string }`.
- **Stale guard** (`domain/review/getStaleStepRunReason.ts`, R144): pure `getStaleStepRunReason(review: ReviewData, stepId: string, task: StepRunTaskIdentity): string | null` with `StepRunTaskIdentity { id: string; createdById: string }`. It returns a reason, checked in this order, unless: the review `isActive`; `state === "inProgress"`; `currentStepId === stepId`; that step is `inReview`; its `taskId === task.id`; and `task.createdById === review.createdBy.id` (the task was triggered as the requester, R148, so a forged or foreign task never matches). Reasons: `The review is not active.`, `The review is not in progress.`, `The step is not the current step.`, `The step is not in review.`, `The step does not belong to this task.`, `The task was not created by the requester.`.
- **Failure hooks** (R144, R146): `onError`, `onMaxIterations` and `onAbort` on the handler class. Each reads nothing from the task but its id, creator and input, loads the review by `input.reviewId` (an input that is not two strings, a review that is not found or a failed read is stale: nothing written), applies the guard with the task's own id and `createdBy.id`, and on a stale result logs at info and returns without writing. On a current task it calls `review.fail({ stepId, reason, now })` and saves through `ReviewSaver`. A review that is not found is stale (info); any other failed read, a failed or throwing `fail` or save is logged with `Logger.error` and never rethrown (a hook must not break the runner, and no error is swallowed silently, R159). Reasons (fixed texts only, R146):
  - `onError`: `The automation failed.` (the task output's `error`, which can carry internals, is logged with `Logger.error` once the guard passed and never stored);
  - `onMaxIterations` (the 10000 ceiling): `The automation did not finish in <n> iterations.` with `n` = the automation definition's own `maxIterations` (default `DEFAULT_AUTOMATION_MAX_ITERATIONS`, 50), looked up from the review snapshot (step config -> `AutomationDefinitionRegistryService`; a config that does not parse or a missing definition gives the default), never `STEP_RUN_MAX_ITERATIONS` (R145, P4);
  - `onAbort`: `The automation was aborted.`
  Cancel and delete deactivate the review before the abort hook runs (Task 13), so their own abort writes nothing; a restarted step's old task has another `taskId`, so a late hook of it writes nothing; a step failed by the first hook is no longer `inReview`, so a second hook for the same task (the runner calls `onError` after `onMaxIterations`) writes nothing.
- **Dependency** (R156): `api-workflows` gains `@webiny/background-tasks` (`"0.0.0"` like the other workspace deps), because the handler file imports the `TaskController` augmentation (`@webiny/background-tasks/api/features/TaskController/augmentation.js`, side effect only, as `api-file-manager` does) that types `controller.state`, `controller.response` and `controller.runtime` for Task 12. `node scripts/generateTsConfigsInPackages.js`, `yarn adio` and `yarn webiny sync-dependencies` are clean.

The hooks repeat the load, guard, fail, save sequence inline in each hook (the no-wrapper rule: dependency calls stay in the owning class), with the reason as the only difference.

**Files:**
- Modify: `packages/api-workflows/package.json`
- Modify (generated): `packages/api-workflows/tsconfig.json`, `packages/api-workflows/tsconfig.build.json`
- Create: `packages/api-workflows/src/domain/review/getStaleStepRunReason.ts`
- Create: `packages/api-workflows/src/features/stepRun/WorkflowStepRunTask/WorkflowStepRunTaskHandler.ts`
- Create: `packages/api-workflows/src/features/stepRun/WorkflowStepRunTask/WorkflowStepRunTaskDefinition.ts`
- Create: `packages/api-workflows/src/features/stepRun/WorkflowStepRunTask/feature.ts`
- Create: `packages/api-workflows/src/features/stepRun/WorkflowStepRunTask/index.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/__helpers/FakeTaskController.ts`
- Create: `packages/api-workflows/__tests__/domain/getStaleStepRunReason.test.ts`
- Create: `packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`

**Interfaces:**
- Consumes:
  - `TaskDefinition`, `TaskHandler` (`@webiny/api-core/features/task/TaskDefinition/index.js`): `TaskHandler.Interface<I>`, `TaskHandler.RunParams<I>`, `TaskHandler.LifecycleHookParams<I>` (`{ task, definition }`), `TaskDefinition.CreateInputValidationParams`; `TaskService.Task` (`@webiny/api-core/features/task/TaskService/index.js`).
  - Task 9: `STEP_RUN_TASK_DEFINITION_ID`, `STEP_RUN_MAX_ITERATIONS` (`~/features/stepRun/constants.js`), `StepRunTaskInput` (`~/features/stepRun/types.js`); test seams `resetFakeTasks`, `FailingReviewSave` / `reviewSaveFaults`, `captureLoggedErrors` / `loggedErrors`.
  - Task 5: `Review.fail({ stepId, reason, now })` (idempotent on a failed step), `Review.approve`, `Review.cancel`, `getAutomationActor`; helpers `createRunningAutomationReview(taskId)`, `AUTOMATION_STEP_ID`, `automationActor` (`~tests/__helpers/stepRunReviews.js`).
  - Task 2: `AutomationDefinitionRegistryService` (`get(id)`), `automationStepConfigSchema`, `registerTestAutomation(container, overrides?)` (`~tests/__helpers/TestAutomationDefinition.js`).
  - Existing: `ReviewRepository` (`get(id): Promise<Result<ReviewData, ...>>`), `ReviewSaver`, `Logger`, `Review.fromData`, `container.resolveImplementation(handlerClass)` (the runner's way of building a handler), `createContextHandler`.
- Produces (matches the contract):
  - `getStaleStepRunReason(review: ReviewData, stepId: string, task: StepRunTaskIdentity): string | null` and `StepRunTaskIdentity { id: string; createdById: string }` (`~/domain/review/getStaleStepRunReason.js`). Consumed by Tasks 12 and 14.
  - `WorkflowStepRunTaskDefinition` (`TaskDefinition.createImplementation(...)`) and `WorkflowStepRunTaskHandler` (`TaskHandler.createImplementation(...)`; `run` placeholder, `createInputValidation`, `onError`, `onMaxIterations`, `onAbort`; dependencies `[ReviewRepository, ReviewSaver, Logger, AutomationDefinitionRegistryService]`), feature `WorkflowStepRunTaskFeature`, registered in `WorkflowsFeature`. Task 12 fills `run`.
  - Test seam `FakeTaskController` (`~tests/__helpers/FakeTaskController.js`, R157): `createFakeTaskController(params?)` returning `{ controller, task, outputUpdates }`; `response.continue(data, { seconds })` (R162). Created here, the first task that drives the handler; Task 12 and later reuse it.
  - The `@webiny/background-tasks` dependency of `api-workflows`.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/__helpers/FakeTaskController.ts` (the one fake controller of every handler test, P1; `continue` has the platform's signature `continue(data, { seconds })`, R162, and ignores a wait below one second like the real one):

```ts
import "@webiny/background-tasks/api/features/TaskController/augmentation.js";
import {
    type ITaskOutput,
    TaskResultStatus
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import {
    TaskDataStatus,
    type TaskService
} from "@webiny/api-core/features/task/TaskService/index.js";
import type { StepRunTaskInput } from "~/features/stepRun/types.js";
import { NOW, requester } from "./fixtures.js";

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
}

/**
 * A `TaskController` for driving a task handler directly (R157): `response` builds the same
 * result objects as the runner's (`continue` ignores a wait below one second, like the real one),
 * `state` is backed by plain variables and `outputUpdates` records every `updateOutput` call.
 */
export const createFakeTaskController = (params: FakeTaskControllerParams = {}) => {
    const task: TaskService.Task<StepRunTaskInput> = {
        id: params.taskId ?? "task-1",
        name: "Workflow step: Check links",
        definitionId: "workflowsStepRun",
        executionName: "",
        input: params.input ?? { reviewId: "review-1", stepId: "automation" },
        iterations: params.iterations ?? 1,
        taskStatus: TaskDataStatus.RUNNING,
        eventResponse: undefined,
        createdOn: NOW,
        savedOn: NOW,
        createdBy: {
            id: params.createdById ?? requester.id,
            displayName: requester.displayName,
            type: "admin"
        }
    };
    let output: ITaskOutput | undefined = params.output;
    const outputUpdates: ITaskOutput[] = [];

    const controller = {
        response: {
            done: (message?: string, doneOutput?: ITaskOutput) => ({
                status: TaskResultStatus.DONE,
                message,
                output: doneOutput
            }),
            continue: (input: StepRunTaskInput, options?: { seconds: number }) => ({
                status: TaskResultStatus.CONTINUE,
                input,
                wait: options && options.seconds >= 1 ? options.seconds : undefined
            }),
            error: (error: Error | string) => ({
                status: TaskResultStatus.ERROR,
                error: { message: typeof error === "string" ? error : error.message }
            }),
            aborted: () => ({ status: TaskResultStatus.ABORTED })
        },
        state: {
            getTask: () => task,
            getStatus: () => task.taskStatus,
            getInput: () => task.input,
            getOutput: () => output,
            updateInput: async () => undefined,
            updateOutput: async (values: ITaskOutput) => {
                if (params.outputUpdateError) {
                    throw params.outputUpdateError;
                }
                outputUpdates.push(structuredClone(values));
                output = { ...output, ...values };
            }
        },
        logger: {
            info: async () => undefined,
            error: async () => undefined
        },
        task: {
            trigger: async () => {
                throw new Error("The step run handler never triggers child tasks.");
            },
            listChildren: async () => []
        },
        runtime: {
            isCloseToTimeout: () => false,
            isAborted: () => false,
            getRemainingSeconds: () => 900,
            getRemainingMilliseconds: () => 900000
        }
    };

    return {
        controller: controller as unknown as TaskController.Interface<StepRunTaskInput>,
        task,
        outputUpdates
    };
};
```

Create `packages/api-workflows/__tests__/domain/getStaleStepRunReason.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getStaleStepRunReason } from "~/domain/review/getStaleStepRunReason.js";
import type { ReviewData } from "~/domain/review/types.js";
import { requester, toSaveData } from "~tests/__helpers/fixtures.js";
import {
    AUTOMATION_STEP_ID,
    createRunningAutomationReview
} from "~tests/__helpers/stepRunReviews.js";

const TASK = { id: "task-1", createdById: requester.id };

const createData = (): ReviewData => {
    return toSaveData(createRunningAutomationReview("task-1"));
};

describe("getStaleStepRunReason (R144)", () => {
    it("is null for the current step of an active review that carries the task id", () => {
        expect(getStaleStepRunReason(createData(), AUTOMATION_STEP_ID, TASK)).toBeNull();
    });

    it("is stale when the review is not active", () => {
        const data = { ...createData(), isActive: false };

        expect(getStaleStepRunReason(data, AUTOMATION_STEP_ID, TASK)).toBe(
            "The review is not active."
        );
    });

    it("is stale when the review is not in progress", () => {
        const data: ReviewData = { ...createData(), state: "rejected" };

        expect(getStaleStepRunReason(data, AUTOMATION_STEP_ID, TASK)).toBe(
            "The review is not in progress."
        );
    });

    it("is stale when another step is the current step", () => {
        const data: ReviewData = { ...createData(), currentStepId: "editorial" };

        expect(getStaleStepRunReason(data, AUTOMATION_STEP_ID, TASK)).toBe(
            "The step is not the current step."
        );
    });

    it("is stale when the step is not in review (failed, approved, pending)", () => {
        for (const state of ["failed", "approved", "pending", "awaiting", "rejected"] as const) {
            const data = createData();
            data.steps[0].state = state;

            expect(getStaleStepRunReason(data, AUTOMATION_STEP_ID, TASK)).toBe(
                "The step is not in review."
            );
        }
    });

    it("is stale when the step names no step of the review", () => {
        const data: ReviewData = { ...createData(), currentStepId: "unknown" };

        expect(getStaleStepRunReason(data, "unknown", TASK)).toBe("The step is not in review.");
    });

    it("is stale for the task id of an earlier attempt", () => {
        const data = createData();
        data.steps[0].taskId = "task-2";

        expect(getStaleStepRunReason(data, AUTOMATION_STEP_ID, TASK)).toBe(
            "The step does not belong to this task."
        );
    });

    it("is stale when the step has no task id yet", () => {
        const data = createData();
        data.steps[0].taskId = null;

        expect(getStaleStepRunReason(data, AUTOMATION_STEP_ID, TASK)).toBe(
            "The step does not belong to this task."
        );
    });

    it("is stale when the task was not created by the requester", () => {
        expect(
            getStaleStepRunReason(createData(), AUTOMATION_STEP_ID, {
                id: "task-1",
                createdById: "user-someone-else"
            })
        ).toBe("The task was not created by the requester.");
    });
});
```

Create `packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import zod from "zod";
import {
    TaskDefinition,
    type TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskDataStatus, type TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { resetFakeTasks } from "~tests/__helpers/FakeTaskService.js";
import { createFakeTaskController } from "~tests/__helpers/FakeTaskController.js";
import { registerTestAutomation } from "~tests/__helpers/TestAutomationDefinition.js";
import { FailingReviewSave, reviewSaveFaults } from "~tests/__helpers/FailingReviewSave.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { NOW, requester } from "~tests/__helpers/fixtures.js";
import {
    AUTOMATION_STEP_ID,
    automationActor,
    createRunningAutomationReview
} from "~tests/__helpers/stepRunReviews.js";
import type { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
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
    const saver = context.container.resolve(ReviewSaver);
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
            const saved = await saver.save(review);
            if (saved.isFail()) {
                throw saved.error;
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
    it("is one private definition with a high iteration ceiling and no self cleanup", async () => {
        const { context } = await createContextHandler();

        const definitions = context.container
            .resolveAll(TaskDefinition)
            .filter(item => item.id === STEP_RUN_TASK_DEFINITION_ID);

        expect(definitions).toHaveLength(1);
        expect(definitions[0]).toMatchObject({
            id: "workflowsStepRun",
            title: "Workflow step run",
            isPrivate: true,
            selfCleanup: "never",
            maxIterations: 10000
        });
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

describe.each(HOOKS)("workflowsStepRun $hook (R144, R146, R148)", ({ hook, reason, errorMessage, logged }) => {
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
});

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
        expect(loggedErrors[0].fields.error).toEqual({ message: "x".repeat(900) });
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

describe("workflowsStepRun run (placeholder until Task 12)", () => {
    it("returns done", async () => {
        const { handler } = await createContext();
        const { controller } = createFakeTaskController();

        const result = await handler.run({
            input: { reviewId: "review-1", stepId: AUTOMATION_STEP_ID },
            definition: DEFINITION,
            controller
        });

        expect(result).toMatchObject({ status: "done" });
    });
});
```

In `packages/api-workflows/__tests__/registration.test.ts`, add the import after the `ReviewTaskAbortService` import:

```ts
import { WorkflowStepRunTaskDefinition } from "~/features/stepRun/WorkflowStepRunTask/index.js";
```

and the assertion after `expect(container.resolveAll(ReviewTaskAbortService)).toHaveLength(1);`:

```ts
        expect(container.resolveAll(WorkflowStepRunTaskDefinition)).toHaveLength(1);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/domain/getStaleStepRunReason.test.ts packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, `~/domain/review/getStaleStepRunReason.js` and `~/features/stepRun/WorkflowStepRunTask/index.js` do not exist.

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/domain/getStaleStepRunReason.test.ts packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, same reason.

- [ ] **Step 3: The dependency**

In `packages/api-workflows/package.json`, add to `dependencies` after `"@webiny/api-mailer": "0.0.0",`:

```json
    "@webiny/background-tasks": "0.0.0",
```

Run `yarn > /dev/null 2>&1`, then `node scripts/generateTsConfigsInPackages.js` (adds the `../background-tasks` reference and the `@webiny/background-tasks` path to `tsconfig.json` and `tsconfig.build.json` of `api-workflows`), then `yarn adio`.

- [ ] **Step 4: The stale guard**

Create `packages/api-workflows/src/domain/review/getStaleStepRunReason.ts`:

```ts
import type { ReviewData } from "./types.js";

export interface StepRunTaskIdentity {
    id: string;
    /** The id of the identity that created the task. */
    createdById: string;
}

/**
 * Why a step run task must not write to the review, or `null` when it may (D7, D27, R144). The
 * run handler, every failure hook and stuck detection call it with the task's own id and creator,
 * never with values read from the task input (R148).
 *
 * A task is current only when the review is active and in progress, the step is the current step
 * and is in review, the step carries this task's id (a restarted step carries a new one, a
 * forged or foreign task carries none) and the task was created by the review's requester (the
 * automation reach triggers as the requester, R149).
 */
export const getStaleStepRunReason = (
    review: ReviewData,
    stepId: string,
    task: StepRunTaskIdentity
): string | null => {
    if (!review.isActive) {
        return "The review is not active.";
    }
    if (review.state !== "inProgress") {
        return "The review is not in progress.";
    }
    if (review.currentStepId !== stepId) {
        return "The step is not the current step.";
    }
    const step = review.steps.find(item => item.id === stepId);
    if (!step || step.state !== "inReview") {
        return "The step is not in review.";
    }
    if (step.taskId !== task.id) {
        return "The step does not belong to this task.";
    }
    if (task.createdById !== review.createdBy.id) {
        return "The task was not created by the requester.";
    }
    return null;
};
```

- [ ] **Step 5: The handler, the definition and the feature**

Create `packages/api-workflows/src/features/stepRun/WorkflowStepRunTask/WorkflowStepRunTaskHandler.ts`:

```ts
import "@webiny/background-tasks/api/features/TaskController/augmentation.js";
import {
    TaskHandler,
    type TaskDefinition
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { automationStepConfigSchema } from "~/domain/automation/automationStepConfigSchema.js";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewNotFoundError } from "~/domain/review/errors.js";
import { getStaleStepRunReason } from "~/domain/review/getStaleStepRunReason.js";
import { AutomationDefinitionRegistryService } from "~/features/automation/AutomationDefinitionRegistryService/index.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import { DEFAULT_AUTOMATION_MAX_ITERATIONS } from "../constants.js";
import type { StepRunTaskInput } from "../types.js";

type RunParams = TaskHandler.RunParams<StepRunTaskInput>;
type HookParams = TaskHandler.LifecycleHookParams<StepRunTaskInput>;

/**
 * Runs one automation step (spec 7.4, R142). The run itself arrives in Task 12; the failure
 * hooks fail the step when the runner reports an error, the iteration ceiling or an abort. Every
 * hook is guarded (R144): it writes only when the task is the step's current task, was created by
 * the requester and the review is active and in progress; otherwise it logs at info and writes
 * nothing. A hook never throws.
 */
class WorkflowStepRunTaskHandlerImpl implements TaskHandler.Interface<StepRunTaskInput> {
    public constructor(
        private repository: ReviewRepository.Interface,
        private saver: ReviewSaver.Interface,
        private logger: Logger.Interface,
        private definitions: AutomationDefinitionRegistryService.Interface
    ) {}

    public async run({ controller }: RunParams) {
        return controller.response.done();
    }

    public createInputValidation({ validator }: TaskDefinition.CreateInputValidationParams) {
        return {
            reviewId: validator.string(),
            stepId: validator.string()
        };
    }

    public async onError({ task }: HookParams): Promise<void> {
        // Fixed text only: the task's own error can carry internals (R146).
        const reason = "The automation failed.";

        const { reviewId, stepId } = task.input;
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

    public async onMaxIterations({ task }: HookParams): Promise<void> {
        const { reviewId, stepId } = task.input;
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
            // The reason names the automation's own limit from the review snapshot, never the
            // 10000 ceiling of the task definition (R145, P4).
            const step = loaded.value.steps.find(item => item.id === stepId);
            const config = automationStepConfigSchema.safeParse(step?.config);
            const own = config.success ? this.definitions.get(config.data.automationId) : null;
            const maxIterations = own?.maxIterations ?? DEFAULT_AUTOMATION_MAX_ITERATIONS;
            const reason = `The automation did not finish in ${maxIterations} iterations.`;
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

    public async onAbort({ task }: HookParams): Promise<void> {
        const reason = "The automation was aborted.";

        const { reviewId, stepId } = task.input;
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
}

export const WorkflowStepRunTaskHandler = TaskHandler.createImplementation({
    implementation: WorkflowStepRunTaskHandlerImpl,
    dependencies: [ReviewRepository, ReviewSaver, Logger, AutomationDefinitionRegistryService]
});
```

Create `packages/api-workflows/src/features/stepRun/WorkflowStepRunTask/WorkflowStepRunTaskDefinition.ts`:

```ts
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { STEP_RUN_MAX_ITERATIONS, STEP_RUN_TASK_DEFINITION_ID } from "../constants.js";
import { WorkflowStepRunTaskHandler } from "./WorkflowStepRunTaskHandler.js";

/**
 * The one private task that runs an automation step (R142). Private, so the task list never shows
 * it and the GraphQL `triggerTask` refuses it as unknown (SEC-68, Task 7); only the engine
 * triggers it, through `TaskService.trigger` in the automation reach. The ceiling is high on
 * purpose: the handler enforces the automation definition's own `maxIterations` (R145).
 */
class WorkflowStepRunTaskDefinitionImpl implements TaskDefinition.Interface {
    public readonly id = STEP_RUN_TASK_DEFINITION_ID;
    public readonly title = "Workflow step run";
    public readonly description = "Runs an automation step of a workflow review.";
    public readonly isPrivate = true;
    public readonly maxIterations = STEP_RUN_MAX_ITERATIONS;
    public readonly selfCleanup = "never" as const;

    public readonly handler = WorkflowStepRunTaskHandler;
}

export const WorkflowStepRunTaskDefinition = TaskDefinition.createImplementation({
    implementation: WorkflowStepRunTaskDefinitionImpl,
    dependencies: []
});
```

Create `packages/api-workflows/src/features/stepRun/WorkflowStepRunTask/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { WorkflowStepRunTaskDefinition } from "./WorkflowStepRunTaskDefinition.js";

export const WorkflowStepRunTaskFeature = createFeature({
    name: "Workflows/WorkflowStepRunTask",
    register(container) {
        // Only the definition is registered; the runner builds the handler with
        // `resolveImplementation(definition.handler)`, as for every other task.
        container.register(WorkflowStepRunTaskDefinition);
    }
});
```

Create `packages/api-workflows/src/features/stepRun/WorkflowStepRunTask/index.ts`:

```ts
export { WorkflowStepRunTaskDefinition } from "./WorkflowStepRunTaskDefinition.js";
export { WorkflowStepRunTaskHandler } from "./WorkflowStepRunTaskHandler.js";
```

In `packages/api-workflows/src/WorkflowsFeature.ts`, add after the `ReviewTaskAbortServiceFeature` import:

```ts
import { WorkflowStepRunTaskFeature } from "~/features/stepRun/WorkflowStepRunTask/feature.js";
```

and after `ReviewTaskAbortServiceFeature.register(container);`:

```ts
        // The private task that runs an automation step (R142)
        WorkflowStepRunTaskFeature.register(container);
```

- [ ] **Step 6: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/domain/getStaleStepRunReason.test.ts packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/domain/getStaleStepRunReason.test.ts packages/api-workflows/__tests__/stepRun/WorkflowStepRunTask.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 7: Run the existing tests covering the changed code and the SEC-68 guard**

Run: `yarn test packages/api-workflows/__tests__/stepRun/ReviewTaskAbortService.test.ts packages/api-workflows/__tests__/review/ReviewSaverTaskAbort.test.ts packages/api-workflows/__tests__/stepTypes/AutomationReach.test.ts 2>&1 | tail -50` and the same with `yarn test:os` (one run at a time).
Expected: PASS.

The platform half of Review Focus 1 (a task triggered through GraphQL for a private definition writes nothing because it is never created) is pinned by Task 7:

Run: `yarn test packages/background-tasks/__tests__/graphql/triggerTaskPrivate.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows|background-tasks" | head`
Expected: no output.

Run: `yarn adio 2>&1 | tail -20` and `yarn webiny sync-dependencies 2>&1 | tail -20`
Expected: clean (the `@webiny/background-tasks` dependency is used by the handler import).

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`, restore `.gitleaks.toml`; stage the regenerated `tsconfig.json` and `tsconfig.build.json` of `api-workflows` and `yarn.lock`), then commit:

```
feat(api-workflows): add the private workflowsStepRun task definition, its stale guard and failure hooks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
