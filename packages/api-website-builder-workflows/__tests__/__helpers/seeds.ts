import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { ReviewData, ReviewStep } from "@webiny/api-workflows/domain/review/types.js";
import { ReviewRepository } from "@webiny/api-workflows/domain/review/abstractions/ReviewRepository.js";
import { getAutomationActor } from "@webiny/api-workflows/domain/automation/getAutomationActor.js";
import { expectOk } from "./pages.js";
import { TEST_AUTOMATION_ID } from "./TestAutomationDefinition.js";

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
    return expectOk(await context.container.resolve(ReviewRepository).save(failed));
};

/** The same review with its step `rejected`: the state the engine refuses to restart (R140). */
export const seedRejectedStep = async (
    context: CmsContext,
    review: ReviewData
): Promise<ReviewData> => {
    return expectOk(
        await context.container.resolve(ReviewRepository).save({
            ...review,
            currentStepState: "rejected",
            steps: review.steps.map((step): ReviewStep => ({ ...step, state: "rejected" }))
        })
    );
};
