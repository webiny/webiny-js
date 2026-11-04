import { ReviewApprovedEventHandler } from "@webiny/api-workflows/features/review/ApproveReviewStep/index.js";
import { CreateNotificationUseCase } from "@webiny/notifications/api/features/CreateNotification/index.js";
import { NotificationType } from "@webiny/notifications/api/domain/notification/abstractions.js";
import { WorkflowModelParserService } from "@webiny/api-workflows/features/model/WorkflowModelParserService/index.js";
import { buildApprovedMessage } from "@webiny/api-workflows/domain/notifications/messages/buildApprovedMessage.js";
import { getReviewNotificationLink } from "./getReviewNotificationLink.js";
import { toNotificationActor } from "./toNotificationActor.js";

// Tells the requester in the inbox that every step of their review approved it. Single steps are
// not announced: the design has no per-step approval notice.
class WorkflowApprovedNotificationHandlerImpl implements ReviewApprovedEventHandler.Interface {
    constructor(
        private createNotification: CreateNotificationUseCase.Interface,
        private modelParser: WorkflowModelParserService.Interface
    ) {}

    async handle(event: ReviewApprovedEventHandler.Event) {
        const review = event.payload.review;
        const recipientId = review.createdBy?.id;
        // Who decided comes from the fact, not the current identity: an AI or automation step
        // decides while running as the requester (R149), and must still notify them. Only a
        // requester deciding the last step themselves is not told.
        const actor = event.payload.fact.actor;
        if (!recipientId || (actor.type === "user" && actor.id === recipientId)) {
            return;
        }
        // The last step is the one that approved the review.
        const step = review.steps[review.steps.length - 1];

        await this.createNotification.execute({
            recipientId,
            type: NotificationType.approved,
            actor: toNotificationActor(actor, step?.title ?? ""),
            title: review.title,
            snippet: buildApprovedMessage({ contentTitle: review.title }).body,
            link: getReviewNotificationLink(this.modelParser.parse(review.model), review.targetId)
        });
    }
}

export const WorkflowApprovedNotificationHandler = ReviewApprovedEventHandler.createImplementation({
    implementation: WorkflowApprovedNotificationHandlerImpl,
    dependencies: [CreateNotificationUseCase, WorkflowModelParserService]
});
