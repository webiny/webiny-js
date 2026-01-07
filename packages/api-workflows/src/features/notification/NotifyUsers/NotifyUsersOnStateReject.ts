import { WorkflowStateRejectHandler } from "~/features/workflowState/RejectWorkflowStateStep/events.js";

class NotifyUsersOnStateRejectImpl implements WorkflowStateRejectHandler.Interface {
    public async handle(event: WorkflowStateRejectHandler.Event): Promise<void> {
        const { state } = event.payload;
    }
}

export const NotifyUsersOnStateReject = WorkflowStateRejectHandler.createImplementation({
    implementation: NotifyUsersOnStateRejectImpl,
    dependencies: []
});
