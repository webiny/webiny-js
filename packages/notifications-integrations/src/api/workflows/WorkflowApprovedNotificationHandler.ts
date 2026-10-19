import { ReviewStepApprovedEventHandler } from "@webiny/api-workflows/features/review/events.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CreateNotificationUseCase } from "@webiny/notifications/api/features/CreateNotification/index.js";
import { NotificationType } from "@webiny/notifications/api/domain/notification/abstractions.js";
import { getReviewNotificationLink } from "./getReviewNotificationLink.js";

// Tells the requester in the inbox that a step of their review was approved.
class WorkflowApprovedNotificationHandlerImpl implements ReviewStepApprovedEventHandler.Interface {
    constructor(
        private createNotification: CreateNotificationUseCase.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async handle(event: ReviewStepApprovedEventHandler.Event) {
        const review = event.payload.review;
        const recipientId = review.createdBy?.id;
        const identity = this.identityContext.getIdentity();

        if (!recipientId || recipientId === identity.id) {
            return;
        }

        await this.createNotification.execute({
            recipientId,
            type: NotificationType.approved,
            actor: {
                id: identity.id,
                displayName: identity.displayName,
                type: identity.type
            },
            title: review.title,
            snippet: null,
            link: getReviewNotificationLink(review)
        });
    }
}

export const WorkflowApprovedNotificationHandler =
    ReviewStepApprovedEventHandler.createImplementation({
        implementation: WorkflowApprovedNotificationHandlerImpl,
        dependencies: [CreateNotificationUseCase, IdentityContext]
    });
