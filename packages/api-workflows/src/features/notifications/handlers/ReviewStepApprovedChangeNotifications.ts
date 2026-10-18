import { Logger } from "@webiny/api-core/features/logger/index.js";
import { getErrorLogFields } from "~/domain/notifications/getErrorLogFields.js";
import { getReviewChangeRecipients } from "~/domain/notifications/getReviewChangeRecipients.js";
import { ReviewStepApprovedEventHandler } from "~/features/review/events.js";
import { ReviewChangeNotifierService } from "~/features/notifications/ReviewChangeNotifierService/abstractions.js";

/**
 * Sends the silent change message when a step is approved and the review goes on (R253, R254):
 * to the requester and the next owner, minus the actor when the actor is a user. When the review
 * is not `inProgress` this was the final approval, which already sends the `approved`
 * notification, so nothing is sent. Catches everything (R182, R87).
 */
class ReviewStepApprovedChangeNotificationsImpl
    implements ReviewStepApprovedEventHandler.Interface
{
    public constructor(
        private changeNotifier: ReviewChangeNotifierService.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: ReviewStepApprovedEventHandler.Event): Promise<void> {
        const { review, fact } = event.payload;
        try {
            if (review.state !== "inProgress") {
                return;
            }

            const recipientIds = getReviewChangeRecipients(review, fact.actor);
            await this.changeNotifier.notify({
                review,
                stepId: fact.change.stepId,
                kind: "stepApproved",
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

export const ReviewStepApprovedChangeNotifications =
    ReviewStepApprovedEventHandler.createImplementation({
        implementation: ReviewStepApprovedChangeNotificationsImpl,
        dependencies: [ReviewChangeNotifierService, Logger]
    });
