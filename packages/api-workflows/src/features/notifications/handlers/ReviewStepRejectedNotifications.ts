import { Logger } from "@webiny/api-core/features/logger/index.js";
import { dropActor } from "~/domain/notifications/dropActor.js";
import { getActorName } from "~/domain/notifications/getActorName.js";
import { getErrorLogFields } from "~/features/notifications/shared/getErrorLogFields.js";
import { buildRejectedMessage } from "~/domain/notifications/messages/buildRejectedMessage.js";
import { ReviewStepRejectedEventHandler } from "~/features/review/RejectReviewStep/index.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/abstractions.js";

/**
 * Tells the requester their review was rejected, by whom and why (R181, R183, D107). An AI or
 * automation actor carries the requester's id (D58) and never drops the requester (R184).
 * Catches everything (R182, R87).
 */
class ReviewStepRejectedNotificationsImpl implements ReviewStepRejectedEventHandler.Interface {
    public constructor(
        private notifier: ReviewNotifierService.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: ReviewStepRejectedEventHandler.Event): Promise<void> {
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
                event: "rejected",
                recipients,
                message: buildRejectedMessage({
                    contentTitle: review.title,
                    stepTitle: step.title,
                    decider: getActorName(fact.actor, step.title),
                    comment: fact.comment
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

export const ReviewStepRejectedNotifications = ReviewStepRejectedEventHandler.createImplementation({
    implementation: ReviewStepRejectedNotificationsImpl,
    dependencies: [ReviewNotifierService, Logger]
});
