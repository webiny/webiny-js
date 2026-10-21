import { Logger } from "@webiny/api-core/features/logger/index.js";
import { getErrorLogFields } from "~/features/notifications/shared/getErrorLogFields.js";
import { buildFailedMessage } from "~/domain/notifications/messages/buildFailedMessage.js";
import { ReviewStepFailedEventHandler } from "~/features/review/events.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/abstractions.js";

/**
 * Tells the requester a step failed (R181, R183). The actor is never dropped (R184): the actor of
 * a failure can be the requester as a user (R140), who must still hear about it. The message
 * holds `fact.reason` only, a fixed text (R146 mirror). Catches everything (R182, R87).
 */
class ReviewStepFailedNotificationsImpl implements ReviewStepFailedEventHandler.Interface {
    public constructor(
        private notifier: ReviewNotifierService.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: ReviewStepFailedEventHandler.Event): Promise<void> {
        const { review, fact } = event.payload;
        try {
            const step = review.steps.find(item => item.id === fact.change.stepId);
            if (!step) {
                this.logger.error(
                    { reviewId: review.id, stepId: fact.change.stepId },
                    "Could not find the step for a workflow notification."
                );
                return;
            }

            await this.notifier.notify({
                review,
                stepId: step.id,
                event: "failed",
                recipients: [
                    { id: review.createdBy.id, displayName: review.createdBy.displayName }
                ],
                message: buildFailedMessage({
                    contentTitle: review.title,
                    stepTitle: step.title,
                    reason: fact.reason
                })
            });
        } catch (error) {
            this.logger.error(
                { ...getErrorLogFields(error), reviewId: review.id, event: fact.type },
                "A workflow notification handler failed."
            );
        }
    }
}

export const ReviewStepFailedNotifications = ReviewStepFailedEventHandler.createImplementation({
    implementation: ReviewStepFailedNotificationsImpl,
    dependencies: [ReviewNotifierService, Logger]
});
