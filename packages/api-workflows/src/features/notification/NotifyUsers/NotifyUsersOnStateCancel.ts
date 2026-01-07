import { WorkflowStateCancelHandler } from "~/features/workflowState/CancelWorkflowState/events.js";

class NotifyUsersOnStateCancelImpl implements WorkflowStateCancelHandler.Interface {
    public async handle(event: WorkflowStateCancelHandler.Event): Promise<void> {
        const { state } = event.payload;
    }
}

export const NotifyUsersOnStateCancel = WorkflowStateCancelHandler.createImplementation({
    implementation: NotifyUsersOnStateCancelImpl,
    dependencies: []
});
