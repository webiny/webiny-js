### Task 9: `ReviewTaskAbortService`, abort on failed save, step-run constants

Spec 5.1, 7.4; D25, D57; R142, R143, R144, R151; A51; Review Focus 2. The automation reach triggers its background task before the review is saved (Task 10), so a failed save would leave a task running for a review that does not have it. This task adds the abort half and the constants and test seams the later tasks need:

- `features/stepRun/constants.ts`: `STEP_RUN_TASK_DEFINITION_ID = "workflowsStepRun"`, `STEP_RUN_MAX_ITERATIONS = 10000`, `STEP_RUN_TASKID_WAIT_TRIES = 3`, `STEP_RUN_TASKID_WAIT_SECONDS = 2`, `DEFAULT_AUTOMATION_MAX_ITERATIONS = 50`, `STEP_RUN_STUCK_GRACE_MS = 300000` (consumed by Task 14, R152). `features/stepRun/types.ts`: `StepRunTaskInput { reviewId: string; stepId: string }`.
- `ReviewTaskAbortService` (`features/stepRun/ReviewTaskAbortService/`): `abort({ taskIds, message }): Promise<void>`. For each id it calls `TaskService.abort({ id, message })` inline with the Result pattern and a `try`/`catch`; a failed Result or a throw is logged with `Logger.error` (fields `error`, `taskId`) and never propagates. An empty `taskIds` makes no call. It is a DI service because three callers share it (saver, Task 10, Task 13), and it wraps one dependency (`TaskService`) with real logic (loop, per-id isolation, logging), not a pass-through.
- `ReviewSaver.save`: when persisting fails, it collects the `taskId` of every recorded `stepReached` fact (non-null only) and calls `ReviewTaskAbortService.abort({ taskIds, message: "The review could not be saved." })`, then returns the unchanged persistence error. A save that succeeded and then failed in the target sync does not abort (the review is saved and carries the task id). A save that fails after the task finished is covered by the stale guard (R143, Task 11).
- Test seams (R157, P1: the one helper set, these names everywhere): `__tests__/__helpers/FakeTaskService` (records `trigger` and `abort` calls and the identity in force at trigger time, returns `task-1`, `task-2`, ..., can be told to fail or throw) and the reusable `FailingReviewSave` decorator (Tasks 11-15 reuse both; none defines its own variant). `FakeTaskService` is registered by default in the api-workflows `createContextHandler`, because `ReviewSaver` now depends on `TaskService` (through `ReviewTaskAbortService`) and the test containers have no background-tasks feature. The CMS test package cannot import across packages, so it gets a package-local copy named `FakeTaskService` (same name and exports) registered in its test context for the same reason (R157). The WB test context already registers `BackgroundTasksFeature`, so it has a real `TaskService` and needs none. Production always registers `TaskService` through `BackgroundTasksFeature` (before `WorkflowsFeature` in `registerApiRequestStack.ts`).

**Files:**
- Create: `packages/api-workflows/src/features/stepRun/constants.ts`
- Create: `packages/api-workflows/src/features/stepRun/types.ts`
- Create: `packages/api-workflows/src/features/stepRun/ReviewTaskAbortService/abstractions.ts`
- Create: `packages/api-workflows/src/features/stepRun/ReviewTaskAbortService/ReviewTaskAbortService.ts`
- Create: `packages/api-workflows/src/features/stepRun/ReviewTaskAbortService/feature.ts`
- Create: `packages/api-workflows/src/features/stepRun/ReviewTaskAbortService/index.ts`
- Modify: `packages/api-workflows/src/features/review/ReviewSaver/ReviewSaver.ts`
- Modify: `packages/api-workflows/src/features/review/ReviewSaver/abstractions.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/__helpers/FakeTaskService.ts`
- Create: `packages/api-workflows/__tests__/__helpers/FailingReviewSave.ts`
- Modify: `packages/api-workflows/__tests__/__helpers/handler.ts`
- Create: `packages/api-workflows/__tests__/stepRun/ReviewTaskAbortService.test.ts`
- Create: `packages/api-workflows/__tests__/review/ReviewSaverTaskAbort.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/FakeTaskService.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/__handler/context.ts`

**Interfaces:**
- Consumes:
  - `TaskService` (`@webiny/api-core/features/task/TaskService/index.js`): `abort(params: { id: string; message?: string }): Promise<Result<ITask, BaseError>>`, `trigger(...)`, `fetchServiceInfo(...)`; `TaskDataStatus`.
  - `Logger` (`@webiny/api-core/features/logger/index.js`): `error(obj, message)`.
  - Task 5: `Review.reachRun({ actor, owner, taskId, now })` and `ReviewStepReachedFact.taskId: string | null`; `getAutomationActor(requester)` (`~/domain/automation/getAutomationActor.js`); the review builder `createPendingAutomationReview()` (`~tests/__helpers/stepRunReviews.js`: review `review-1`, requested by `requester`, step `automation` pending, the `requested` fact kept).
  - Existing: `ReviewSaver`, `ReviewRepository` (decorator pattern as in `AssignmentRecordsAfterSave.test.ts`), `ReviewPersistenceError`, `captureLoggedErrors` / `loggedErrors` (`~tests/__helpers/CapturingLogger.js`), `FailingReviewTargetSync` (`~tests/__helpers/FailingReviewTargetSync.js`), `RecordingReviewTargetSync` (`recordedSyncs`), `requester`, `NOW`, `expectOk` (`~tests/__helpers/fixtures.js`).
- Produces (matches the contract):
  - Constants and `StepRunTaskInput` as above. Consumed by Tasks 10, 11, 12.
  - `ReviewTaskAbortService` (`~/features/stepRun/ReviewTaskAbortService/index.js`): `abort(params: ReviewTaskAbortParams): Promise<void>`, `ReviewTaskAbortParams { taskIds: string[]; message: string }`; feature `ReviewTaskAbortServiceFeature`, registered in `WorkflowsFeature`. Consumed by Tasks 10 and 13.
  - Test seams: `FakeTaskService` (`~tests/__helpers/FakeTaskService.js`): exports `FakeTaskService` (a `TaskService` implementation), `triggeredTasks: TriggeredTask[]`, `abortedTasks: AbortedTask[]`, `fakeTaskFaults: FakeTaskFaults`, `resetFakeTasks()`; `FailingReviewSave` and `reviewSaveFaults` (`~tests/__helpers/FailingReviewSave.js`). Consumed by Tasks 10-15. The CMS package-local copy of `FakeTaskService` has the same exports.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/__helpers/FakeTaskService.ts` (a helper, written first because the tests use it; it is test infrastructure, not production code):

```ts
import { BaseError, Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import {
    TaskDataStatus,
    TaskService
} from "@webiny/api-core/features/task/TaskService/index.js";

export interface TriggeredTask {
    id: string;
    definition: string;
    name: string | undefined;
    input: TaskService.TaskInput | undefined;
    /** The identity in force when `trigger` was called (R149). */
    identityId: string;
    identityType: string;
}

export interface AbortedTask {
    id: string;
    message: string | undefined;
}

export type FakeTaskFault = "none" | "fail" | "throw";

export interface FakeTaskFaults {
    trigger: FakeTaskFault;
    abort: FakeTaskFault;
    /** The message of a failed or thrown `trigger`; the default when `null`. */
    triggerMessage: string | null;
}

/** Every `trigger` call, in order. Clear it with `resetFakeTasks()` in `beforeEach`. */
export const triggeredTasks: TriggeredTask[] = [];
/** Every `abort` call, in order. */
export const abortedTasks: AbortedTask[] = [];
/** Set `trigger` or `abort` to `"fail"` (failed Result) or `"throw"` for the next calls; the messages carry no trailing period because the engine's fail reasons append one. */
export const fakeTaskFaults: FakeTaskFaults = {
    trigger: "none",
    abort: "none",
    triggerMessage: null
};

let nextTaskNumber = 1;

export const resetFakeTasks = (): void => {
    triggeredTasks.length = 0;
    abortedTasks.length = 0;
    fakeTaskFaults.trigger = "none";
    fakeTaskFaults.abort = "none";
    fakeTaskFaults.triggerMessage = null;
    nextTaskNumber = 1;
};

const NOW = "2026-10-09T10:00:00.000Z";

// `TaskService.trigger` and `abort` are generic over the task input and output; the fake returns a
// plain task, so the Results are cast with `as never` (a test helper, never production code).
class FakeTaskServiceImpl implements TaskService.Interface {
    public constructor(private identityContext: IdentityContext.Interface) {}

    public async trigger(params: Parameters<TaskService.Interface["trigger"]>[0]) {
        const identity = this.identityContext.getIdentity();
        const triggerMessage = fakeTaskFaults.triggerMessage;
        if (fakeTaskFaults.trigger === "throw") {
            throw new Error(triggerMessage ?? "The task service is down");
        }
        if (fakeTaskFaults.trigger === "fail") {
            return Result.fail(
                new BaseError({ message: triggerMessage ?? "The task could not be created" })
            );
        }
        const id = `task-${nextTaskNumber++}`;
        triggeredTasks.push({
            id,
            definition: params.definition,
            name: params.name,
            input: params.input,
            identityId: identity.id,
            identityType: identity.type
        });
        return Result.ok({
            id,
            name: params.name ?? "",
            definitionId: params.definition,
            executionName: "",
            input: params.input ?? {},
            iterations: 0,
            taskStatus: TaskDataStatus.PENDING,
            eventResponse: undefined,
            createdOn: NOW,
            savedOn: NOW,
            createdBy: { id: identity.id, displayName: identity.displayName, type: identity.type }
        }) as never;
    }

    public async abort(params: Parameters<TaskService.Interface["abort"]>[0]) {
        abortedTasks.push({ id: params.id, message: params.message });
        if (fakeTaskFaults.abort === "throw") {
            throw new Error("The task service is down");
        }
        if (fakeTaskFaults.abort === "fail") {
            return Result.fail(new BaseError({ message: "The task could not be aborted" }));
        }
        return Result.ok({
            id: params.id,
            name: "",
            definitionId: "",
            executionName: "",
            input: {},
            iterations: 0,
            taskStatus: TaskDataStatus.ABORTED,
            eventResponse: undefined,
            createdOn: NOW,
            savedOn: NOW,
            createdBy: { id: "", displayName: "", type: "" }
        }) as never;
    }

    public async fetchServiceInfo() {
        return Result.ok({}) as never;
    }
}

export const FakeTaskService = TaskService.createImplementation({
    implementation: FakeTaskServiceImpl,
    dependencies: [IdentityContext]
});
```

Create `packages/api-workflows/__tests__/__helpers/FailingReviewSave.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";
import type { ReviewData } from "~/domain/review/types.js";

export interface ReviewSaveFaults {
    failNext: boolean;
}

/** Set `failNext` to fail the next `save` once; everything else passes through. */
export const reviewSaveFaults: ReviewSaveFaults = { failNext: false };

class FailingReviewSaveImpl implements ReviewRepository.Interface {
    public constructor(private decoratee: ReviewRepository.Interface) {}

    public get(id: string): ReturnType<ReviewRepository.Interface["get"]> {
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

    public async save(review: ReviewData): ReturnType<ReviewRepository.Interface["save"]> {
        if (reviewSaveFaults.failNext) {
            reviewSaveFaults.failNext = false;
            return Result.fail(new ReviewPersistenceError(new Error("Storage is down.")));
        }
        return this.decoratee.save(review);
    }

    public delete(id: string): ReturnType<ReviewRepository.Interface["delete"]> {
        return this.decoratee.delete(id);
    }
}

export const FailingReviewSave = ReviewRepository.createDecorator({
    decorator: FailingReviewSaveImpl,
    dependencies: []
});
```

In `packages/api-workflows/__tests__/__helpers/handler.ts`, add the import and register the fake before the test's own `setup`:

```ts
import { FakeTaskService } from "./FakeTaskService.js";
```

```ts
        setup: async container => {
            WorkflowsFeature.register(container);
            // `ReviewSaver` aborts tasks through `TaskService`; the test containers have no
            // background-tasks feature. A test that needs another one registers it in `setup`.
            container.register(FakeTaskService);
            await params.setup?.(container);
        },
```

Create `packages/api-workflows/__tests__/stepRun/ReviewTaskAbortService.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    abortedTasks,
    fakeTaskFaults,
    resetFakeTasks
} from "~tests/__helpers/FakeTaskService.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { ReviewTaskAbortService } from "~/features/stepRun/ReviewTaskAbortService/index.js";
import {
    DEFAULT_AUTOMATION_MAX_ITERATIONS,
    STEP_RUN_MAX_ITERATIONS,
    STEP_RUN_STUCK_GRACE_MS,
    STEP_RUN_TASK_DEFINITION_ID,
    STEP_RUN_TASKID_WAIT_SECONDS,
    STEP_RUN_TASKID_WAIT_TRIES
} from "~/features/stepRun/constants.js";

const createService = async () => {
    const { context } = await createContextHandler({ setup: captureLoggedErrors });
    return context.container.resolve(ReviewTaskAbortService);
};

describe("ReviewTaskAbortService (D57, R143, R151)", () => {
    beforeEach(() => {
        resetFakeTasks();
        loggedErrors.length = 0;
    });

    it("aborts every task id with the message", async () => {
        const service = await createService();

        await service.abort({ taskIds: ["task-1", "task-2"], message: "The review was cancelled." });

        expect(abortedTasks).toEqual([
            { id: "task-1", message: "The review was cancelled." },
            { id: "task-2", message: "The review was cancelled." }
        ]);
        expect(loggedErrors).toEqual([]);
    });

    it("makes no call for an empty list", async () => {
        const service = await createService();

        await service.abort({ taskIds: [], message: "The review was cancelled." });

        expect(abortedTasks).toEqual([]);
    });

    it("logs a failed abort, never throws, and still aborts the other ids", async () => {
        const service = await createService();
        fakeTaskFaults.abort = "fail";

        await expect(
            service.abort({ taskIds: ["task-1", "task-2"], message: "The review was deleted." })
        ).resolves.toBeUndefined();

        expect(abortedTasks.map(task => task.id)).toEqual(["task-1", "task-2"]);
        expect(loggedErrors).toHaveLength(2);
        expect(loggedErrors[0].fields).toMatchObject({ taskId: "task-1" });
    });

    it("logs a throwing abort, never throws, and still aborts the other ids", async () => {
        const service = await createService();
        fakeTaskFaults.abort = "throw";

        await expect(
            service.abort({ taskIds: ["task-1", "task-2"], message: "The review was deleted." })
        ).resolves.toBeUndefined();

        expect(abortedTasks.map(task => task.id)).toEqual(["task-1", "task-2"]);
        expect(loggedErrors).toHaveLength(2);
        expect(loggedErrors[1].fields).toMatchObject({ taskId: "task-2" });
    });
});

describe("step run constants (R142, R143, R145)", () => {
    it("has the contract values", () => {
        expect(STEP_RUN_TASK_DEFINITION_ID).toBe("workflowsStepRun");
        expect(STEP_RUN_MAX_ITERATIONS).toBe(10000);
        expect(STEP_RUN_TASKID_WAIT_TRIES).toBe(3);
        expect(STEP_RUN_TASKID_WAIT_SECONDS).toBe(2);
        expect(DEFAULT_AUTOMATION_MAX_ITERATIONS).toBe(50);
        expect(STEP_RUN_STUCK_GRACE_MS).toBe(300000);
    });
});
```

Create `packages/api-workflows/__tests__/review/ReviewSaverTaskAbort.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    abortedTasks,
    fakeTaskFaults,
    resetFakeTasks
} from "~tests/__helpers/FakeTaskService.js";
import { FailingReviewSave, reviewSaveFaults } from "~tests/__helpers/FailingReviewSave.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { FailingReviewTargetSync } from "~tests/__helpers/FailingReviewTargetSync.js";
import { recordedSyncs } from "~tests/__helpers/RecordingReviewTargetSync.js";
import { expectOk, NOW, requester } from "~tests/__helpers/fixtures.js";
import { automationActor, createPendingAutomationReview } from "~tests/__helpers/stepRunReviews.js";
import type { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";

/** The automation step reached with `taskId`; the `requested` and `stepReached` facts are kept. */
const createAutomationReview = (taskId: string | null): Review => {
    const review = createPendingAutomationReview();
    expectOk(review.reachRun({ actor: requester, owner: automationActor, taskId, now: NOW }));
    return review;
};

const createSaverContext = async (withFailingSync = false) => {
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerDecorator(FailingReviewSave);
            if (withFailingSync) {
                container.register(FailingReviewTargetSync);
            }
        }
    });
    return context;
};

describe("ReviewSaver aborts the triggered task when the save fails (D57, R143)", () => {
    beforeEach(() => {
        resetFakeTasks();
        recordedSyncs.length = 0;
        loggedErrors.length = 0;
        reviewSaveFaults.failNext = false;
    });

    it("aborts the triggered task when the save fails", async () => {
        const context = await createSaverContext();
        reviewSaveFaults.failNext = true;

        const result = await context.container
            .resolve(ReviewSaver)
            .save(createAutomationReview("task-1"));

        expect(result.isFail()).toBe(true);
        expect(abortedTasks).toEqual([{ id: "task-1", message: "The review could not be saved." }]);
    });

    it("returns the persistence error unchanged and stores nothing", async () => {
        const context = await createSaverContext();
        reviewSaveFaults.failNext = true;

        const result = await context.container
            .resolve(ReviewSaver)
            .save(createAutomationReview("task-1"));
        const stored = await context.container.resolve(ReviewRepository).get("review-1");

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(result.error.message).toBe("Storage is down.");
        expect(stored.isFail()).toBe(true);
    });

    it("keeps the persistence error when the abort itself fails or throws", async () => {
        const context = await createSaverContext();

        reviewSaveFaults.failNext = true;
        fakeTaskFaults.abort = "fail";
        const failed = await context.container
            .resolve(ReviewSaver)
            .save(createAutomationReview("task-1"));

        reviewSaveFaults.failNext = true;
        fakeTaskFaults.abort = "throw";
        const thrown = await context.container
            .resolve(ReviewSaver)
            .save(createAutomationReview("task-2"));

        expect(failed.error.code).toBe("Workflows/Review/Persistence");
        expect(thrown.error.code).toBe("Workflows/Review/Persistence");
        expect(abortedTasks.map(task => task.id)).toEqual(["task-1", "task-2"]);
        expect(loggedErrors).toHaveLength(2);
    });

    it("aborts nothing when the save succeeds", async () => {
        const context = await createSaverContext();

        const result = await context.container
            .resolve(ReviewSaver)
            .save(createAutomationReview("task-1"));

        expect(result.isOk()).toBe(true);
        expect(abortedTasks).toEqual([]);
    });

    it("aborts nothing when the reach failed before a task started (taskId null)", async () => {
        const context = await createSaverContext();
        reviewSaveFaults.failNext = true;

        const result = await context.container
            .resolve(ReviewSaver)
            .save(createAutomationReview(null));

        expect(result.isFail()).toBe(true);
        expect(abortedTasks).toEqual([]);
    });

    it("aborts nothing when the target sync fails after a successful save", async () => {
        const context = await createSaverContext(true);

        const result = await context.container
            .resolve(ReviewSaver)
            .save(createAutomationReview("task-1"));

        expect(result.error.code).toBe("Workflows/Review/TargetSync");
        expect(abortedTasks).toEqual([]);
    });
});
```

In `packages/api-workflows/__tests__/registration.test.ts`, add the import after the `WorkflowBypassService` import:

```ts
import { ReviewTaskAbortService } from "~/features/stepRun/ReviewTaskAbortService/index.js";
```

and the assertion after `expect(container.resolveAll(WorkflowBypassService)).toHaveLength(1);`:

```ts
        expect(container.resolveAll(ReviewTaskAbortService)).toHaveLength(1);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/stepRun/ReviewTaskAbortService.test.ts packages/api-workflows/__tests__/review/ReviewSaverTaskAbort.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, `~/features/stepRun/constants.js` and `~/features/stepRun/ReviewTaskAbortService/index.js` do not exist.

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/stepRun/ReviewTaskAbortService.test.ts packages/api-workflows/__tests__/review/ReviewSaverTaskAbort.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, same reason.

- [ ] **Step 3: Constants, types and the abort service**

Create `packages/api-workflows/src/features/stepRun/constants.ts`:

```ts
/** The one private background task definition that runs an automation step (R142). */
export const STEP_RUN_TASK_DEFINITION_ID = "workflowsStepRun";

/**
 * The task definition's ceiling (R142). The handler enforces the automation definition's own
 * `maxIterations` below it (R145).
 */
export const STEP_RUN_MAX_ITERATIONS = 10000;

/**
 * How many times the handler waits for the review and the step to carry its task id before it
 * treats the run as stale (R143): it waits while `iterations <= STEP_RUN_TASKID_WAIT_TRIES`.
 */
export const STEP_RUN_TASKID_WAIT_TRIES = 3;

/** The continue delay, in seconds, of one wait for the task id (R143). */
export const STEP_RUN_TASKID_WAIT_SECONDS = 2;

/** Used when the automation definition has no `maxIterations` (R145). */
export const DEFAULT_AUTOMATION_MAX_ITERATIONS = 50;

/**
 * How long, in milliseconds, a `failed` or `aborted` task may be finished before stuck detection
 * treats the step as stuck (R152): until then the runner's `onError` / `onAbort` hooks may still
 * fail the step with the proper reason.
 */
export const STEP_RUN_STUCK_GRACE_MS = 300000;
```

Create `packages/api-workflows/src/features/stepRun/types.ts`:

```ts
/**
 * The only input of the step run task (R142). The handler reads nothing else from it (R148):
 * the definition, settings and models come from the review snapshot.
 */
export interface StepRunTaskInput {
    reviewId: string;
    stepId: string;
}
```

Create `packages/api-workflows/src/features/stepRun/ReviewTaskAbortService/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";

export interface ReviewTaskAbortParams {
    taskIds: string[];
    message: string;
}

export interface IReviewTaskAbortService {
    /**
     * Aborts the step run tasks, best effort: a failed or throwing abort is logged and never
     * propagates; the other ids are still aborted. An empty list makes no call.
     */
    abort(params: ReviewTaskAbortParams): Promise<void>;
}

/**
 * Shared by `ReviewSaver` (abort when the save fails, R143), the automation reach (abort when
 * `reachRun` fails after a trigger, Task 10) and cancel and delete (R151).
 */
export const ReviewTaskAbortService =
    createAbstraction<IReviewTaskAbortService>("ReviewTaskAbortService");

export namespace ReviewTaskAbortService {
    export type Interface = IReviewTaskAbortService;
    export type Params = ReviewTaskAbortParams;
}
```

Create `packages/api-workflows/src/features/stepRun/ReviewTaskAbortService/ReviewTaskAbortService.ts`:

```ts
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
                if (result.isFail()) {
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

Create `packages/api-workflows/src/features/stepRun/ReviewTaskAbortService/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ReviewTaskAbortService } from "./ReviewTaskAbortService.js";

export const ReviewTaskAbortServiceFeature = createFeature({
    name: "Workflows/ReviewTaskAbortService",
    register(container) {
        container.register(ReviewTaskAbortService);
    }
});
```

Create `packages/api-workflows/src/features/stepRun/ReviewTaskAbortService/index.ts`:

```ts
export { ReviewTaskAbortService } from "./abstractions.js";
export type { ReviewTaskAbortParams } from "./abstractions.js";
```

In `packages/api-workflows/src/WorkflowsFeature.ts`, add after the `WorkflowBypassServiceFeature` import:

```ts
import { ReviewTaskAbortServiceFeature } from "~/features/stepRun/ReviewTaskAbortService/feature.js";
```

and after `WorkflowBypassServiceFeature.register(container);`:

```ts

        // Step run tasks (R142-R145): the abort service shared by the saver, the reach and cancel
        ReviewTaskAbortServiceFeature.register(container);
```

- [ ] **Step 4: Abort on a failed save**

In `packages/api-workflows/src/features/review/ReviewSaver/ReviewSaver.ts`, add the import after the `ReviewTargetSync` import:

```ts
import { ReviewTaskAbortService } from "~/features/stepRun/ReviewTaskAbortService/index.js";
```

Change the constructor:

```ts
class ReviewSaverImpl implements Abstraction.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private targetSyncs: ReviewTargetSync.Interface[],
        private eventPublisher: EventPublisher.Interface,
        private assignments: AssignmentRepository.Interface,
        private logger: Logger.Interface,
        private taskAbort: ReviewTaskAbortService.Interface
    ) {}
```

Replace the persist block in `save`:

```ts
        // No optimistic locking on reviews (D27).
        const result = await this.repository.save(review.toData());
        if (result.isFail()) {
            // The automation reach triggers its task before this save (R143). The review will not
            // carry the task id, so abort the tasks the recorded reaches started. Best effort: the
            // abort never throws and never changes the error returned here.
            const taskIds: string[] = [];
            for (const fact of facts) {
                if (fact.type === "stepReached" && fact.taskId) {
                    taskIds.push(fact.taskId);
                }
            }
            await this.taskAbort.abort({
                taskIds,
                message: "The review could not be saved."
            });
            return Result.fail(result.error);
        }
        const saved = result.value;
```

and the registration:

```ts
export const ReviewSaver = Abstraction.createImplementation({
    implementation: ReviewSaverImpl,
    dependencies: [
        ReviewRepository,
        [ReviewTargetSync, { multiple: true }],
        EventPublisher,
        AssignmentRepository,
        Logger,
        ReviewTaskAbortService
    ]
});
```

In `packages/api-workflows/src/features/review/ReviewSaver/abstractions.ts`, extend the doc comment so it ends with: `A failed persist aborts the step run tasks started by the recorded reaches (R143) before returning the persistence error.`

- [ ] **Step 5: The CMS test context gets a package-local `FakeTaskService`**

`ReviewSaver` now resolves `TaskService`, and the CMS test context has no background-tasks feature. A package cannot import another package's test helpers, so `api-headless-cms-workflows` keeps its own copy with the same name and exports (R157, P1). Create `packages/api-headless-cms-workflows/__tests__/__helpers/FakeTaskService.ts` (the same code as the `api-workflows` helper, repeated on purpose):

```ts
import { BaseError, Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import {
    TaskDataStatus,
    TaskService
} from "@webiny/api-core/features/task/TaskService/index.js";

export interface TriggeredTask {
    id: string;
    definition: string;
    name: string | undefined;
    input: TaskService.TaskInput | undefined;
    /** The identity in force when `trigger` was called (R149). */
    identityId: string;
    identityType: string;
}

export interface AbortedTask {
    id: string;
    message: string | undefined;
}

export type FakeTaskFault = "none" | "fail" | "throw";

export interface FakeTaskFaults {
    trigger: FakeTaskFault;
    abort: FakeTaskFault;
    /** The message of a failed or thrown `trigger`; the default when `null`. */
    triggerMessage: string | null;
}

/** Every `trigger` call, in order. Clear it with `resetFakeTasks()` in `beforeEach`. */
export const triggeredTasks: TriggeredTask[] = [];
/** Every `abort` call, in order. */
export const abortedTasks: AbortedTask[] = [];
/** Set `trigger` or `abort` to `"fail"` (failed Result) or `"throw"` for the next calls; the messages carry no trailing period because the engine's fail reasons append one. */
export const fakeTaskFaults: FakeTaskFaults = {
    trigger: "none",
    abort: "none",
    triggerMessage: null
};

let nextTaskNumber = 1;

export const resetFakeTasks = (): void => {
    triggeredTasks.length = 0;
    abortedTasks.length = 0;
    fakeTaskFaults.trigger = "none";
    fakeTaskFaults.abort = "none";
    fakeTaskFaults.triggerMessage = null;
    nextTaskNumber = 1;
};

const NOW = "2026-10-09T10:00:00.000Z";

// `TaskService.trigger` and `abort` are generic over the task input and output; the fake returns a
// plain task, so the Results are cast with `as never` (a test helper, never production code).
class FakeTaskServiceImpl implements TaskService.Interface {
    public constructor(private identityContext: IdentityContext.Interface) {}

    public async trigger(params: Parameters<TaskService.Interface["trigger"]>[0]) {
        const identity = this.identityContext.getIdentity();
        const triggerMessage = fakeTaskFaults.triggerMessage;
        if (fakeTaskFaults.trigger === "throw") {
            throw new Error(triggerMessage ?? "The task service is down");
        }
        if (fakeTaskFaults.trigger === "fail") {
            return Result.fail(
                new BaseError({ message: triggerMessage ?? "The task could not be created" })
            );
        }
        const id = `task-${nextTaskNumber++}`;
        triggeredTasks.push({
            id,
            definition: params.definition,
            name: params.name,
            input: params.input,
            identityId: identity.id,
            identityType: identity.type
        });
        return Result.ok({
            id,
            name: params.name ?? "",
            definitionId: params.definition,
            executionName: "",
            input: params.input ?? {},
            iterations: 0,
            taskStatus: TaskDataStatus.PENDING,
            eventResponse: undefined,
            createdOn: NOW,
            savedOn: NOW,
            createdBy: { id: identity.id, displayName: identity.displayName, type: identity.type }
        }) as never;
    }

    public async abort(params: Parameters<TaskService.Interface["abort"]>[0]) {
        abortedTasks.push({ id: params.id, message: params.message });
        if (fakeTaskFaults.abort === "throw") {
            throw new Error("The task service is down");
        }
        if (fakeTaskFaults.abort === "fail") {
            return Result.fail(new BaseError({ message: "The task could not be aborted" }));
        }
        return Result.ok({
            id: params.id,
            name: "",
            definitionId: "",
            executionName: "",
            input: {},
            iterations: 0,
            taskStatus: TaskDataStatus.ABORTED,
            eventResponse: undefined,
            createdOn: NOW,
            savedOn: NOW,
            createdBy: { id: "", displayName: "", type: "" }
        }) as never;
    }

    public async fetchServiceInfo() {
        return Result.ok({}) as never;
    }
}

export const FakeTaskService = TaskService.createImplementation({
    implementation: FakeTaskServiceImpl,
    dependencies: [IdentityContext]
});
```

In `packages/api-headless-cms-workflows/__tests__/__handler/context.ts`, add the import after `registerFakeFolders`:

```ts
import { FakeTaskService } from "../__helpers/FakeTaskService.js";
```

and register it in `setup`:

```ts
        setup: container => {
            WorkflowsFeature.register(container);
            CmsWorkflowsFeature.register(container);
            // The saver aborts tasks through `TaskService`; this context has no background tasks.
            container.register(FakeTaskService);
            // ACO is not registered; the CMS folder port reads these stand-ins.
            registerFakeFolders(container);
        },
```

`FakeTaskService` resolves `IdentityContext`, which every CMS test container has. Tests that need a clean slate call `resetFakeTasks()` from this package-local copy.

- [ ] **Step 6: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/stepRun/ReviewTaskAbortService.test.ts packages/api-workflows/__tests__/review/ReviewSaverTaskAbort.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/stepRun/ReviewTaskAbortService.test.ts packages/api-workflows/__tests__/review/ReviewSaverTaskAbort.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 7: Run the existing tests covering the changed code**

Every context that resolves `ReviewSaver` now needs a `TaskService`. Run the saver and lifecycle tests of `api-workflows`, then one CMS and one WB test file that save reviews:

Run: `yarn test packages/api-workflows/__tests__/review/ReviewSaver.test.ts packages/api-workflows/__tests__/review/AssignmentRecordsAfterSave.test.ts packages/api-workflows/__tests__/review/RequestReview.test.ts packages/api-workflows/__tests__/review/ReviewTransitions.test.ts packages/api-workflows/__tests__/review/ReassignReviewStep.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/review/ReviewSaver.test.ts packages/api-workflows/__tests__/review/AssignmentRecordsAfterSave.test.ts packages/api-workflows/__tests__/review/RequestReview.test.ts packages/api-workflows/__tests__/review/ReviewTransitions.test.ts packages/api-workflows/__tests__/review/ReassignReviewStep.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn test packages/api-headless-cms-workflows/__tests__/hooks/revisionAndSaveBlock.test.ts packages/api-headless-cms-workflows/__tests__/registration.test.ts 2>&1 | tail -50` and the same with `yarn test:os`.
Expected: PASS (the CMS context resolves the saver through its package-local `FakeTaskService`).

Run: `yarn test packages/api-website-builder-workflows/__tests__/target/WbPageAdapter.test.ts 2>&1 | tail -50` and the same with `yarn test:os`.
Expected: PASS (the WB context already registers `BackgroundTasksFeature`; if `TaskService` does not resolve there, add a package-local `FakeTaskService` copy to `packages/api-website-builder-workflows/__tests__/__helpers/` and register it in its `handler.ts` the same way, and add both to this task's files).

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows" | head`
Expected: no output.

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-workflows): add the review task abort service and abort the triggered task when the save fails

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
