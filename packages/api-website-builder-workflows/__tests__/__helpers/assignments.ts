import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { AssignmentRecord } from "@webiny/api-workflows/domain/assignment/types.js";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import { AssignmentRepository } from "@webiny/api-workflows/domain/assignment/abstractions/AssignmentRepository.js";
import { expectOk } from "./pages.js";
import { STEP_ID } from "./engine.js";
import { REVIEWER } from "./identities.js";

export interface SeededAssignments {
    /** Pool fall-through, newest (10:00). */
    outcome: AssignmentRecord;
    /** REVIEWER's excluded pick, older (09:00). */
    skip: AssignmentRecord;
}

/**
 * Two assignment-log records of the review's only step, written straight to the repository:
 * nothing writes the log before phase 4 (A44).
 */
export const seedAssignments = async (
    context: CmsContext,
    review: ReviewData
): Promise<SeededAssignments> => {
    const repository = context.container.resolve(AssignmentRepository);
    const outcome = expectOk(
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
    const skip = expectOk(
        await repository.create({
            reviewId: review.id,
            workflowId: review.workflowId,
            stepId: STEP_ID,
            userId: REVIEWER.id,
            assignedOn: "2026-10-13T09:00:00.000Z",
            source: "picked",
            by: null,
            reason: "pick excluded",
            kind: "skip"
        })
    );
    return { outcome, skip };
};
