import { WorkflowStateAfterDeleteHandler } from "~/features/workflowState/DeleteTargetWorkflowState/index.js";

class NotifyUsersOnStateDeleteImpl implements WorkflowStateAfterDeleteHandler.Interface {
    public async handle(event: WorkflowStateAfterDeleteHandler.Event): Promise<void> {
        const { state } = event.payload;
    }
}

export const NotifyUsersOnStateDelete = WorkflowStateAfterDeleteHandler.createImplementation({
    implementation: NotifyUsersOnStateDeleteImpl,
    dependencies: []
});
