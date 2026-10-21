import { beforeEach, describe, expect, it } from "vitest";
import { hasErrorSource } from "~/domain/hasErrorSource.js";
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
        expectOk(await reviews.create(createFailedReviewData()));
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
        expectOk(await reviews.create(createFailedReviewData()));
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
        expectOk(await reviews.create(createFailedReviewData()));
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
        expectOk(await reviews.create(createFailedReviewData()));
        const other = createRunningReviewData();
        expectOk(
            await reviews.create({
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
        expectOk(await reviews.create(createFailedReviewData()));
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
        expectOk(await reviews.create(createFailedReviewData()));

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
        expectOk(await reviews.create(createFailedReviewData()));
        fakeGetTask.failure = new Error("The task store is down.");

        const result = await getStepRun.execute({
            reviewId: "review-1",
            stepId: AUTOMATION_STEP_ID,
            taskId: "task-1"
        });

        expect(result.error?.code).toBe("Workflows/Review/Persistence");
        expect(hasErrorSource(result.error) && result.error.source.message).toBe(
            "The task store is down."
        );
    });

    it("never returns the task's raw error, input, output or state (R146)", async () => {
        const { reviews, getStepRun } = await setup();
        expectOk(await reviews.create(createFailedReviewData()));
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
        expectOk(await reviews.create(createFailedReviewData()));
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
    ])(
        "counts the runs the way the task handler does: %s",
        async (_name, iterations, output, expected) => {
            const { reviews, getStepRun } = await setup();
            expectOk(await reviews.create(createFailedReviewData()));
            putTask("task-1", { iterations, output });

            const info = expectOk(
                await getStepRun.execute({
                    reviewId: "review-1",
                    stepId: AUTOMATION_STEP_ID,
                    taskId: "task-1"
                })
            );

            expect(info?.iterations).toBe(expected);
        }
    );

    it.each<[string, "approved" | "rejected", string]>([
        ["an approved step", "approved", "approved"],
        ["a rejected step", "rejected", "rejected"]
    ])(
        "gives %s the outcome and no reason, whatever its comment says",
        async (_name, state, outcome) => {
            const { reviews, getStepRun } = await setup();
            const decided = withAutomationStep(createRunningReviewData(), step => ({
                ...step,
                state,
                comment: "Kept comment.",
                finishedOn: CURRENT_FINISHED
            }));
            expectOk(await reviews.create(decided));
            putTask("task-1", { status: TaskDataStatus.SUCCESS });

            const info = expectOk(
                await getStepRun.execute({
                    reviewId: "review-1",
                    stepId: AUTOMATION_STEP_ID,
                    taskId: "task-1"
                })
            );

            expect(info).toMatchObject({ status: "done", outcome, reason: null });
        }
    );

    it("gives a running step no outcome and no reason, and no end time", async () => {
        const { reviews, getStepRun } = await setup();
        expectOk(await reviews.create(createRunningReviewData()));
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
        expectOk(await reviews.create(untimed));
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
