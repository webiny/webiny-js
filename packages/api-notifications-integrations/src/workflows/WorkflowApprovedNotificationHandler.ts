import { WorkflowStateApproveStepHandler } from "@webiny/api-workflows/features/workflowState/ApproveWorkflowStateStep/events.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CreateNotificationUseCase } from "@webiny/api-notifications/features/CreateNotification/index.js";
import { NotificationType } from "@webiny/api-notifications/domain/notification/abstractions.js";

/**
 * A workflow step was approved -> notify the person who submitted the content for review.
 */
class WorkflowApprovedNotificationHandlerImpl implements WorkflowStateApproveStepHandler.Interface {
    constructor(
        private createNotification: CreateNotificationUseCase.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async handle(event: WorkflowStateApproveStepHandler.Event) {
        const state = event.payload.state;
        const recipientId = state.createdBy?.id;
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
            title: state.title,
            snippet: null,
            link: { app: state.app, contentId: state.targetId }
        });
    }
}

export const WorkflowApprovedNotificationHandler =
    WorkflowStateApproveStepHandler.createImplementation({
        implementation: WorkflowApprovedNotificationHandlerImpl,
        dependencies: [CreateNotificationUseCase, IdentityContext]
    });
