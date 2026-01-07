import { WorkflowStateApproveStepHandler } from "~/features/workflowState/ApproveWorkflowStateStep/events.js";

class NotifyUsersOnStateApproveStepImpl implements WorkflowStateApproveStepHandler.Interface {
    public async handle(event: WorkflowStateApproveStepHandler.Event): Promise<void> {
        const { state } = event.payload;
    }
}

export const NotifyUsersOnStateApproveStep = WorkflowStateApproveStepHandler.createImplementation({
    implementation: NotifyUsersOnStateApproveStepImpl,
    dependencies: []
});
