export class WorkflowStateInReviewError extends Error {
    public constructor() {
        super("The workflow state is already in review and cannot proceed.");
    }
}
