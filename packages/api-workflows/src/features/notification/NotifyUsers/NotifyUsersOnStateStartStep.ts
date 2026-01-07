import { WorkflowStateStartStepHandler } from "~/features/workflowState/StartWorkflowStateStep/events.js";

class NotifyUsersOnStateStartStepImpl implements WorkflowStateStartStepHandler.Interface {
    public async handle(event: WorkflowStateStartStepHandler.Event): Promise<void> {
        const { state } = event.payload;
    }
}

export const NotifyUsersOnStateStartStep = WorkflowStateStartStepHandler.createImplementation({
    implementation: NotifyUsersOnStateStartStepImpl,
    dependencies: []
});
