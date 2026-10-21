import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { ReviewData, ReviewStep } from "@webiny/api-workflows/domain/review/types.js";
import { ReviewRepository } from "@webiny/api-workflows/domain/review/abstractions/ReviewRepository.js";
import { AssignmentRepository } from "@webiny/api-workflows/domain/assignment/abstractions/AssignmentRepository.js";
import { getAutomationActor } from "@webiny/api-workflows/domain/automation/getAutomationActor.js";
import { expectOk } from "./entries.js";
import { STEP_ID } from "./engine.js";
import { REQUESTER } from "./identities.js";
import { TEST_AUTOMATION_ID } from "./TestAutomationDefinition.js";

export const SKIP_RECORD_REASON = "The requester cannot review their own content.";

export type FailedStepType = "ai" | "automation";

/**
 * Seeds a failed AI (default) or automation step directly in storage, for tests that need a
 * review already in `failed`, such as the restart tests.
 */
export const seedFailedStep = async (
    context: CmsContext,
    review: ReviewData,
    type: FailedStepType = "ai"
): Promise<ReviewData> => {
    const failed: ReviewData = {
        ...review,
        currentStepState: "failed",
        currentStepType: type,
        steps: review.steps.map((step): ReviewStep => {
            return { ...step, type, state: "failed" };
        })
    };
    return expectOk(await context.container.resolve(ReviewRepository).update(failed));
};

export const FAILED_REASON = "The automation failed.";

/**
 * Stores the review with its only step failed as an automation step that ran once as `task-old`,
 * straight through the repository: what a failed run leaves behind (R140, R146). Restarting it
 * re-reaches the registered test automation as the requester.
 */
export const seedFailedAutomationStep = async (
    context: CmsContext,
    review: ReviewData,
    reason: string = FAILED_REASON
): Promise<ReviewData> => {
    const owner = getAutomationActor(review.createdBy);
    const failed: ReviewData = {
        ...review,
        currentStepState: "failed",
        currentStepType: "automation",
        currentOwnerId: owner.id,
        steps: review.steps.map((step): ReviewStep => {
            return {
                ...step,
                type: "automation",
                config: { automationId: TEST_AUTOMATION_ID, settings: { mode: "approve" } },
                state: "failed",
                owner,
                comment: reason,
                taskId: "task-old",
                reachedOn: "2026-10-13T10:00:00.000Z",
                startedOn: "2026-10-13T10:00:00.000Z",
                finishedOn: "2026-10-13T10:01:00.000Z"
            };
        })
    };
    return expectOk(await context.container.resolve(ReviewRepository).update(failed));
};

/**
 * Replaces the log of the only step with two known records: an outcome (the pool) and, a minute
 * later, a skip of the requester. Newest first, the skip comes first. The record the request
 * wrote when the step was reached (R117) is removed first.
 */
export const seedAssignmentRecords = async (
    context: CmsContext,
    review: ReviewData
): Promise<void> => {
    const repository = context.container.resolve(AssignmentRepository);
    const written = expectOk(await repository.list({ where: { reviewId: review.id } }));
    for (const record of written.items) {
        expectOk(await repository.delete(record.id));
    }
    expectOk(
        await repository.create({
            reviewId: review.id,
            workflowId: review.workflowId,
            stepId: STEP_ID,
            userId: null,
            assignedOn: "2026-10-13T10:00:00.000Z",
            source: "pool",
            ruleId: null,
            by: null,
            reason: null,
            kind: "outcome"
        })
    );
    expectOk(
        await repository.create({
            reviewId: review.id,
            workflowId: review.workflowId,
            stepId: STEP_ID,
            userId: REQUESTER.id,
            assignedOn: "2026-10-13T10:01:00.000Z",
            source: "roundRobin",
            ruleId: null,
            by: null,
            reason: SKIP_RECORD_REASON,
            kind: "skip"
        })
    );
};

export interface SeededReviewTarget {
    id: string;
    model: string;
    targetId: string;
    targetRevisionId: string;
}

/**
 * Stores a copy of the review under another id, namespace and target, straight through the
 * repository. Reaches a state the engine refuses to create: a review on a model a workflow
 * cannot be bound to.
 */
export const seedReviewOnTarget = async (
    context: CmsContext,
    review: ReviewData,
    target: SeededReviewTarget
): Promise<ReviewData> => {
    return expectOk(
        await context.container.resolve(ReviewRepository).create({ ...review, ...target })
    );
};
