import { Review } from "~/domain/review/Review.js";
import { getAutomationActor } from "~/domain/automation/getAutomationActor.js";
import { createAutomationStep } from "./TestAutomationDefinition.js";
import type { Workflow } from "~/domain/workflow/types.js";
import {
    ARTICLE_MODEL,
    createReviewStep,
    createWorkflow,
    expectOk,
    NOW,
    requester,
    targetContext
} from "./fixtures.js";

export const AUTOMATION_STEP_ID = "automation";

/** The owner of an automation step: the requester's id, type `automation` (R141). */
export const automationActor = getAutomationActor(requester);

/** An automation step ("automation") followed by the review step "editorial". */
export const createAutomationWorkflow = (): Workflow => {
    return createWorkflow({
        steps: [
            createAutomationStep({ id: AUTOMATION_STEP_ID, title: "Check links" }),
            createReviewStep({ id: "editorial", title: "Editorial review" })
        ]
    });
};

/** Requested, nothing reached: the automation step is `pending`. The `requested` fact stays. */
export const createPendingAutomationReview = (): Review => {
    return expectOk(
        Review.request({
            id: "review-1",
            workflow: createAutomationWorkflow(),
            model: ARTICLE_MODEL,
            targetId: "article-1",
            targetRevisionId: "article-1#0001",
            title: "Article 1",
            targetContext,
            picks: [],
            requester,
            now: NOW
        })
    );
};

/** The automation step reached with `taskId` and `inReview`. Facts are cleared. */
export const createRunningAutomationReview = (taskId: string | null = "task-1"): Review => {
    const review = createPendingAutomationReview();
    expectOk(review.reachRun({ actor: requester, owner: automationActor, taskId, now: NOW }));
    review.pullFacts();
    return review;
};

/** The running automation step failed at `now`. Facts are cleared. */
export const createFailedAutomationReview = (
    reason = "The automation failed: boom.",
    now = "2026-10-09T11:00:00.000Z"
): Review => {
    const review = createRunningAutomationReview();
    expectOk(review.fail({ stepId: AUTOMATION_STEP_ID, reason, now }));
    review.pullFacts();
    return review;
};
