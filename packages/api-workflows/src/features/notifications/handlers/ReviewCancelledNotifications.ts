import { Logger } from "@webiny/api-core/features/logger/index.js";
import { dropActor } from "~/domain/notifications/dropActor.js";
import { getActorName } from "~/domain/notifications/getActorName.js";
import { getErrorLogFields } from "~/domain/notifications/getErrorLogFields.js";
import { buildCancelledMessage } from "~/domain/notifications/messages/buildCancelledMessage.js";
import { ReviewCancelledEventHandler } from "~/features/review/events.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/abstractions.js";

/**
 * Tells the user who owned the current step that the review was cancelled (R181, R183). A pool
 * step (`awaiting`) has no owner, an AI or automation owner is never told, and the cancel does not
 * clear `step.owner`, so the owner is read from the step, never from `review.currentOwnerId`.
 * Catches everything (R182, R87).
 */
class ReviewCancelledNotificationsImpl implements ReviewCancelledEventHandler.Interface {
    public constructor(
        private notifier: ReviewNotifierService.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: ReviewCancelledEventHandler.Event): Promise<void> {
        const { review, fact } = event.payload;
        try {
            if (fact.stepId === null || fact.stepState !== "inReview") {
                return;
            }

            const step = review.steps.find(item => item.id === fact.stepId);
            if (!step) {
                this.logger.error(
                    { reviewId: review.id, stepId: fact.stepId },
                    "Could not find the step for a workflow notification."
                );
                return;
            }
            if (!step.owner || step.owner.type !== "user") {
                return;
            }

            const recipients = dropActor(
                [{ id: step.owner.id, displayName: step.owner.displayName }],
                fact.actor
            );
            if (recipients.length === 0) {
                return;
            }
            await this.notifier.notify({
                review,
                stepId: step.id,
                event: "cancelled",
                recipients,
                message: buildCancelledMessage({
                    contentTitle: review.title,
                    stepTitle: step.title,
                    canceller: getActorName(fact.actor, step.title),
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

export const ReviewCancelledNotifications = ReviewCancelledEventHandler.createImplementation({
    implementation: ReviewCancelledNotificationsImpl,
    dependencies: [ReviewNotifierService, Logger]
});
