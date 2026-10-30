import { Logger } from "@webiny/api-core/features/logger/index.js";
import { getErrorLogFields } from "~/features/notifications/shared/getErrorLogFields.js";
import { getReviewChangeRecipients } from "~/domain/notifications/getReviewChangeRecipients.js";
import { ReviewRequestedEventHandler } from "~/features/review/RequestReview/index.js";
import { ReviewChangeNotifierService } from "~/features/notifications/ReviewChangeNotifierService/abstractions.js";

/**
 * Sends the silent change message when a review is requested (R253, R254): to the requester and
 * the current owner, minus the actor when the actor is a user. The step is the review's current
 * step. Catches everything (R182, R87).
 */
class ReviewRequestedChangeNotificationsImpl implements ReviewRequestedEventHandler.Interface {
    public constructor(
        private changeNotifier: ReviewChangeNotifierService.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: ReviewRequestedEventHandler.Event): Promise<void> {
        const { review, fact } = event.payload;
        try {
            const recipientIds = getReviewChangeRecipients(review, fact.actor);
            await this.changeNotifier.notify({
                review,
                stepId: review.currentStepId,
                kind: "requested",
                recipientIds
            });
        } catch (error) {
            this.logger.error(
                { ...getErrorLogFields(error), reviewId: review.id, event: fact.type },
                "A workflow notification handler failed."
            );
        }
    }
}

export const ReviewRequestedChangeNotifications = ReviewRequestedEventHandler.createImplementation({
    implementation: ReviewRequestedChangeNotificationsImpl,
    dependencies: [ReviewChangeNotifierService, Logger]
});
