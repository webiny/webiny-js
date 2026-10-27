import type { ReviewData } from "~/domain/review/types.js";
import type { AssignmentRecordValues } from "~/domain/assignment/types.js";
import { createStartedReview, reviewer, toSaveData } from "./fixtures.js";

/**
 * An active review of `model` whose first step is in review, owned by `ownerId`. Store it with
 * `ReviewRepository.save` to give that user load (R115).
 */
export const inReviewData = (id: string, ownerId: string, model: string): ReviewData => {
    const data = toSaveData(createStartedReview({ id, targetRevisionId: `${id}#0001` }));
    return {
        ...data,
        model,
        currentOwnerId: ownerId,
        steps: data.steps.map((step, index) => {
            return index === 0 ? { ...step, owner: { ...reviewer, id: ownerId } } : step;
        })
    };
};

/** A pool outcome of "workflow-1" / "legal" at 10:00, with the given fields replaced. */
export const assignmentRecord = (
    overrides: Partial<AssignmentRecordValues> = {}
): AssignmentRecordValues => {
    return {
        reviewId: "review-1",
        workflowId: "workflow-1",
        stepId: "legal",
        userId: null,
        assignedOn: "2026-10-09T10:00:00.000Z",
        source: "pool",
        ruleId: null,
        by: null,
        reason: null,
        kind: "outcome",
        ...overrides
    };
};
