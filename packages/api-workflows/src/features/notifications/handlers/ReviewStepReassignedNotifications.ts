import { Logger } from "@webiny/api-core/features/logger/index.js";
import { dropActor } from "~/domain/notifications/dropActor.js";
import { getActorName } from "~/domain/notifications/getActorName.js";
import { getErrorLogFields } from "~/domain/notifications/getErrorLogFields.js";
import { buildAssignedMessage } from "~/domain/notifications/messages/buildAssignedMessage.js";
import { buildReassignedMessage } from "~/domain/notifications/messages/buildReassignedMessage.js";
import { ReviewStepReassignedEventHandler } from "~/features/review/events.js";
import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/abstractions.js";

/**
 * Tells the new owner of a reassigned step that it is theirs and the old owner (a user) that they
 * no longer own it (R181, R183). Catches everything (R182, R87).
 */
class ReviewStepReassignedNotificationsImpl implements ReviewStepReassignedEventHandler.Interface {
    public constructor(
        private notifier: ReviewNotifierService.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: ReviewStepReassignedEventHandler.Event): Promise<void> {
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

            // The new owner. Every name goes through `getActorName` (R189a).
            if (fact.owner.type === "user") {
                const newOwners = dropActor(
                    [{ id: fact.owner.id, displayName: fact.owner.displayName }],
                    fact.actor
                );
                if (newOwners.length > 0) {
                    await this.notifier.notify({
                        review,
                        stepId: step.id,
                        event: "assigned",
                        recipients: newOwners,
                        message: buildAssignedMessage({
                            contentTitle: review.title,
                            stepTitle: step.title,
                            reason: null,
                            reassignedBy: getActorName(fact.actor, step.title)
                        })
                    });
                }
            }

            // The old owner, when it was a user (an awaiting step has none; AI and automation
            // owners are never told, D58).
            if (fact.previousOwner && fact.previousOwner.type === "user") {
                const oldOwners = dropActor(
                    [{ id: fact.previousOwner.id, displayName: fact.previousOwner.displayName }],
                    fact.actor
                );
                if (oldOwners.length > 0) {
                    await this.notifier.notify({
                        review,
                        stepId: step.id,
                        event: "reassigned",
                        recipients: oldOwners,
                        message: buildReassignedMessage({
                            contentTitle: review.title,
                            stepTitle: step.title,
                            operator: getActorName(fact.actor, step.title),
                            newOwner: getActorName(fact.owner, step.title)
                        })
                    });
                }
            }
        } catch (error) {
            this.logger.error(
                { ...getErrorLogFields(error), reviewId: review.id, event: fact.type },
                "A workflow notification handler failed."
            );
        }
    }
}

export const ReviewStepReassignedNotifications =
    ReviewStepReassignedEventHandler.createImplementation({
        implementation: ReviewStepReassignedNotificationsImpl,
        dependencies: [ReviewNotifierService, Logger]
    });
