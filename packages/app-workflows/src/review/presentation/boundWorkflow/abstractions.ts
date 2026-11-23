import { createAbstraction } from "@webiny/feature/admin";

/*
 * Whether a workflow binds the namespace: "loading" until the app's workflow list is read,
 * "failed" when it could not be read.
 */
export type BoundWorkflowStatus = "loading" | "failed" | "bound" | "unbound";

export interface IBoundWorkflowViewModel {
    status: BoundWorkflowStatus;
}

export interface IBoundWorkflowPresenter {
    readonly vm: IBoundWorkflowViewModel;
    load(namespace: string): Promise<void>;
}

export const BoundWorkflowPresenter = createAbstraction<IBoundWorkflowPresenter>(
    "Workflows/BoundWorkflowPresenter"
);

export namespace BoundWorkflowPresenter {
    export type Interface = IBoundWorkflowPresenter;
    export type ViewModel = IBoundWorkflowViewModel;
    export type Status = BoundWorkflowStatus;
}
