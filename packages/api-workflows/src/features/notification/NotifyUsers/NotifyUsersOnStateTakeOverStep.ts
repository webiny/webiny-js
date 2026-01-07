import { WorkflowStateTakeOverStepHandler } from "~/features/workflowState/TakeOverWorkflowStateStep/events.js";

class NotifyUsersOnStateTakeOverStepImpl implements WorkflowStateTakeOverStepHandler.Interface {
    public async handle(event: WorkflowStateTakeOverStepHandler.Event): Promise<void> {
        const { state } = event.payload;
    }
}

export const NotifyUsersOnStateTakeOverStep = WorkflowStateTakeOverStepHandler.createImplementation(
    {
        implementation: NotifyUsersOnStateTakeOverStepImpl,
        dependencies: []
    }
);
