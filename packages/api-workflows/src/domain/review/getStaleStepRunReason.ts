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
    // Contract: a task's `createdBy` is the identity active when it was triggered.
    // `AutomationStepType.reach` triggers inside `withIdentity(requester)`, so for a genuine step
    // run task it is the review's requester. Pinned by background-tasks `crud/trigger.test.ts`.
    if (task.createdById !== review.createdBy.id) {
        return "The task was not created by the requester.";
    }
    return null;
};
