import { WorkflowStateRejectHandler } from "@webiny/api-workflows/features/workflowState/RejectWorkflowStateStep/events.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CreateNotificationUseCase } from "@webiny/api-notifications/features/CreateNotification/index.js";
import { NotificationType } from "@webiny/api-notifications/domain/notification/abstractions.js";

/**
 * A workflow step was rejected -> notify the person who submitted the content for review.
 */
class WorkflowRejectedNotificationHandlerImpl implements WorkflowStateRejectHandler.Interface {
    constructor(
        private createNotification: CreateNotificationUseCase.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async handle(event: WorkflowStateRejectHandler.Event) {
        const state = event.payload.state;
        const recipientId = state.createdBy?.id;
        const identity = this.identityContext.getIdentity();

        if (!recipientId || recipientId === identity.id) {
            return;
        }

        await this.createNotification.execute({
            recipientId,
            type: NotificationType.rejected,
            actor: {
                id: identity.id,
                displayName: identity.displayName,
                type: identity.type
            },
            title: state.title,
            snippet: null,
            link: { app: state.app, contentId: state.targetId }
        });
    }
}

export const WorkflowRejectedNotificationHandler = WorkflowStateRejectHandler.createImplementation({
    implementation: WorkflowRejectedNotificationHandlerImpl,
    dependencies: [CreateNotificationUseCase, IdentityContext]
});
