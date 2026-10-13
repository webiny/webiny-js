import type { ReviewData } from "~/domain/review/types.js";
import type { AssignmentRecord, ReviewWithAssignments } from "./types.js";

/**
 * The review with each step's assignment-log entries (D127, R96). Pure. Records of other reviews
 * or unknown steps are ignored; the order of `records` is kept per step (newest first when they
 * come from `ListReviewAssignmentsUseCase`). Redact before attaching.
 */
export const attachAssignmentRecords = (
    review: ReviewData,
    records: AssignmentRecord[]
): ReviewWithAssignments => {
    const own = records.filter(record => record.reviewId === review.id);
    return {
        ...review,
        steps: review.steps.map(step => ({
            ...step,
            assignments: own.filter(record => record.stepId === step.id)
        }))
    };
};
