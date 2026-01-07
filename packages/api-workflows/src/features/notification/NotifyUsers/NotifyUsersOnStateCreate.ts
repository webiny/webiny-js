import { WorkflowStateAfterCreateHandler } from "~/features/workflowState/CreateWorkflowState/index.js";

class NotifyUsersOnStateCreateImpl implements WorkflowStateAfterCreateHandler.Interface {
    public async handle(event: WorkflowStateAfterCreateHandler.Event): Promise<void> {
        const { state } = event.payload;
    }
}

export const NotifyUsersOnStateCreate = WorkflowStateAfterCreateHandler.createImplementation({
    implementation: NotifyUsersOnStateCreateImpl,
    dependencies: []
});
