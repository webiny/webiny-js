import { Logger } from "@webiny/api-core/features/logger/index.js";
import { getErrorLogFields } from "~/features/notifications/shared/getErrorLogFields.js";
import { getReviewChangeRecipients } from "~/domain/notifications/getReviewChangeRecipients.js";
import { ReviewStepStartedEventHandler } from "~/features/review/StartReviewStep/index.js";
import { ReviewChangeNotifierService } from "~/features/notifications/ReviewChangeNotifierService/abstractions.js";

/**
 * Sends the silent change message when a pool step is started (R253, R254): to the requester and
 * the current owner, minus the actor when the actor is a user. The starter becomes the owner, so
 * the requester is usually the only recipient. Catches everything (R182, R87).
 */
class ReviewStepStartedChangeNotificationsImpl implements ReviewStepStartedEventHandler.Interface {
    public constructor(
        private changeNotifier: ReviewChangeNotifierService.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: ReviewStepStartedEventHandler.Event): Promise<void> {
        const { review, fact } = event.payload;
        try {
            const recipientIds = getReviewChangeRecipients(review, fact.actor);
            await this.changeNotifier.notify({
                review,
                stepId: fact.change.stepId,
                kind: "stepStarted",
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

export const ReviewStepStartedChangeNotifications =
    ReviewStepStartedEventHandler.createImplementation({
        implementation: ReviewStepStartedChangeNotificationsImpl,
        dependencies: [ReviewChangeNotifierService, Logger]
    });
