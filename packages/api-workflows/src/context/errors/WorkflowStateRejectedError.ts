export class WorkflowStateRejectedError extends Error {
    public constructor() {
        super("The workflow state has been rejected and cannot proceed.");
    }
}
