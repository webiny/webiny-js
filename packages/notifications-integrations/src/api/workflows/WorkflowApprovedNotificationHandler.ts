import { ReviewStepApprovedEventHandler } from "@webiny/api-workflows/features/review/ApproveReviewStep/index.js";
import { CreateNotificationUseCase } from "@webiny/notifications/api/features/CreateNotification/index.js";
import { NotificationType } from "@webiny/notifications/api/domain/notification/abstractions.js";
import { WorkflowModelParserService } from "@webiny/api-workflows/features/model/WorkflowModelParserService/index.js";
import { getReviewNotificationLink } from "./getReviewNotificationLink.js";
import { toNotificationActor } from "./toNotificationActor.js";

// Tells the requester in the inbox that a step of their review was approved.
class WorkflowApprovedNotificationHandlerImpl implements ReviewStepApprovedEventHandler.Interface {
    constructor(
        private createNotification: CreateNotificationUseCase.Interface,
        private modelParser: WorkflowModelParserService.Interface
    ) {}

    async handle(event: ReviewStepApprovedEventHandler.Event) {
        const review = event.payload.review;
        const recipientId = review.createdBy?.id;
        // Who decided comes from the fact, not the current identity: an AI or automation step
        // decides while running as the requester (R149), and must still notify them. Only a
        // requester deciding their own step is not told.
        const actor = event.payload.fact.actor;
        if (!recipientId || (actor.type === "user" && actor.id === recipientId)) {
            return;
        }

        await this.createNotification.execute({
            recipientId,
            type: NotificationType.approved,
            actor: toNotificationActor(actor),
            title: review.title,
            snippet: null,
            link: getReviewNotificationLink(this.modelParser.parse(review.model), review.targetId)
        });
    }
}

export const WorkflowApprovedNotificationHandler =
    ReviewStepApprovedEventHandler.createImplementation({
        implementation: WorkflowApprovedNotificationHandlerImpl,
        dependencies: [CreateNotificationUseCase, WorkflowModelParserService]
    });
