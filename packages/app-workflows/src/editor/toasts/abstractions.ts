import { createAbstraction } from "@webiny/feature/admin";

/*
 * The editor's toasts (D125): a title only, bottom right, 8 seconds, with a close button. The
 * presenters pass the exact copy: `Workflow saved`, `Retrying…` and so on.
 */
export interface IWorkflowEditorToasts {
    success(title: string): void;
    error(title: string): void;
    // The default (neutral) variant, for example `Retrying…`.
    info(title: string): void;
}

export const WorkflowEditorToasts = createAbstraction<IWorkflowEditorToasts>(
    "Workflows/WorkflowEditorToasts"
);

export namespace WorkflowEditorToasts {
    export type Interface = IWorkflowEditorToasts;
}
