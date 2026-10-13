import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { ReviewData, ReviewStep } from "@webiny/api-workflows/domain/review/types.js";
import { ReviewRepository } from "@webiny/api-workflows/domain/review/abstractions/ReviewRepository.js";
import { AssignmentRepository } from "@webiny/api-workflows/domain/assignment/abstractions/AssignmentRepository.js";
import { expectOk } from "./entries.js";
import { STEP_ID } from "./engine.js";
import { REQUESTER } from "./identities.js";

export const SKIP_RECORD_REASON = "The requester cannot review their own content.";

/**
 * Stores the review with its only step failed as an AI step, straight through the repository
 * (nothing produces `failed` before phase 5, R93).
 */
export const seedFailedStep = async (
    context: CmsContext,
    review: ReviewData
): Promise<ReviewData> => {
    const failed: ReviewData = {
        ...review,
        currentStepState: "failed",
        currentStepType: "ai",
        steps: review.steps.map((step): ReviewStep => {
            return { ...step, type: "ai", state: "failed" };
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
