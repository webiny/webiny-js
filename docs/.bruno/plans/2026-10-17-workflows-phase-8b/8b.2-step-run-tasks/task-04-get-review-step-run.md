### Task 4: `GetReviewStepRunUseCase` and `canViewStepRunByPermission`

R257, R258, R146, R87, D132, D90, D161; A92; Review Focus 1, 2 (`00-shared.md`). The phase 8a Global Constraints and Rulings R202-R252 apply unchanged (read: R87/D132 never throw out of a dependency, internal engine use cases check no permission, no helper wrappers around dependency calls, one class or one public function per file, one named import per line, namespace types `Foo.Interface`, comments end with a period, targeted tests, the pre-commit chain).

The engine gets one more internal use case that reads the background task of one attempt of a step, so the details drawer can show whether a step's run went well (user answer Q33). It returns only what a person needs to tell "wrong or ok" and never the task's input, output or logs.

- **`GetReviewStepRunUseCase`** (internal, D132: no permission check, the app wrappers of Tasks 5 and 6 authorize). Folder `features/stepRun/GetReviewStepRun/` with `abstractions.ts`, `GetReviewStepRunUseCase.ts` (class `GetReviewStepRunUseCaseImpl`, exported under the token name), `feature.ts` (`GetReviewStepRunFeature`) and `index.ts`, the layout of the sibling `GetReview` folder. Input `GetReviewStepRunInput { reviewId: string; stepId: string; taskId: string }`; dependencies `[ReviewRepository, GetTaskUseCase]`.
- **Flow:**
  1. `ReviewRepository.get(reviewId)`: a failed Result is returned as it is (`Workflows/Review/NotFound` or `Workflows/Review/Persistence`). This is one more read after the wrapper's guard (accepted, R257). It does not run stuck detection (a read of a task must not change the review).
  2. The step is `review.steps.find(step => step.id === stepId)`. The use case requires `taskId === step.taskId` or `taskId` in `step.runs[].taskId`; a step that is not on the review, or any other task id (another step's, another review's, an arbitrary id), is `ReviewStepRunNotFoundError` (code `Workflows/Review/StepRunNotFound`, data `{ reviewId, stepId, taskId }`) and **the task is never read** (this stops the query from opening arbitrary tasks).
  3. `GetTaskUseCase.execute(taskId)` inside `try`/`catch`: a throw is a failed `ReviewPersistenceError` (R87). The task record being gone (`null`) is `Result.ok(null)`, not an error (A92: `GetTaskUseCase.execute` reads by id with no permission check, because `TasksCrud.getTask` runs `identityContext.withoutAuthorization`, and answers `null` for a missing task; the fake test below proves the `null` half only; the no-permission half is a source read, not asserted by any test: the source line is `packages/background-tasks/src/api/crud/crud.tasks.ts` `getTask`, which `StuckStepService` already relies on).
  4. Otherwise the pure `toReviewStepRunInfo({ step, taskId, task })` (own file, next to the use case) builds the `ReviewStepRunInfo`.
- **`ReviewStepRunInfo`** (`[AWF]/domain/review/ReviewStepRunInfo.ts`, no dependencies): `{ taskId: string; status: StepRunTaskStatus; startedOn: string | null; finishedOn: string | null; iterations: number; outcome: StepRunOutcome | null; reason: string | null }` with `StepRunTaskStatus = "pending" | "running" | "done" | "failed" | "aborted"` (the existing `StepRunOutcome` from `~/domain/review/types.js` is reused). `status` maps `TaskDataStatus`: `success` becomes `done`, the other four by name. `iterations` is the automation's own run count, computed as the task handler does (`WorkflowStepRunTaskHandler.ts` lines 115-118, re-read for this plan: `idWaits = typeof output?.idWaits === "number" ? output.idWaits : task.iterations - 1`, `iteration = task.iterations - idWaits`): `task.iterations - idWaits`, never below 0. So an absent `idWaits` gives 1, `idWaits` 2 with `task.iterations` 5 gives 3, and a stored `idWaits` larger than `task.iterations` gives 0.
- **`outcome` and `reason`** come from the review, never from the task: for an earlier attempt the `runs[]` record of that `taskId` (`outcome`, `reason`, as stored, so `null` stays `null`); for the current attempt the step's state: `failed` gives outcome `failed` and reason `step.comment` (the fixed text of R146), `approved` and `rejected` give that outcome and reason `null`, any other state (the step is still running) gives both `null`. **Times** prefer the review's record (the run record's `startedOn`/`finishedOn`, or the step's `startedOn`/`finishedOn`) and fall back to the task's; an absent value becomes `null` (the task's `startedOn`/`finishedOn` are optional strings, `undefined` maps to `null`).
- **`canViewStepRunByPermission(viewer: ReviewPermissionViewer): boolean`** (`[AWF]/domain/review/canViewStepRunByPermission.ts`, R258, D90): `viewer.permissions.editor || viewer.permissions.reassign`. Full access sets both flags, so it passes. Permission only; the wrappers combine it with the guard's read access (Tasks 5 and 6). There is no predicate with this name today (the expression is inlined in `redactAssignmentRecords.ts` and `redactStepCandidates.ts`; those two stay as they are).
- **GraphQL** (`[AWF]/graphql/WorkflowsSchemaFactory.ts`): a new shared type `WorkflowsStepRunInfo { taskId: ID! status: String! startedOn: DateTime finishedOn: DateTime iterations: Int! outcome: String reason: String }` next to the existing `WorkflowsStepRun`, which stays the attempt record. The per-app envelopes and queries are Tasks 5 and 6.
- **No logging in the use case**: a read failure is returned as a failed Result and the wrapper's resolver turns it into the error envelope, as `GetReviewUseCase` does.

**Files:**
- Create: `packages/api-workflows/src/domain/review/ReviewStepRunInfo.ts`
- Create: `packages/api-workflows/src/domain/review/canViewStepRunByPermission.ts`
- Create: `packages/api-workflows/src/features/stepRun/GetReviewStepRun/abstractions.ts`
- Create: `packages/api-workflows/src/features/stepRun/GetReviewStepRun/toReviewStepRunInfo.ts`
- Create: `packages/api-workflows/src/features/stepRun/GetReviewStepRun/GetReviewStepRunUseCase.ts`
- Create: `packages/api-workflows/src/features/stepRun/GetReviewStepRun/feature.ts`
- Create: `packages/api-workflows/src/features/stepRun/GetReviewStepRun/index.ts`
- Modify: `packages/api-workflows/src/domain/review/errors.ts` (`ReviewStepRunNotFoundError`)
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Modify: `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`
- Modify: `packages/api-workflows/__tests__/__helpers/FakeGetTask.ts` (`put`)
- Create: `packages/api-workflows/__tests__/stepRun/GetReviewStepRun.test.ts`
- Create: `packages/api-workflows/__tests__/review/canViewStepRunByPermission.test.ts`
- Modify: `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`

**Interfaces:**
- Consumes (verified with codegraph and the source): `ReviewRepository.get(id): Promise<Result<ReviewData, ReviewNotFoundError | ReviewPersistenceError>>` (`~/domain/review/abstractions/ReviewRepository.js`), `GetTaskUseCase.execute<I, O>(id): Promise<TaskService.Task<I, O> | null>` (`@webiny/background-tasks/api/features/GetTask/index.js`), `TaskDataStatus` and `TaskService.Task` (`@webiny/api-core/features/task/TaskService/index.js`; `Task` has `taskStatus`, `iterations`, optional `startedOn`/`finishedOn`/`output`), `ReviewData`, `ReviewStep`, `ReviewStepRun`, `StepRunOutcome`, `ReviewPermissionViewer` (`~/domain/review/types.js`), `ReviewNotFoundError`, `ReviewPersistenceError` (`~/domain/review/errors.js`), `BaseError`, `Result`, `createAbstraction`, `createFeature` (`@webiny/feature/api`), `STEP_RUN_TASK_DEFINITION_ID` (`~/features/stepRun/constants.js`). Test helpers: `createContextHandler`, `fakeGetTask` (`~tests/__helpers/FakeGetTask.js`), `createFailedAutomationReview`, `createRunningAutomationReview`, `AUTOMATION_STEP_ID` (`~tests/__helpers/stepRunReviews.js`), `expectOk`, `NOW`, `toSaveData`, `requester`, `reviewer`, `createRequestedReview` (`~tests/__helpers/fixtures.js`).
- Produces (matches the contract): `GetReviewStepRunUseCase.execute(input: GetReviewStepRunInput): Promise<Result<ReviewStepRunInfo | null, ReviewNotFoundError | ReviewPersistenceError | ReviewStepRunNotFoundError>>`, namespace `GetReviewStepRunUseCase.Interface`, `.Input`, `.Error`, `.Return`; `GetReviewStepRunInput`; `ReviewStepRunInfo`, `StepRunTaskStatus`; `ReviewStepRunNotFoundError` (code `Workflows/Review/StepRunNotFound`, data `ReviewStepRunNotFoundErrorData { reviewId, stepId, taskId }`); `canViewStepRunByPermission(viewer: ReviewPermissionViewer): boolean`; the `WorkflowsStepRunInfo` GraphQL type; `GetReviewStepRunFeature`. Consumed by Tasks 5 and 6.

**Test runner note:** API package: each test file runs with `yarn test <path>` and then `yarn test:os <path>` (one `test:os` run at a time).

- [ ] **Step 1: Write the failing tests**

Modify `packages/api-workflows/__tests__/__helpers/FakeGetTask.ts`: a way to store a whole task (start time, run count, output) beside `set`.

Before:

```ts
    public reset(): void {
        this.calls.length = 0;
```

After:

```ts
    /** Stores a task as given, for tests that need times, a run count, an input or an output. */
    public put(task: TaskService.Task): void {
        this.tasks.set(task.id, task);
    }

    public reset(): void {
        this.calls.length = 0;
```

Create `packages/api-workflows/__tests__/review/canViewStepRunByPermission.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { canViewStepRunByPermission } from "~/domain/review/canViewStepRunByPermission.js";
import type { Actor, ReviewPermissionViewer } from "~/domain/review/types.js";
import type { WorkflowsPermissionSet } from "~/domain/permissions/types.js";
import { aiActor, requester, reviewer } from "~tests/__helpers/fixtures.js";

const NO_PERMISSIONS: WorkflowsPermissionSet = {
    fullAccess: false,
    editor: false,
    reassign: false
};
const EDITOR: WorkflowsPermissionSet = { fullAccess: false, editor: true, reassign: false };
const REASSIGN: WorkflowsPermissionSet = { fullAccess: false, editor: false, reassign: true };
const BOTH: WorkflowsPermissionSet = { fullAccess: false, editor: true, reassign: true };
const FULL_ACCESS: WorkflowsPermissionSet = { fullAccess: true, editor: true, reassign: true };

const viewerOf = (
    actor: Actor,
    permissions: WorkflowsPermissionSet = NO_PERMISSIONS
): ReviewPermissionViewer => {
    return { actor, permissions };
};

describe("canViewStepRunByPermission (R258, D90)", () => {
    it("allows a viewer with editor, reassign, both or full access", () => {
        expect(canViewStepRunByPermission(viewerOf(reviewer, EDITOR))).toBe(true);
        expect(canViewStepRunByPermission(viewerOf(reviewer, REASSIGN))).toBe(true);
        expect(canViewStepRunByPermission(viewerOf(reviewer, BOTH))).toBe(true);
        expect(canViewStepRunByPermission(viewerOf(reviewer, FULL_ACCESS))).toBe(true);
    });

    it("refuses a viewer without either permission, the requester and an AI actor included", () => {
        expect(canViewStepRunByPermission(viewerOf(reviewer))).toBe(false);
        expect(canViewStepRunByPermission(viewerOf(requester))).toBe(false);
        expect(canViewStepRunByPermission(viewerOf(aiActor))).toBe(false);
    });
});
```

Create `packages/api-workflows/__tests__/stepRun/GetReviewStepRun.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import {
    TaskDataStatus,
    type TaskService
} from "@webiny/api-core/features/task/TaskService/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { fakeGetTask } from "~tests/__helpers/FakeGetTask.js";
import { expectOk, NOW, toSaveData } from "~tests/__helpers/fixtures.js";
import {
    AUTOMATION_STEP_ID,
    createFailedAutomationReview,
    createRunningAutomationReview
} from "~tests/__helpers/stepRunReviews.js";
import type { ReviewData, ReviewStep, ReviewStepRun } from "~/domain/review/types.js";
import type { StepRunTaskStatus } from "~/domain/review/ReviewStepRunInfo.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { GetReviewStepRunUseCase } from "~/features/stepRun/GetReviewStepRun/index.js";
import { STEP_RUN_TASK_DEFINITION_ID } from "~/features/stepRun/constants.js";

const FAILED_REASON = "The automation failed.";
const CURRENT_FINISHED = "2026-10-09T11:00:00.000Z";

/** An earlier attempt of the automation step; its task is `task-0`. */
const EARLIER_RUN: ReviewStepRun = {
    taskId: "task-0",
    startedOn: "2026-10-09T09:00:00.000Z",
    finishedOn: "2026-10-09T09:05:00.000Z",
    outcome: "failed",
    reason: "The automation was aborted."
};

interface TaskParams {
    status?: TaskDataStatus;
    iterations?: number;
    startedOn?: string;
    finishedOn?: string;
    input?: TaskService.Task["input"];
    output?: TaskService.Task["output"];
}

const putTask = (id: string, params: TaskParams = {}): void => {
    const task: TaskService.Task = {
        id,
        name: "Workflow step: Check links",
        definitionId: STEP_RUN_TASK_DEFINITION_ID,
        executionName: "",
        input: params.input ?? { reviewId: "review-1", stepId: AUTOMATION_STEP_ID },
        output: params.output,
        iterations: params.iterations ?? 1,
        taskStatus: params.status ?? TaskDataStatus.FAILED,
        eventResponse: undefined,
        startedOn: params.startedOn,
        finishedOn: params.finishedOn,
        createdOn: NOW,
        savedOn: NOW,
        createdBy: { id: "user-requester", displayName: "Rita Requester", type: "admin" }
    };
    fakeGetTask.put(task);
};

/** Changes the automation step of a review; the other step stays as it is. */
const withAutomationStep = (
    review: ReviewData,
    change: (step: ReviewStep) => ReviewStep
): ReviewData => {
    const steps = review.steps.map(step => {
        if (step.id !== AUTOMATION_STEP_ID) {
            return step;
        }
        return change(step);
    });
    return { ...review, steps };
};

/** review-1: the automation step failed as `task-1`, after the earlier attempt `task-0`. */
const createFailedReviewData = (): ReviewData => {
    const base = toSaveData(createFailedAutomationReview(FAILED_REASON, CURRENT_FINISHED));
    return withAutomationStep(base, step => ({ ...step, runs: [EARLIER_RUN] }));
};

/** review-1: the automation step is running as `task-1`. */
const createRunningReviewData = (): ReviewData => {
    return toSaveData(createRunningAutomationReview("task-1"));
};

const setup = async () => {
    const { context } = await createContextHandler();
    return {
        reviews: context.container.resolve(ReviewRepository),
        getStepRun: context.container.resolve(GetReviewStepRunUseCase)
    };
};

describe("GetReviewStepRunUseCase (R257, A92)", () => {
    beforeEach(() => {
        fakeGetTask.reset();
    });

    it("describes the current attempt of a failed step from the step and the task", async () => {
        const { reviews, getStepRun } = await setup();
        expectOk(await reviews.save(createFailedReviewData()));
        putTask("task-1", { status: TaskDataStatus.FAILED, iterations: 1 });

        const info = expectOk(
            await getStepRun.execute({
                reviewId: "review-1",
                stepId: AUTOMATION_STEP_ID,
                taskId: "task-1"
            })
        );

        expect(info).toEqual({
            taskId: "task-1",
            status: "failed",
            startedOn: NOW,
            finishedOn: CURRENT_FINISHED,
            iterations: 1,
            outcome: "failed",
            reason: FAILED_REASON
        });
        expect(fakeGetTask.calls).toEqual(["task-1"]);
    });

    it("describes an earlier attempt from its run record, preferring the review's times", async () => {
        const { reviews, getStepRun } = await setup();
        expectOk(await reviews.save(createFailedReviewData()));
        putTask("task-0", {
            status: TaskDataStatus.ABORTED,
            startedOn: "2026-10-09T08:59:00.000Z",
            finishedOn: "2026-10-09T09:06:00.000Z"
        });

        const info = expectOk(
            await getStepRun.execute({
                reviewId: "review-1",
                stepId: AUTOMATION_STEP_ID,
                taskId: "task-0"
            })
        );

        expect(info).toEqual({
            taskId: "task-0",
            status: "aborted",
            startedOn: EARLIER_RUN.startedOn,
            finishedOn: EARLIER_RUN.finishedOn,
            iterations: 1,
            outcome: "failed",
            reason: "The automation was aborted."
        });
    });

    it("answers a task id that is not the step's or one of its runs with StepRunNotFound, and never reads the task", async () => {
        const { reviews, getStepRun } = await setup();
        expectOk(await reviews.save(createFailedReviewData()));
        putTask("task-unknown");

        const result = await getStepRun.execute({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            taskId: "task-unknown"
        });

        expect(result.error?.code).toBe("Workflows/Review/StepRunNotFound");
        expect(result.error?.data).toEqual({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            taskId: "task-unknown"
        });
        expect(fakeGetTask.calls).toEqual([]);
    });

    it("answers another review's task id with StepRunNotFound, and never reads the task", async () => {
        const { reviews, getStepRun } = await setup();
        expectOk(await reviews.save(createFailedReviewData()));
        const other = createRunningReviewData();
        expectOk(
            await reviews.save({
                ...withAutomationStep(other, step => ({ ...step, taskId: "task-other" })),
                id: "review-2",
                targetRevisionId: "article-1#0002"
            })
        );
        putTask("task-other", { status: TaskDataStatus.RUNNING });

        const result = await getStepRun.execute({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            taskId: "task-other"
        });

        expect(result.error?.code).toBe("Workflows/Review/StepRunNotFound");
        expect(fakeGetTask.calls).toEqual([]);
    });

    it("answers a step that is not on the review with StepRunNotFound", async () => {
        const { reviews, getStepRun } = await setup();
        expectOk(await reviews.save(createFailedReviewData()));
        putTask("task-1");

        const result = await getStepRun.execute({
            reviewId: "review-1",
            stepId: "step-missing",
            taskId: "task-1"
        });

        expect(result.error?.code).toBe("Workflows/Review/StepRunNotFound");
        expect(result.error?.data).toEqual({
            reviewId: "review-1",
            stepId: "step-missing",
            taskId: "task-1"
        });
        expect(fakeGetTask.calls).toEqual([]);
    });

    it("answers a review that does not exist with NotFound", async () => {
        const { getStepRun } = await setup();

        const result = await getStepRun.execute({
            reviewId: "review-missing",
            stepId: AUTOMATION_STEP_ID,
            taskId: "task-1"
        });

        expect(result.error?.code).toBe("Workflows/Review/NotFound");
        expect(fakeGetTask.calls).toEqual([]);
    });

    it("answers null when the task record is gone", async () => {
        const { reviews, getStepRun } = await setup();
        expectOk(await reviews.save(createFailedReviewData()));

        const result = await getStepRun.execute({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            taskId: "task-1"
        });

        expect(expectOk(result)).toBeNull();
        expect(fakeGetTask.calls).toEqual(["task-1"]);
    });

    it("fails with a persistence error when the task read throws (R87)", async () => {
        const { reviews, getStepRun } = await setup();
        expectOk(await reviews.save(createFailedReviewData()));
        fakeGetTask.failure = new Error("The task store is down.");

        const result = await getStepRun.execute({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            taskId: "task-1"
        });

        expect(result.error?.code).toBe("Workflows/Review/Persistence");
        expect(result.error?.message).toBe("The task store is down.");
    });

    it("never returns the task's raw error, input, output or state (R146)", async () => {
        const { reviews, getStepRun } = await setup();
        expectOk(await reviews.save(createFailedReviewData()));
        putTask("task-1", {
            status: TaskDataStatus.FAILED,
            iterations: 3,
            input: { reviewId: "review-1", stepId: AUTOMATION_STEP_ID, secret: "SECRET-INPUT" },
            output: {
                idWaits: 2,
                state: { secret: "SECRET-STATE" },
                error: { message: "SECRET-RAW-ERROR" }
            }
        });

        const info = expectOk(
            await getStepRun.execute({
                reviewId: "review-1",
                stepId: AUTOMATION_STEP_ID,
                taskId: "task-1"
            })
        );

        expect(info).toEqual({
            taskId: "task-1",
            status: "failed",
            startedOn: NOW,
            finishedOn: CURRENT_FINISHED,
            iterations: 1,
            outcome: "failed",
            reason: FAILED_REASON
        });
        expect(Object.keys(info ?? {}).sort()).toEqual([
            "finishedOn",
            "iterations",
            "outcome",
            "reason",
            "startedOn",
            "status",
            "taskId"
        ]);
        expect(JSON.stringify(info)).not.toContain("SECRET");
    });

    it.each<[TaskDataStatus, StepRunTaskStatus]>([
        [TaskDataStatus.PENDING, "pending"],
        [TaskDataStatus.RUNNING, "running"],
        [TaskDataStatus.SUCCESS, "done"],
        [TaskDataStatus.FAILED, "failed"],
        [TaskDataStatus.ABORTED, "aborted"]
    ])("maps the task status %s to %s", async (taskStatus, expected) => {
        const { reviews, getStepRun } = await setup();
        expectOk(await reviews.save(createFailedReviewData()));
        putTask("task-1", { status: taskStatus });

        const info = expectOk(
            await getStepRun.execute({
                reviewId: "review-1",
                stepId: AUTOMATION_STEP_ID,
                taskId: "task-1"
            })
        );

        expect(info?.status).toBe(expected);
    });

    it.each<[string, number, TaskService.Task["output"], number]>([
        ["no idWaits: one run", 3, undefined, 1],
        ["an output without idWaits: one run", 4, { state: null }, 1],
        ["an idWaits that is not a number: one run", 4, { idWaits: "2" }, 1],
        ["idWaits 2 of 5 iterations", 5, { idWaits: 2 }, 3],
        ["idWaits 0 of 1 iteration", 1, { idWaits: 0 }, 1],
        ["more waits than iterations: never below 0", 3, { idWaits: 5 }, 0]
    ])("counts the runs the way the task handler does: %s", async (_name, iterations, output, expected) => {
        const { reviews, getStepRun } = await setup();
        expectOk(await reviews.save(createFailedReviewData()));
        putTask("task-1", { iterations, output });

        const info = expectOk(
            await getStepRun.execute({
                reviewId: "review-1",
                stepId: AUTOMATION_STEP_ID,
                taskId: "task-1"
            })
        );

        expect(info?.iterations).toBe(expected);
    });

    it.each<[string, "approved" | "rejected", string]>([
        ["an approved step", "approved", "approved"],
        ["a rejected step", "rejected", "rejected"]
    ])("gives %s the outcome and no reason, whatever its comment says", async (_name, state, outcome) => {
        const { reviews, getStepRun } = await setup();
        const decided = withAutomationStep(createRunningReviewData(), step => ({
            ...step,
            state,
            comment: "Kept comment.",
            finishedOn: CURRENT_FINISHED
        }));
        expectOk(await reviews.save(decided));
        putTask("task-1", { status: TaskDataStatus.SUCCESS });

        const info = expectOk(
            await getStepRun.execute({
                reviewId: "review-1",
                stepId: AUTOMATION_STEP_ID,
                taskId: "task-1"
            })
        );

        expect(info).toMatchObject({ status: "done", outcome, reason: null });
    });

    it("gives a running step no outcome and no reason, and no end time", async () => {
        const { reviews, getStepRun } = await setup();
        expectOk(await reviews.save(createRunningReviewData()));
        putTask("task-1", { status: TaskDataStatus.RUNNING });

        const info = expectOk(
            await getStepRun.execute({
                reviewId: "review-1",
                stepId: AUTOMATION_STEP_ID,
                taskId: "task-1"
            })
        );

        expect(info).toEqual({
            taskId: "task-1",
            status: "running",
            startedOn: NOW,
            finishedOn: null,
            iterations: 1,
            outcome: null,
            reason: null
        });
    });

    it("falls back to the task's times when the review has none, and to null when neither has", async () => {
        const { reviews, getStepRun } = await setup();
        const untimed = withAutomationStep(createRunningReviewData(), step => ({
            ...step,
            startedOn: null,
            finishedOn: null
        }));
        expectOk(await reviews.save(untimed));
        putTask("task-1", {
            status: TaskDataStatus.RUNNING,
            startedOn: "2026-10-09T10:00:05.000Z",
            finishedOn: "2026-10-09T10:30:00.000Z"
        });

        const withTaskTimes = expectOk(
            await getStepRun.execute({
                reviewId: "review-1",
                stepId: AUTOMATION_STEP_ID,
                taskId: "task-1"
            })
        );
        putTask("task-1", { status: TaskDataStatus.RUNNING });
        const withoutTimes = expectOk(
            await getStepRun.execute({
                reviewId: "review-1",
                stepId: AUTOMATION_STEP_ID,
                taskId: "task-1"
            })
        );

        expect(withTaskTimes).toMatchObject({
            startedOn: "2026-10-09T10:00:05.000Z",
            finishedOn: "2026-10-09T10:30:00.000Z"
        });
        expect(withoutTimes).toMatchObject({ startedOn: null, finishedOn: null });
    });
});
```

Modify `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts` (the shared types test): the new type, in field order.

Before:

```ts
        expect(memberNames(types, "WorkflowsAiIssue")).toEqual([
```

After:

```ts
        expect(memberNames(types, "WorkflowsStepRunInfo")).toEqual([
            "taskId",
            "status",
            "startedOn",
            "finishedOn",
            "iterations",
            "outcome",
            "reason"
        ]);
        expect(memberNames(types, "WorkflowsAiIssue")).toEqual([
```

Modify `packages/api-workflows/__tests__/registration.test.ts`.

Before:

```ts
import { GetReviewUseCase } from "~/features/review/GetReview/index.js";
```

After:

```ts
import { GetReviewUseCase } from "~/features/review/GetReview/index.js";
import { GetReviewStepRunUseCase } from "~/features/stepRun/GetReviewStepRun/index.js";
```

Before:

```ts
        expect(container.resolveAll(GetReviewUseCase)).toHaveLength(1);
        expect(container.resolveAll(StuckStepService)).toHaveLength(1);
```

After:

```ts
        expect(container.resolveAll(GetReviewUseCase)).toHaveLength(1);
        expect(container.resolveAll(GetReviewStepRunUseCase)).toHaveLength(1);
        expect(container.resolveAll(StuckStepService)).toHaveLength(1);
```

- [ ] **Step 2: Run the tests to see them fail**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/stepRun/GetReviewStepRun.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/review/canViewStepRunByPermission.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL. The first two fail to load their imports (`~/features/stepRun/GetReviewStepRun/index.js` and `~/domain/review/canViewStepRunByPermission.js` do not exist); the schema test fails because `WorkflowsStepRunInfo` has no members (`expected [] to deeply equal [...]`); the registration test fails to load its new import.

- [ ] **Step 3: Implement**

Create `packages/api-workflows/src/domain/review/ReviewStepRunInfo.ts`:

```ts
import type { StepRunOutcome } from "./types.js";

/** How the background task of a step attempt stands, in workflows' own words (R257). */
export type StepRunTaskStatus = "pending" | "running" | "done" | "failed" | "aborted";

/**
 * What workflows shows about one attempt of an AI or automation step (R257, D161): enough to tell
 * whether it went wrong or ok, and nothing else. Never the task's input, output or logs, and
 * never a raw error (R146): `reason` is the fixed text the review stored.
 */
export interface ReviewStepRunInfo {
    taskId: string;
    status: StepRunTaskStatus;
    startedOn: string | null;
    finishedOn: string | null;
    /** How many times the step's runner ran; the waits for the task id are not counted. */
    iterations: number;
    outcome: StepRunOutcome | null;
    reason: string | null;
}
```

Create `packages/api-workflows/src/domain/review/canViewStepRunByPermission.ts`:

```ts
import type { ReviewPermissionViewer } from "./types.js";

/**
 * Who may read the background task of a step attempt (R258, D90): a viewer with `editor` or
 * `reassign` (full access sets both). Permission only: the app wrappers combine it with read
 * access to the review's target.
 */
export const canViewStepRunByPermission = (viewer: ReviewPermissionViewer): boolean => {
    return viewer.permissions.editor || viewer.permissions.reassign;
};
```

Modify `packages/api-workflows/src/domain/review/errors.ts`: add the error after `ReviewStepNotCurrentError`.

Before:

```ts
export interface ReviewStepErrorData {
    reviewId: string;
    stepId: string;
}
```

After:

```ts
export interface ReviewStepRunNotFoundErrorData {
    reviewId: string;
    stepId: string;
    taskId: string;
}

/**
 * The step has no attempt with this task id (R257): the step is not on the review, or the task id
 * is neither the step's current task nor one of its earlier runs. Keeps the step run read from
 * opening arbitrary background tasks.
 */
export class ReviewStepRunNotFoundError extends BaseError<ReviewStepRunNotFoundErrorData> {
    override readonly code = "Workflows/Review/StepRunNotFound" as const;

    constructor(data: ReviewStepRunNotFoundErrorData) {
        super({
            message: `Step "${data.stepId}" of review "${data.reviewId}" has no run with task "${data.taskId}".`,
            data
        });
    }
}

export interface ReviewStepErrorData {
    reviewId: string;
    stepId: string;
}
```

Create `packages/api-workflows/src/features/stepRun/GetReviewStepRun/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewStepRunInfo } from "~/domain/review/ReviewStepRunInfo.js";
import type {
    ReviewNotFoundError,
    ReviewPersistenceError,
    ReviewStepRunNotFoundError
} from "~/domain/review/errors.js";

export interface GetReviewStepRunInput {
    reviewId: string;
    stepId: string;
    /** The step's current task id or the task id of one of its earlier runs. */
    taskId: string;
}

export interface IGetReviewStepRunUseCaseErrors {
    notFound: ReviewNotFoundError;
    persistence: ReviewPersistenceError;
    stepRunNotFound: ReviewStepRunNotFoundError;
}

type UseCaseError = IGetReviewStepRunUseCaseErrors[keyof IGetReviewStepRunUseCaseErrors];

export interface IGetReviewStepRunUseCase {
    execute(input: GetReviewStepRunInput): Promise<Result<ReviewStepRunInfo | null, UseCaseError>>;
}

/**
 * The background task of one attempt of an AI or automation step, as workflows shows it (R257,
 * D161). Internal (D132): no permission check; the app wrapper checks read access to the target
 * and `editor` or `reassign` (`canViewStepRunByPermission`). Only task ids of the step are read,
 * `null` means the task record is gone, and only the fields of `ReviewStepRunInfo` leave.
 */
export const GetReviewStepRunUseCase =
    createAbstraction<IGetReviewStepRunUseCase>("GetReviewStepRunUseCase");

export namespace GetReviewStepRunUseCase {
    export type Interface = IGetReviewStepRunUseCase;
    export type Input = GetReviewStepRunInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewStepRunInfo | null, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/stepRun/GetReviewStepRun/toReviewStepRunInfo.ts`:

```ts
import {
    TaskDataStatus,
    type TaskService
} from "@webiny/api-core/features/task/TaskService/index.js";
import type { ReviewStepRunInfo, StepRunTaskStatus } from "~/domain/review/ReviewStepRunInfo.js";
import type { ReviewStep, ReviewStepRun, StepRunOutcome } from "~/domain/review/types.js";

export interface ToReviewStepRunInfoParams {
    step: ReviewStep;
    /** The step's current task id or the task id of one of its earlier runs. */
    taskId: string;
    task: TaskService.Task;
}

/** What the review knows about one attempt: its times, its outcome and its fixed reason. */
interface StepRunAttempt {
    startedOn: string | null;
    finishedOn: string | null;
    outcome: StepRunOutcome | null;
    reason: string | null;
}

const STATUS_BY_TASK_STATUS: Record<TaskDataStatus, StepRunTaskStatus> = {
    [TaskDataStatus.PENDING]: "pending",
    [TaskDataStatus.RUNNING]: "running",
    [TaskDataStatus.SUCCESS]: "done",
    [TaskDataStatus.FAILED]: "failed",
    [TaskDataStatus.ABORTED]: "aborted"
};

/** The current attempt reads its outcome from the step's state (R257). */
const getCurrentAttempt = (step: ReviewStep): StepRunAttempt => {
    const attempt: StepRunAttempt = {
        startedOn: step.startedOn,
        finishedOn: step.finishedOn,
        outcome: null,
        reason: null
    };
    if (step.state === "failed") {
        attempt.outcome = "failed";
        attempt.reason = step.comment;
    }
    if (step.state === "approved") {
        attempt.outcome = "approved";
    }
    if (step.state === "rejected") {
        attempt.outcome = "rejected";
    }
    return attempt;
};

const getEarlierAttempt = (run: ReviewStepRun): StepRunAttempt => {
    return {
        startedOn: run.startedOn,
        finishedOn: run.finishedOn,
        outcome: run.outcome,
        reason: run.reason
    };
};

/**
 * The run count of the automation itself, computed as `WorkflowStepRunTaskHandler` does: the
 * task's `iterations` also count the waits for the task id (`output.idWaits`, which defaults to
 * `iterations - 1` when it was never stored), and those are not runs.
 */
const getRunCount = (task: TaskService.Task): number => {
    const storedWaits = task.output?.idWaits;
    const idWaits = typeof storedWaits === "number" ? storedWaits : task.iterations - 1;
    return Math.max(0, task.iterations - idWaits);
};

/**
 * Builds the step run info of one attempt (R257) from the review's step and the task. `outcome`
 * and `reason` come from the review, never from the task (R146); times prefer the review's record
 * and fall back to the task's. Nothing else of the task is read.
 */
export const toReviewStepRunInfo = (params: ToReviewStepRunInfoParams): ReviewStepRunInfo => {
    const { step, taskId, task } = params;
    const earlier = step.runs.find(run => run.taskId === taskId);

    let attempt = getCurrentAttempt(step);
    if (step.taskId !== taskId && earlier) {
        attempt = getEarlierAttempt(earlier);
    }

    return {
        taskId,
        status: STATUS_BY_TASK_STATUS[task.taskStatus],
        startedOn: attempt.startedOn ?? task.startedOn ?? null,
        finishedOn: attempt.finishedOn ?? task.finishedOn ?? null,
        iterations: getRunCount(task),
        outcome: attempt.outcome,
        reason: attempt.reason
    };
};
```

Create `packages/api-workflows/src/features/stepRun/GetReviewStepRun/GetReviewStepRunUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewPersistenceError, ReviewStepRunNotFoundError } from "~/domain/review/errors.js";
import { GetReviewStepRunUseCase as UseCase } from "./abstractions.js";
import { toReviewStepRunInfo } from "./toReviewStepRunInfo.js";

class GetReviewStepRunUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private getTask: GetTaskUseCase.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const loaded = await this.repository.get(input.reviewId);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }

        // Only the step's own task ids are read: its current task or one of its earlier runs.
        // Any other id, another step's or another review's, is refused before the task is read.
        const step = loaded.value.steps.find(item => item.id === input.stepId);
        const isCurrent = step?.taskId === input.taskId;
        const isEarlier = step?.runs.some(run => run.taskId === input.taskId);
        if (!step || !(isCurrent || isEarlier)) {
            return Result.fail(
                new ReviewStepRunNotFoundError({
                    reviewId: input.reviewId,
                    stepId: input.stepId,
                    taskId: input.taskId
                })
            );
        }

        let task: Awaited<GetTaskUseCase.Return>;
        try {
            task = await this.getTask.execute(input.taskId);
        } catch (error) {
            const cause = error instanceof Error ? error : new Error(String(error));
            return Result.fail(new ReviewPersistenceError(cause));
        }
        if (!task) {
            return Result.ok(null);
        }

        const info = toReviewStepRunInfo({ step, taskId: input.taskId, task });
        return Result.ok(info);
    }
}

export const GetReviewStepRunUseCase = UseCase.createImplementation({
    implementation: GetReviewStepRunUseCaseImpl,
    dependencies: [ReviewRepository, GetTaskUseCase]
});
```

Create `packages/api-workflows/src/features/stepRun/GetReviewStepRun/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { GetReviewStepRunUseCase } from "./GetReviewStepRunUseCase.js";

export const GetReviewStepRunFeature = createFeature({
    name: "Workflows/GetReviewStepRun",
    register(container) {
        container.register(GetReviewStepRunUseCase);
    }
});
```

Create `packages/api-workflows/src/features/stepRun/GetReviewStepRun/index.ts`:

```ts
export { GetReviewStepRunUseCase } from "./abstractions.js";
export type { GetReviewStepRunInput } from "./abstractions.js";
```

Modify `packages/api-workflows/src/WorkflowsFeature.ts`.

Before:

```ts
import { StepRunReachServiceFeature } from "~/features/stepRun/StepRunReachService/feature.js";
```

After:

```ts
import { StepRunReachServiceFeature } from "~/features/stepRun/StepRunReachService/feature.js";
import { GetReviewStepRunFeature } from "~/features/stepRun/GetReviewStepRun/feature.js";
```

Before:

```ts
        // The private task that runs a workflow step (R142)
        WorkflowStepRunTaskFeature.register(container);
```

After:

```ts
        // The private task that runs a workflow step (R142)
        WorkflowStepRunTaskFeature.register(container);
        // Reading the kept task of one step attempt for the app wrappers (R257, D161)
        GetReviewStepRunFeature.register(container);
```

Modify `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`: add the shared type right after `WorkflowsStepRun`.

Before:

```graphql
        "approved, rejected or failed."
        outcome: String
        reason: String
    }

    type WorkflowsAiIssue {
```

After:

```graphql
        "approved, rejected or failed."
        outcome: String
        reason: String
    }

    "The background task of one step attempt as workflows shows it (R257): never the task's input, output or logs."
    type WorkflowsStepRunInfo {
        taskId: ID!
        "pending, running, done, failed or aborted."
        status: String!
        startedOn: DateTime
        finishedOn: DateTime
        "How many times the step's runner ran; the waits for the task id are not counted."
        iterations: Int!
        "approved, rejected or failed; null while the attempt runs."
        outcome: String
        "The fixed failure text of a failed attempt (R146); null otherwise."
        reason: String
    }

    type WorkflowsAiIssue {
```

(Checked in the consistency pass: the `before` block is unique in the file (`"approved, rejected or failed."` occurs once). `WorkflowsStepRun` ends with `outcome` and `reason` fields, as read for this plan at lines 236-244, and the next type is `WorkflowsAiIssue`.)

- [ ] **Step 4: Run the tests to see them pass**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/stepRun/GetReviewStepRun.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/review/canViewStepRunByPermission.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS for each.

Run the same four with `yarn test:os` (one at a time).
Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

`FakeGetTask` is shared, so run the tests that use it:
`yarn test packages/api-workflows/__tests__/stepRun/StuckStepService.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/graphql/workflowsSchemaLicense.test.ts 2>&1 | tail -50`
and the same two with `yarn test:os`.
Expected: PASS.

Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40`
Expected: no errors. (If `task.output?.idWaits` does not type-check because of the `IResponseError` branch of `ITaskOutput`, read it through `const output: Record<string, unknown> | undefined = task.output;` first. If `TaskService.Task["input"]` rejects the `secret` field in the test, widen the test's `input` to `Record<string, unknown>`.)

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain of phase 8a (`docs/.bruno/plans/2026-10-16-workflows-phase-8a/00-shared.md`) in full: `git add .`, `yarn > /dev/null 2>&1`, `node scripts/generateTsConfigsInPackages.js`, `yarn adio`, `yarn check-ts-configs`, `yarn format:fix > /dev/null 2>&1`, `yarn lint:fix`, `yarn webiny sync-dependencies`, `yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30` (Tasks 5 and 6 import the new exports from the built package, so it must build), `git add .`. Restore `.gitleaks.toml` (`git checkout -- .gitleaks.toml`); never commit it, `docs/.reports` or `.superpowers`. If any step fails and you fix something, rerun the chain from the start. Then commit:

```
git commit -m "feat(api-workflows): add the step run read use case" -m "GetReviewStepRunUseCase reads the background task of one attempt of a step and returns only its status, times, run count, outcome and fixed reason. canViewStepRunByPermission gates it for editor and reassign." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

## Contract notes

- The contract's file list for Task 4 does not name `toReviewStepRunInfo.ts`. The mapping from the step and the task to `ReviewStepRunInfo` is a pure function with its own rules (status map, run count, outcome and times), so under "one public function per file" it gets its own file in the use case folder (`GetReviewStepRun/toReviewStepRunInfo.ts`); it is internal and not exported from `index.ts`.
- R257 says "`outcome` and `reason` come from the review step: the `runs[]` record of that `taskId`, or, for the current attempt, the step's state". The plan checks the current attempt first (`step.taskId === taskId`) and the `runs[]` record otherwise; a task id is never both, because a restart moves the failed attempt into `runs` and gives the step a new task id.
- A step that is not on the review is also `Workflows/Review/StepRunNotFound` (the contract names only the task-id cases); the data carries the requested `stepId`.
- The iterations formula is R257's as corrected by contract review 2 (N-1): `task.iterations - (idWaits stored as a number ? idWaits : task.iterations - 1)`, floored at 0.
- A92 ("Task 4 proves both"): the `null` half is proved by the fake test; the no-permission half by the source read of `crud.tasks.ts` `getTask` (`identityContext.withoutAuthorization`), which no test asserts.
