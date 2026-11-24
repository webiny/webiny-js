import type { ReviewData } from "~/domain/review/types.js";
import type { NotificationDetails } from "~/domain/notifications/types.js";
import { getActorName } from "~/domain/notifications/getActorName.js";

/**
 * The details a transport shows for a review's step, or `undefined` when the step is not in the
 * review. The content type is the name snapshotted at request time, `null` for older reviews.
 * Pure.
 */
export const getNotificationDetails = (
    review: ReviewData,
    stepId: string | null
): NotificationDetails | undefined => {
    const index = stepId === null ? -1 : review.steps.findIndex(item => item.id === stepId);
    const step = review.steps[index];
    if (index < 0 || !step) {
        return undefined;
    }
    const contentType = review.targetContext.contentTypeName?.trim() || null;
    return {
        contentType,
        contentTitle: review.title,
        stepNumber: index + 1,
        stepCount: review.steps.length,
        stepTitle: step.title,
        requester: getActorName(review.createdBy, step.title)
    };
};
