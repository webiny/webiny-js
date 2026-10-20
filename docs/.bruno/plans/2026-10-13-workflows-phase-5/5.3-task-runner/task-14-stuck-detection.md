### Task 14: Stuck detection on single-review reads

Spec 5.1, 7.4; D28, D57, D132; R144, R146, R152, R157, R159; A51; Review Focus 1. A task can end without writing the outcome to its review: the platform marks it `success`, `failed` or `aborted` (or its record is gone) while the step is still `inReview`, for example the runner was killed after the handler's save failed, or the task was aborted from the tasks UI. The `onError`, `onMaxIterations` and `onAbort` hooks (Task 11) cover the cases where the runner still calls them; stuck detection covers the rest, lazily, when somebody looks at the review:

- New DI service `StuckStepService` (`features/stepRun/StuckStepService/`), `check(review: ReviewData): Promise<ReviewData>`. It returns the review unchanged unless its current step is an `automation` step that is `inReview` and carries a `taskId`. It then reads the task through `GetTaskUseCase` (`@webiny/background-tasks/api/features/GetTask/index.js`, `execute(id)` returns the task or `null`). The step is stuck when the task is `null` AND the step's own time (`startedOn`, falling back to `reachedOn`, then the review's `lastChangedOn`) is older than the same grace (`getTask` returns `null` on any read failure, not only on not-found, so a storage hiccup must not fail a live step; the step time stands in for the missing `finishedOn`), or its `taskStatus` is `success`, or `failed` / `aborted` AND `finishedOn` (falling back to `savedOn`) is more than `STEP_RUN_STUCK_GRACE_MS` (300000, 5 minutes, Task 9 constants) ago: the runner may still call `onError` / `onAbort` right after the platform marks a task `failed` / `aborted`, and those hooks fail the step with the proper reason, so stuck detection must not race them. A `pending` or `running` task is alive and never stuck. A stuck step must also pass the stale guard (R144): `getStaleStepRunReason(review, step.id, { id: taskId, createdById })` returns `null`; `createdById` is the task's creator, or the requester's id when the task does not exist (there is nobody to compare). A task started by somebody else (a forged one) therefore never fails a review.
- A stuck step is failed with the fixed reason `The automation task ended without a result.` (R146): `Review.fromData`, `review.fail({ stepId, reason, now })`, `ReviewSaver.save` (so the `StepFailed` event, the target sync and the version bump are the normal ones). The failed review is returned.
- The service never throws and never fails a read: a throwing task lookup, a refused `fail` (the step is not failed twice, R140), a failed or throwing save all leave the review as read and log with `Logger.error`. A save that persisted but failed in the target sync (`ReviewTargetSyncError`) counts as written: the review it carries is returned, and the sync failure is logged with `Logger.error` too (R159, nothing is swallowed silently).
- Only single reads call it: `GetReviewUseCase.execute` and `GetTargetReviewUseCase.execute` (the latter only when an active review exists). RULING (R152): the read-triggered write happens in the engine before the app wrapper's authorization check; it is accepted because it only moves a truly stuck step to `failed` (a correct, idempotent state change), returns no extra data to the caller and runs in the engine, which checks no permissions (D132). Lists (`ListReviews`, `ListTargetReviews`, ...) never look at tasks (R152): a list over many reviews must not make one task read per row.
- `StuckStepService` is registered by its own feature in `WorkflowsFeature`. It resolves `GetTaskUseCase`, which production gets from `BackgroundTasksFeature`; the test containers have none, so the api-workflows `createContextHandler` registers the new `FakeGetTask` (a map of task id to status) by default, and the CMS test context gets a package-local `NoopGetTask` by default (R157; Task 9 did the same for `TaskService`; the WB test context already registers `BackgroundTasksFeature`). Task 16 builds an in-review automation step in the CMS tests and registers a package-local `FakeGetTask` (same name and API as the one created here) over the no-op where it needs task statuses. No existing test reads an `inReview` automation step through a single read, so no existing expectation changes.

**Files:**
- Create: `packages/api-workflows/src/features/stepRun/StuckStepService/abstractions.ts`
- Create: `packages/api-workflows/src/features/stepRun/StuckStepService/StuckStepService.ts`
- Create: `packages/api-workflows/src/features/stepRun/StuckStepService/feature.ts`
- Create: `packages/api-workflows/src/features/stepRun/StuckStepService/index.ts`
- Modify: `packages/api-workflows/src/features/review/GetReview/GetReviewUseCase.ts`
- Modify: `packages/api-workflows/src/features/review/GetTargetReview/GetTargetReviewUseCase.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/__helpers/FakeGetTask.ts`
- Modify: `packages/api-workflows/__tests__/__helpers/handler.ts`
- Create: `packages/api-workflows/__tests__/stepRun/StuckStepService.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/NoopGetTask.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/__handler/context.ts`
- Modify: `packages/api-headless-cms-workflows/package.json`

**Interfaces:**
- Consumes:
  - `GetTaskUseCase` (`@webiny/background-tasks/api/features/GetTask/index.js`): `execute<I, O>(id: string): Promise<TaskService.Task<I, O> | null>`. `TaskService.Task` (`@webiny/api-core/features/task/TaskService/index.js`): `id`, `taskStatus: TaskDataStatus`, `createdBy: { id; displayName; type }`, `iterations`, `input`, `output`, ...; `TaskDataStatus` (`PENDING`, `RUNNING`, `FAILED`, `SUCCESS`, `ABORTED`).
  - Task 11: `getStaleStepRunReason(review: ReviewData, stepId: string, task: StepRunTaskIdentity): string | null` (`~/domain/review/getStaleStepRunReason.js`), `StepRunTaskIdentity { id: string; createdById: string }`; Task 9: `STEP_RUN_STUCK_GRACE_MS` (`~/features/stepRun/constants.js`); `@webiny/background-tasks` is already a dependency of `api-workflows`.
  - Task 5: `Review.fail({ stepId, reason, now })` (`Result<void, ReviewFailError>`, an already failed step is a no-op ok), `ReviewStepFailedEvent`; test helpers `createRunningAutomationReview(taskId)`, `createFailedAutomationReview()`, `AUTOMATION_STEP_ID` (`~tests/__helpers/stepRunReviews.js`).
  - Task 9: `ReviewSaver` (`save(review: Review): Promise<Result<ReviewData, ReviewPersistenceError | ReviewTargetSyncError>>`), `FailingReviewSave` and `reviewSaveFaults` (`~tests/__helpers/FailingReviewSave.js`), the CMS package-local `FakeTaskService` (registered in the CMS context).
  - Existing: `ReviewTargetSyncError` (`~/domain/review/errors.js`, `data.review` is the saved review), `Logger` (`@webiny/api-core/features/logger/index.js`), `AUTOMATION_STEP_TYPE` (`~/domain/workflow/stepTypes.js`, Task 1), `GetReviewUseCase`, `GetTargetReviewUseCase`, `ListTargetReviewsUseCase`, `ReviewRepository`, `captureLoggedErrors` / `loggedErrors`, `FailingReviewTargetSync`, `RecordingEventPublisher` / `recordedEvents` / `workflowEventTypes`, `createRequestedReview`, `toSaveData`, `expectOk`, `ARTICLE_MODEL`, `requester`.
- Produces:
  - `StuckStepService` (`~/features/stepRun/StuckStepService/index.js`): `check(review: ReviewData): Promise<ReviewData>`, namespace types `StuckStepService.Interface`; feature `StuckStepFeature`. Consumed by `GetReviewUseCase` and `GetTargetReviewUseCase`.
  - Test seam `FakeGetTask` (`~tests/__helpers/FakeGetTask.js`): class `FakeGetTask` with `set(id, status, createdById?, finishedOn?)`, `reset()`, `calls: string[]`, `failure: Error | null`, and the shared instance `fakeGetTask`, registered by default in `createContextHandler`. Consumed by the Task 16 and 17 tests only through the package-local copies those tasks write (same names, R157).

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/__helpers/FakeGetTask.ts`:

```ts
import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";
import {
    TaskDataStatus,
    type TaskService
} from "@webiny/api-core/features/task/TaskService/index.js";
import { requester } from "./fixtures.js";

const NOW = "2026-10-09T10:00:00.000Z";

/**
 * Task reads from a map of task id to status. `calls` records every id that was read and
 * `failure`, when set, is thrown by every read. Reset it with `reset()` in `beforeEach`.
 */
export class FakeGetTask implements GetTaskUseCase.Interface {
    public readonly calls: string[] = [];
    public failure: Error | null = null;
    private readonly tasks = new Map<string, TaskService.Task>();

    /**
     * `createdById` defaults to the requester: the trigger runs as the requester (R149).
     * `finishedOn` defaults to a time long past the stuck grace (R152); pass a recent one to test
     * the grace.
     */
    public set(
        id: string,
        status: TaskDataStatus,
        createdById: string = requester.id,
        finishedOn: string = NOW
    ): void {
        this.tasks.set(id, {
            id,
            name: "Workflow step: Check links",
            definitionId: "workflowsStepRun",
            executionName: "",
            input: {},
            iterations: 1,
            taskStatus: status,
            eventResponse: undefined,
            finishedOn,
            createdOn: NOW,
            savedOn: NOW,
            createdBy: { id: createdById, displayName: "Rita Requester", type: "admin" }
        });
    }

    public reset(): void {
        this.calls.length = 0;
        this.failure = null;
        this.tasks.clear();
    }

    public async execute<I extends TaskService.TaskInput, O extends TaskService.GenericOutput>(
        id: string
    ): GetTaskUseCase.Return<I, O> {
        this.calls.push(id);
        if (this.failure) {
            throw this.failure;
        }
        return (this.tasks.get(id) ?? null) as unknown as TaskService.Task<I, O> | null;
    }
}

export const fakeGetTask = new FakeGetTask();
```

In `packages/api-workflows/__tests__/__helpers/handler.ts` add the imports next to the `FakeTaskService` import:

```ts
import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";
import { fakeGetTask } from "./FakeGetTask.js";
```

and register the fake next to `FakeTaskService` in `setup`:

```ts
        setup: async container => {
            WorkflowsFeature.register(container);
            // `ReviewSaver` aborts tasks through `TaskService`; the test containers have no
            // background-tasks feature. A test that needs another one registers it in `setup`.
            container.register(FakeTaskService);
            // Single review reads look at the step's task (stuck detection, R152).
            container.registerInstance(GetTaskUseCase, fakeGetTask);
            await params.setup?.(container);
        },
```

Create `packages/api-workflows/__tests__/stepRun/StuckStepService.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { TaskDataStatus } from "@webiny/api-core/features/task/TaskService/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { fakeGetTask } from "~tests/__helpers/FakeGetTask.js";
import { FailingReviewSave, reviewSaveFaults } from "~tests/__helpers/FailingReviewSave.js";
import { FailingReviewTargetSync } from "~tests/__helpers/FailingReviewTargetSync.js";
import {
    RecordingEventPublisher,
    recordedEvents,
    workflowEventTypes
} from "~tests/__helpers/RecordingEventPublisher.js";
import {
    createFailedAutomationReview,
    createRunningAutomationReview
} from "~tests/__helpers/stepRunReviews.js";
import {
    ARTICLE_MODEL,
    createRequestedReview,
    expectOk,
    requester,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import { STEP_RUN_STUCK_GRACE_MS } from "~/features/stepRun/constants.js";
import type { Review } from "~/domain/review/Review.js";
import type { ReviewData } from "~/domain/review/types.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { GetReviewUseCase } from "~/features/review/GetReview/index.js";
import { GetTargetReviewUseCase } from "~/features/review/GetTargetReview/index.js";
import { ListTargetReviewsUseCase } from "~/features/review/ListTargetReviews/index.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import { StuckStepService } from "~/features/stepRun/StuckStepService/index.js";

const STUCK_REASON = "The automation task ended without a result.";

interface SaverFaults {
    throwNext: boolean;
}

const saverFaults: SaverFaults = { throwNext: false };

class ThrowingReviewSaverImpl implements ReviewSaver.Interface {
    public constructor(private decoratee: ReviewSaver.Interface) {}

    public async save(review: Review): ReviewSaver.Return {
        if (saverFaults.throwNext) {
            saverFaults.throwNext = false;
            throw new Error("The saver crashed.");
        }
        return this.decoratee.save(review);
    }
}

const ThrowingReviewSaver = ReviewSaver.createDecorator({
    decorator: ThrowingReviewSaverImpl,
    dependencies: []
});

interface SetupParams {
    seed?: ReviewData;
    failSync?: boolean;
}

/** One review ("review-1" on "article-1#0001") is stored; the recorders are empty afterwards. */
const setup = async (params: SetupParams = {}) => {
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerDecorator(FailingReviewSave);
            container.registerDecorator(ThrowingReviewSaver);
            container.registerDecorator(RecordingEventPublisher);
            if (params.failSync) {
                container.register(FailingReviewTargetSync);
            }
        }
    });
    const reviews = context.container.resolve(ReviewRepository);
    expectOk(await reviews.save(params.seed ?? toSaveData(createRunningAutomationReview("task-1"))));
    recordedEvents.length = 0;

    return {
        reviews,
        stuckSteps: context.container.resolve(StuckStepService),
        getReview: context.container.resolve(GetReviewUseCase),
        getTargetReview: context.container.resolve(GetTargetReviewUseCase),
        listTargetReviews: context.container.resolve(ListTargetReviewsUseCase)
    };
};

describe("Stuck detection on single reads (D28, R152)", () => {
    beforeEach(() => {
        fakeGetTask.reset();
        loggedErrors.length = 0;
        recordedEvents.length = 0;
        reviewSaveFaults.failNext = false;
        saverFaults.throwNext = false;
    });

    it.each([TaskDataStatus.SUCCESS, TaskDataStatus.FAILED, TaskDataStatus.ABORTED])(
        "fails an in-review automation step whose task is %s (finished long ago) and returns the failed review",
        async status => {
            fakeGetTask.set("task-1", status);
            const { getReview, reviews } = await setup();

            const review = expectOk(await getReview.execute({ id: "review-1" }));

            expect(fakeGetTask.calls).toEqual(["task-1"]);
            expect(review).toMatchObject({
                state: "inProgress",
                currentStepState: "failed",
                currentStepType: "automation"
            });
            expect(review.steps[0]).toMatchObject({
                state: "failed",
                comment: STUCK_REASON,
                taskId: "task-1"
            });
            const stored = expectOk(await reviews.get("review-1"));
            expect(stored.steps[0]).toMatchObject({ state: "failed", comment: STUCK_REASON });
            expect(workflowEventTypes()).toEqual(["Workflows/Review/StepFailed"]);
        }
    );

    it.each([TaskDataStatus.FAILED, TaskDataStatus.ABORTED])(
        "leaves the step alone while a %s task finished inside the grace, its hooks may still run (R152)",
        async status => {
            const justNow = new Date(Date.now() - 1000).toISOString();
            fakeGetTask.set("task-1", status, requester.id, justNow);
            const { getReview, reviews } = await setup();

            const review = expectOk(await getReview.execute({ id: "review-1" }));

            expect(review.steps[0]).toMatchObject({ state: "inReview", comment: null });
            expect(expectOk(await reviews.get("review-1")).steps[0].state).toBe("inReview");
            expect(workflowEventTypes()).toEqual([]);
        }
    );

    it.each([TaskDataStatus.FAILED, TaskDataStatus.ABORTED])(
        "fails the step once a %s task finished longer ago than the grace (R152)",
        async status => {
            const pastGrace = new Date(Date.now() - STEP_RUN_STUCK_GRACE_MS - 1000).toISOString();
            fakeGetTask.set("task-1", status, requester.id, pastGrace);
            const { getReview } = await setup();

            const review = expectOk(await getReview.execute({ id: "review-1" }));

            expect(review.steps[0]).toMatchObject({ state: "failed", comment: STUCK_REASON });
        }
    );

    it("fails the step at once when the task succeeded without writing a result, no grace", async () => {
        const justNow = new Date(Date.now() - 1000).toISOString();
        fakeGetTask.set("task-1", TaskDataStatus.SUCCESS, requester.id, justNow);
        const { getReview } = await setup();

        const review = expectOk(await getReview.execute({ id: "review-1" }));

        expect(review.steps[0]).toMatchObject({ state: "failed", comment: STUCK_REASON });
    });

    it("fails the step when the task record is gone and the step is older than the grace", async () => {
        const seed = toSaveData(createRunningAutomationReview("task-1"));
        // pins the step older than STEP_RUN_STUCK_GRACE_MS regardless of the fixture's reach time
        seed.steps[0].startedOn = new Date(Date.now() - STEP_RUN_STUCK_GRACE_MS - 1000).toISOString();
        const { getReview } = await setup({ seed });

        const review = expectOk(await getReview.execute({ id: "review-1" }));

        expect(review.steps[0]).toMatchObject({ state: "failed", comment: STUCK_REASON });
    });

    it("leaves a recent step alone when its task record is missing, the read may have failed (R152)", async () => {
        const seed = toSaveData(createRunningAutomationReview("task-1"));
        seed.steps[0].startedOn = new Date(Date.now() - 1000).toISOString();
        const { getReview, reviews } = await setup({ seed });

        const review = expectOk(await getReview.execute({ id: "review-1" }));

        expect(review.steps[0]).toMatchObject({ state: "inReview", comment: null });
        const stored = expectOk(await reviews.get("review-1"));
        expect(stored.steps[0].state).toBe("inReview");
    });

    it.each([TaskDataStatus.PENDING, TaskDataStatus.RUNNING])(
        "leaves the step alone while its task is %s",
        async status => {
            fakeGetTask.set("task-1", status);
            const { getReview, reviews } = await setup();

            const review = expectOk(await getReview.execute({ id: "review-1" }));

            expect(review.steps[0]).toMatchObject({ state: "inReview", comment: null });
            const stored = expectOk(await reviews.get("review-1"));
            expect(stored.steps[0].state).toBe("inReview");
            expect(workflowEventTypes()).toEqual([]);
        }
    );

    it("never fails a step for a task somebody else created (stale guard, R144)", async () => {
        fakeGetTask.set("task-1", TaskDataStatus.SUCCESS, "user-intruder");
        const { getReview, reviews } = await setup();

        const review = expectOk(await getReview.execute({ id: "review-1" }));

        expect(review.steps[0].state).toBe("inReview");
        expect(expectOk(await reviews.get("review-1")).steps[0].state).toBe("inReview");
        expect(workflowEventTypes()).toEqual([]);
    });

    it.each([
        { name: "a review step", seed: () => createRequestedReview(), state: "awaiting" },
        { name: "a failed step", seed: () => createFailedAutomationReview(), state: "failed" },
        { name: "a step without a task id", seed: () => createRunningAutomationReview(null), state: "inReview" }
    ])("does not read a task for $name", async ({ seed, state }) => {
        const { getReview } = await setup({ seed: toSaveData(seed()) });

        const review = expectOk(await getReview.execute({ id: "review-1" }));

        expect(fakeGetTask.calls).toEqual([]);
        expect(review.steps[0].state).toBe(state);
    });

    it("fails the step through GetTargetReview too, and returns null without a review", async () => {
        fakeGetTask.set("task-1", TaskDataStatus.SUCCESS);
        const { getTargetReview } = await setup();

        const review = expectOk(
            await getTargetReview.execute({
                model: ARTICLE_MODEL,
                targetRevisionId: "article-1#0001"
            })
        );
        fakeGetTask.calls.length = 0;
        const none = expectOk(
            await getTargetReview.execute({
                model: ARTICLE_MODEL,
                targetRevisionId: "article-9#0001"
            })
        );

        expect(review?.steps[0]).toMatchObject({ state: "failed", comment: STUCK_REASON });
        expect(none).toBeNull();
        expect(fakeGetTask.calls).toEqual([]);
    });

    it("does not look at tasks when listing", async () => {
        fakeGetTask.set("task-1", TaskDataStatus.SUCCESS);
        const { listTargetReviews } = await setup();

        const reviews = expectOk(
            await listTargetReviews.execute({ model: ARTICLE_MODEL, targetId: "article-1" })
        );

        expect(fakeGetTask.calls).toEqual([]);
        expect(reviews[0].steps[0].state).toBe("inReview");
    });

    it("returns the review as read and logs when the task lookup throws", async () => {
        fakeGetTask.failure = new Error("Tasks are down.");
        const { getReview, reviews } = await setup();

        const result = await getReview.execute({ id: "review-1" });

        expect(result.isOk()).toBe(true);
        expect(result.value.steps[0].state).toBe("inReview");
        expect(expectOk(await reviews.get("review-1")).steps[0].state).toBe("inReview");
        expect(loggedErrors.map(logged => logged.message)).toEqual([
            "Could not read the step run task; the review is returned as read."
        ]);
    });

    it("returns the review as read and logs when the write fails", async () => {
        fakeGetTask.set("task-1", TaskDataStatus.SUCCESS);
        const { getReview, reviews } = await setup();
        reviewSaveFaults.failNext = true;

        const result = await getReview.execute({ id: "review-1" });

        expect(result.isOk()).toBe(true);
        expect(result.value.steps[0].state).toBe("inReview");
        expect(expectOk(await reviews.get("review-1")).steps[0].state).toBe("inReview");
        expect(loggedErrors.map(logged => logged.message)).toEqual([
            "Could not mark the stuck step as failed; the review is returned as read."
        ]);
    });

    it("returns the review as read and logs when the save throws", async () => {
        fakeGetTask.set("task-1", TaskDataStatus.SUCCESS);
        const { getReview } = await setup();
        saverFaults.throwNext = true;

        const result = await getReview.execute({ id: "review-1" });

        expect(result.isOk()).toBe(true);
        expect(result.value.steps[0].state).toBe("inReview");
        expect(loggedErrors.map(logged => logged.message)).toEqual([
            "Could not mark the stuck step as failed; the review is returned as read."
        ]);
    });

    it("counts a write that persisted but failed in the target sync as written", async () => {
        fakeGetTask.set("task-1", TaskDataStatus.SUCCESS);
        const { getReview, reviews } = await setup({ failSync: true });

        const result = await getReview.execute({ id: "review-1" });

        expect(result.isOk()).toBe(true);
        expect(result.value.steps[0]).toMatchObject({ state: "failed", comment: STUCK_REASON });
        expect(expectOk(await reviews.get("review-1")).steps[0].state).toBe("failed");
        expect(loggedErrors.map(logged => logged.message)).toEqual([
            "The stuck step was failed, but syncing the target failed."
        ]);
    });

    it("checks a review passed in directly and never throws", async () => {
        fakeGetTask.set("task-1", TaskDataStatus.SUCCESS);
        const { stuckSteps, reviews } = await setup();
        const data = expectOk(await reviews.get("review-1"));

        const checked = await stuckSteps.check(data);

        expect(checked.steps[0]).toMatchObject({ state: "failed", comment: STUCK_REASON });
    });
});
```

In `packages/api-workflows/__tests__/registration.test.ts` add the import next to the other review imports:

```ts
import { StuckStepService } from "~/features/stepRun/StuckStepService/index.js";
```

and after `expect(container.resolveAll(GetReviewUseCase)).toHaveLength(1);`:

```ts
        expect(container.resolveAll(StuckStepService)).toHaveLength(1);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/stepRun/StuckStepService.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL. Both files cannot resolve `~/features/stepRun/StuckStepService/index.js`.

Run the same with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/stepRun/StuckStepService.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, same reason.

- [ ] **Step 3: The service**

Create `packages/api-workflows/src/features/stepRun/StuckStepService/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";

export interface IStuckStepService {
    /**
     * Returns `review` unchanged, or the saved review whose current automation step was failed
     * because its task ended without writing a result. Never throws.
     */
    check(review: ReviewData): Promise<ReviewData>;
}

/**
 * Stuck detection for single reads (D28, D57, R152): an `inReview` automation step whose task is
 * `success`, `failed` / `aborted` for longer than the grace, or gone (null task) for longer than the grace, and that passes the stale guard (R144), is failed with
 * `The automation task ended without a result.`. Called by `GetReviewUseCase` and
 * `GetTargetReviewUseCase` only, never by lists. Internal (D132): no permission checks.
 */
export const StuckStepService = createAbstraction<IStuckStepService>("StuckStepService");

export namespace StuckStepService {
    export type Interface = IStuckStepService;
}
```

Create `packages/api-workflows/src/features/stepRun/StuckStepService/StuckStepService.ts`:

```ts
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { TaskDataStatus } from "@webiny/api-core/features/task/TaskService/index.js";
import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";
import { Review } from "~/domain/review/Review.js";
import { ReviewTargetSyncError } from "~/domain/review/errors.js";
import { getStaleStepRunReason } from "~/domain/review/getStaleStepRunReason.js";
import type { ReviewData } from "~/domain/review/types.js";
import { AUTOMATION_STEP_TYPE } from "~/domain/workflow/stepTypes.js";
import { STEP_RUN_STUCK_GRACE_MS } from "~/features/stepRun/constants.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import { StuckStepService as Abstraction } from "./abstractions.js";

class StuckStepServiceImpl implements Abstraction.Interface {
    constructor(
        private getTask: GetTaskUseCase.Interface,
        private saver: ReviewSaver.Interface,
        private logger: Logger.Interface
    ) {}

    async check(review: ReviewData): Promise<ReviewData> {
        const step = review.steps.find(item => item.id === review.currentStepId);
        if (!step || step.type !== AUTOMATION_STEP_TYPE || step.state !== "inReview") {
            return review;
        }
        const taskId = step.taskId;
        if (!taskId) {
            return review;
        }

        let task: Awaited<GetTaskUseCase.Return>;
        try {
            task = await this.getTask.execute(taskId);
        } catch (error) {
            this.logger.error(
                { error, reviewId: review.id, stepId: step.id, taskId },
                "Could not read the step run task; the review is returned as read."
            );
            return review;
        }
        if (!task) {
            // `getTask` answers null on any read failure, not only not-found: give a missing task
            // the same grace, measured from when the step started (R152).
            const stepSince = Date.parse(step.startedOn ?? step.reachedOn ?? review.lastChangedOn);
            // `!(a > b)` also keeps an unparseable time inside the grace.
            if (!(Date.now() - stepSince > STEP_RUN_STUCK_GRACE_MS)) {
                return review;
            }
        } else {
            // A pending or running task is alive.
            if (
                task.taskStatus === TaskDataStatus.PENDING ||
                task.taskStatus === TaskDataStatus.RUNNING
            ) {
                return review;
            }
            // A failed or aborted task may still be followed by the runner's `onError` /
            // `onAbort` hook, which fails the step with the proper reason: wait out the grace
            // before treating the step as stuck (R152). A `success` task writes nothing more.
            if (task.taskStatus !== TaskDataStatus.SUCCESS) {
                const finishedAt = Date.parse(task.finishedOn ?? task.savedOn);
                // `!(a > b)` also keeps an unparseable time inside the grace.
                if (!(Date.now() - finishedAt > STEP_RUN_STUCK_GRACE_MS)) {
                    return review;
                }
            }
        }

        // A task that is gone has no creator to compare, so the requester stands in for it.
        const stale = getStaleStepRunReason(review, step.id, {
            id: taskId,
            createdById: task ? task.createdBy.id : review.createdBy.id
        });
        if (stale) {
            this.logger.info(
                { reviewId: review.id, stepId: step.id, taskId, reason: stale },
                "Stuck detection skipped a stale step run."
            );
            return review;
        }

        const stuck = Review.fromData(review);
        const failed = stuck.fail({
            stepId: step.id,
            reason: "The automation task ended without a result.",
            now: new Date().toISOString()
        });
        if (failed.isFail()) {
            this.logger.error(
                { error: failed.error, reviewId: review.id, stepId: step.id, taskId },
                "Could not mark the stuck step as failed; the review is returned as read."
            );
            return review;
        }

        try {
            const saved = await this.saver.save(stuck);
            if (saved.isOk()) {
                return saved.value;
            }
            // The review is saved, only the target sync failed (R16): the step is failed. The
            // sync failure is still logged (R159).
            if (saved.error instanceof ReviewTargetSyncError) {
                this.logger.error(
                    { error: saved.error, reviewId: review.id, stepId: step.id, taskId },
                    "The stuck step was failed, but syncing the target failed."
                );
                return saved.error.data.review;
            }
            this.logger.error(
                { error: saved.error, reviewId: review.id, stepId: step.id, taskId },
                "Could not mark the stuck step as failed; the review is returned as read."
            );
            return review;
        } catch (error) {
            this.logger.error(
                { error, reviewId: review.id, stepId: step.id, taskId },
                "Could not mark the stuck step as failed; the review is returned as read."
            );
            return review;
        }
    }
}

export const StuckStepService = Abstraction.createImplementation({
    implementation: StuckStepServiceImpl,
    dependencies: [GetTaskUseCase, ReviewSaver, Logger]
});
```

Create `packages/api-workflows/src/features/stepRun/StuckStepService/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { StuckStepService } from "./StuckStepService.js";

export const StuckStepFeature = createFeature({
    name: "Workflows/StuckStep",
    register(container) {
        container.register(StuckStepService);
    }
});
```

Create `packages/api-workflows/src/features/stepRun/StuckStepService/index.ts`:

```ts
export { StuckStepService } from "./abstractions.js";
```

- [ ] **Step 4: The two single reads call it**

Replace `packages/api-workflows/src/features/review/GetReview/GetReviewUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { StuckStepService } from "~/features/stepRun/StuckStepService/index.js";
import { GetReviewUseCase as UseCase } from "./abstractions.js";

class GetReviewUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private stuckSteps: StuckStepService.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const loaded = await this.repository.get(input.id);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        // A step whose task ended without a result is failed on the way out (R152).
        return Result.ok(await this.stuckSteps.check(loaded.value));
    }
}

export const GetReviewUseCase = UseCase.createImplementation({
    implementation: GetReviewUseCaseImpl,
    dependencies: [ReviewRepository, StuckStepService]
});
```

Replace `packages/api-workflows/src/features/review/GetTargetReview/GetTargetReviewUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { StuckStepService } from "~/features/stepRun/StuckStepService/index.js";
import { GetTargetReviewUseCase as UseCase } from "./abstractions.js";

class GetTargetReviewUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private stuckSteps: StuckStepService.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const loaded = await this.repository.getActiveByTarget({
            model: input.model,
            targetRevisionId: input.targetRevisionId
        });
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        if (!loaded.value) {
            return Result.ok(null);
        }
        // A step whose task ended without a result is failed on the way out (R152).
        return Result.ok(await this.stuckSteps.check(loaded.value));
    }
}

export const GetTargetReviewUseCase = UseCase.createImplementation({
    implementation: GetTargetReviewUseCaseImpl,
    dependencies: [ReviewRepository, StuckStepService]
});
```

In `packages/api-workflows/src/WorkflowsFeature.ts`, add the import after the `ReviewLifecycleFeature` import:

```ts
import { StuckStepFeature } from "~/features/stepRun/StuckStepService/feature.js";
```

and register it after `CancelReviewFeature.register(container);`:

```ts
        // Stuck detection on single reads (R152)
        StuckStepFeature.register(container);
```

- [ ] **Step 5: The CMS test context gets a no-op task read (package-local, R157)**

`GetReviewUseCase` now resolves `GetTaskUseCase`, which the CMS test context does not register (the WB one registers `BackgroundTasksFeature`). Create `packages/api-headless-cms-workflows/__tests__/__helpers/NoopGetTask.ts`:

```ts
import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";

/**
 * `GetTaskUseCase` for contexts that register the workflows feature but no background-tasks
 * feature: single review reads resolve it for stuck detection (R152). It answers `null`, which is
 * only acted on for an in-review automation step; the CMS tests that build one (Task 16) register
 * a package-local `FakeGetTask` over it.
 */
export const NoopGetTask: GetTaskUseCase.Interface = {
    execute: async () => null
};
```

In `packages/api-headless-cms-workflows/__tests__/__handler/context.ts`, add the imports after the `FakeTaskService` import:

```ts
import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";
import { NoopGetTask } from "../__helpers/NoopGetTask.js";
```

and register it next to `FakeTaskService`:

```ts
            container.register(FakeTaskService);
            // Single reads resolve the task read for stuck detection; no background tasks here.
            container.registerInstance(GetTaskUseCase, NoopGetTask);
```

In `packages/api-headless-cms-workflows/package.json` add to `devDependencies` (alphabetical, next to the other `@webiny/*` entries; the version is the workspace one, as in `packages/api-website-builder-workflows/package.json`):

```json
    "@webiny/background-tasks": "0.0.0",
```

- [ ] **Step 6: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/stepRun/StuckStepService.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/stepRun/StuckStepService.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows|background-tasks" | head`
Expected: no output.

- [ ] **Step 7: Run the existing tests covering the changed code**

Every single read now goes through `StuckStepService`. Run the api-workflows files that read reviews, then one CMS and one WB file that read them through the wrappers:

Run: `yarn test packages/api-workflows/__tests__/review/TargetReviews.test.ts packages/api-workflows/__tests__/review/RequestReview.test.ts packages/api-workflows/__tests__/review/ReviewTransitions.test.ts packages/api-workflows/__tests__/review/CurrentStepType.test.ts packages/api-workflows/__tests__/review/ReassignReviewStep.test.ts packages/api-workflows/__tests__/routing/ListStepCandidates.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/review/TargetReviews.test.ts packages/api-workflows/__tests__/review/RequestReview.test.ts packages/api-workflows/__tests__/review/ReviewTransitions.test.ts packages/api-workflows/__tests__/review/CurrentStepType.test.ts packages/api-workflows/__tests__/review/ReassignReviewStep.test.ts packages/api-workflows/__tests__/routing/ListStepCandidates.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn test packages/api-headless-cms-workflows/__tests__/registration.test.ts packages/api-headless-cms-workflows/__tests__/wrappers 2>&1 | tail -50`
Expected: PASS (a directory path selects its files; these are the CMS wrapper tests that resolve `GetReviewUseCase`). If a wrapper file in that directory fails because it already needs a context change from an earlier task of this phase, fix that change, not this task.

Run: `yarn test packages/api-website-builder-workflows/__tests__/graphql 2>&1 | tail -50`
Expected: PASS (the WB context registers `BackgroundTasksFeature`, so its `GetTaskUseCase` is the real one; no existing WB test reads an in-review automation step).

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` and `@webiny/api-headless-cms-workflows` with `--no-cache`; `yarn adio` and `yarn webiny sync-dependencies` pick up the new CMS dev dependency; restore `.gitleaks.toml`), then commit:

```
feat(api-workflows): fail a review step whose background task ended without a result on single reads

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
