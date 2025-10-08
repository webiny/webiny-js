import type { IWorkflowState } from "../abstractions/WorkflowState.js";

export class NullWorkflowState implements IWorkflowState {
    public readonly done = true;
    public readonly workflow = undefined;
    public readonly record = undefined;

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
