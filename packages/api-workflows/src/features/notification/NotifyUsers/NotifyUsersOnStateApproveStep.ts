import { WorkflowStateApproveStepHandler } from "~/features/workflowState/ApproveWorkflowStateStep/events.js";
import { GetWorkflow } from "~/features/notification/NotifyUsers/abstractions.js";

class NotifyUsersOnStateApproveStepImpl implements WorkflowStateApproveStepHandler.Interface {
    public constructor(private getWorkflow: GetWorkflow.Interface) {}

    public async handle(event: WorkflowStateApproveStepHandler.Event): Promise<void> {
        const { state } = event.payload;

        const workflow = await this.getWorkflow.execute({
            id: state.workflowId,
            app: state.app
        });
        if (!workflow) {
            return;
        }
        
        
    }
}

export const NotifyUsersOnStateApproveStep = WorkflowStateApproveStepHandler.createImplementation({
    implementation: NotifyUsersOnStateApproveStepImpl,
    dependencies: [GetWorkflow]
});
