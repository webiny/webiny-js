export class WorkflowStateNoPendingStepError extends Error {
    public constructor() {
        super("The workflow state does not have a pending step.");
    }
}
