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
