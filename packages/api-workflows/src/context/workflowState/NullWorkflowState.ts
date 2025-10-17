import type { IWorkflowState } from "../abstractions/WorkflowState.js";

export class NullWorkflowState implements IWorkflowState {
    public readonly activeStep = undefined;
    /**
     * When we have a NullWorkflowState, it means there is no workflow assigned to the current entity.
     * Therefore, we cannot consider it done - user MUST explicitly assign a workflow and approve it.
     */
    public readonly done = false;
    public readonly workflow = undefined;
    public readonly record = undefined;

    public async start(): Promise<void> {
        return;
    }

    public async approve(): Promise<void> {
        return;
    }

    public async reject(): Promise<void> {
        return;
    }

    public async cancel(): Promise<void> {
        return;
    }
}
