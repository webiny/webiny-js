import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { ReviewData, ReviewStep } from "@webiny/api-workflows/domain/review/types.js";
import { ReviewRepository } from "@webiny/api-workflows/domain/review/abstractions/ReviewRepository.js";
import { AssignmentRepository } from "@webiny/api-workflows/domain/assignment/abstractions/AssignmentRepository.js";
import { expectOk } from "./entries.js";
import { STEP_ID } from "./engine.js";
import { REQUESTER } from "./identities.js";

export const SKIP_RECORD_REASON = "The requester cannot review their own content.";

export type FailedStepType = "ai" | "automation";

/**
 * Stores the review with its only step failed as an AI (default) or automation step, straight
 * through the repository (nothing produces `failed` before phase 5, R93).
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
    return expectOk(await context.container.resolve(ReviewRepository).save(failed));
};

/**
 * Two assignment records of the only step (A44): an outcome (the pool) and, a minute later, a
 * skip of the requester. Newest first, the skip comes first.
 */
export const seedAssignmentRecords = async (
    context: CmsContext,
    review: ReviewData
): Promise<void> => {
    const repository = context.container.resolve(AssignmentRepository);
    expectOk(
        await repository.create({
            reviewId: review.id,
            workflowId: review.workflowId,
            stepId: STEP_ID,
            userId: null,
            assignedOn: "2026-10-13T10:00:00.000Z",
            source: "pool",
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
            source: "strategy",
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
        await context.container.resolve(ReviewRepository).save({ ...review, ...target })
    );
};
