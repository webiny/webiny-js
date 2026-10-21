import { Logger } from "@webiny/api-core/features/logger/index.js";
import { dropActor } from "~/domain/notifications/dropActor.js";
import { getActorName } from "~/domain/notifications/getActorName.js";
import { getErrorLogFields } from "~/features/notifications/shared/getErrorLogFields.js";
import { buildTakenOverMessage } from "~/domain/notifications/messages/buildTakenOverMessage.js";
import { ReviewStepTakenOverEventHandler } from "~/features/review/events.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/abstractions.js";

/**
 * Tells the previous owner of a step that somebody took it over (D111, R181, R183), unless the
 * taker opted out (`fact.notifyPreviousOwner`, R185) or the previous owner is an AI or an
 * automation. Catches everything (R182, R87).
 */
class ReviewStepTakenOverNotificationsImpl implements ReviewStepTakenOverEventHandler.Interface {
    public constructor(
        private notifier: ReviewNotifierService.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: ReviewStepTakenOverEventHandler.Event): Promise<void> {
        const { review, fact } = event.payload;
        try {
            if (!fact.notifyPreviousOwner || fact.previousOwner.type !== "user") {
                return;
            }

            const step = review.steps.find(item => item.id === fact.change.stepId);
            if (!step) {
                this.logger.error(
                    { reviewId: review.id, stepId: fact.change.stepId },
                    "Could not find the step for a workflow notification."
                );
                return;
            }

            const recipients = dropActor(
                [{ id: fact.previousOwner.id, displayName: fact.previousOwner.displayName }],
                fact.actor
            );
            if (recipients.length === 0) {
                return;
            }
            await this.notifier.notify({
                review,
                stepId: step.id,
                event: "takenOver",
                recipients,
                message: buildTakenOverMessage({
                    contentTitle: review.title,
                    stepTitle: step.title,
                    taker: getActorName(fact.actor, step.title)
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

export const ReviewStepTakenOverNotifications =
    ReviewStepTakenOverEventHandler.createImplementation({
        implementation: ReviewStepTakenOverNotificationsImpl,
        dependencies: [ReviewNotifierService, Logger]
    });
