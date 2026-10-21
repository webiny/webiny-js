import { Logger } from "@webiny/api-core/features/logger/index.js";
import { dropActor } from "~/domain/notifications/dropActor.js";
import { getErrorLogFields } from "~/features/notifications/shared/getErrorLogFields.js";
import { buildApprovedMessage } from "~/domain/notifications/messages/buildApprovedMessage.js";
import { ReviewApprovedEventHandler } from "~/features/review/events.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/abstractions.js";

/**
 * Tells the requester every step approved the revision (R181, R183). The channels are the last
 * step's: it is the step that approved. Catches everything (R182, R87).
 */
class ReviewApprovedNotificationsImpl implements ReviewApprovedEventHandler.Interface {
    public constructor(
        private notifier: ReviewNotifierService.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: ReviewApprovedEventHandler.Event): Promise<void> {
        const { review, fact } = event.payload;
        try {
            const step = review.steps[review.steps.length - 1];
            if (!step) {
                this.logger.error(
                    { reviewId: review.id, stepId: null },
                    "Could not find the step for a workflow notification."
                );
                return;
            }

            const recipients = dropActor(
                [{ id: review.createdBy.id, displayName: review.createdBy.displayName }],
                fact.actor
            );
            if (recipients.length === 0) {
                return;
            }
            await this.notifier.notify({
                review,
                stepId: step.id,
                event: "approved",
                recipients,
                message: buildApprovedMessage({ contentTitle: review.title })
            });
        } catch (error) {
            this.logger.error(
                { ...getErrorLogFields(error), reviewId: review.id, event: fact.type },
                "A workflow notification handler failed."
            );
        }
    }
}

export const ReviewApprovedNotifications = ReviewApprovedEventHandler.createImplementation({
    implementation: ReviewApprovedNotificationsImpl,
    dependencies: [ReviewNotifierService, Logger]
});
