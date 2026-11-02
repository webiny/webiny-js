import type { ReviewData } from "~/domain/review/types.js";
import type { Workflow } from "~/domain/workflow/types.js";
import { createReviewStep, createStartedReview, createWorkflow } from "./fixtures.js";

/** The channels of the two steps differ, so a handler that picks the wrong step is caught (D103). */
export const LEGAL_CHANNEL = "channel-legal";
export const EDITORIAL_CHANNEL = "channel-editorial";

/** "Legal review" notifies through `channel-legal`, "Editorial review" through `channel-editorial`. */
const createNotificationWorkflow = (): Workflow => {
    return createWorkflow({
        steps: [
            {
                ...createReviewStep({ id: "legal", title: "Legal review", allowManualPick: true }),
                notifications: [{ id: LEGAL_CHANNEL }]
            },
            {
                ...createReviewStep({ id: "editorial", title: "Editorial review" }),
                notifications: [{ id: EDITORIAL_CHANNEL }]
            }
        ]
    });
};

/**
 * "Article 1" requested by Rita Requester; "Legal review" is `inReview`, owned by Rob Reviewer
 * (`reviewer`); "Editorial review" is `pending`. A fresh copy on every call: tests may change it.
 */
export const createNotificationReview = (): ReviewData => {
    return createStartedReview({ workflow: createNotificationWorkflow() }).toData();
};
