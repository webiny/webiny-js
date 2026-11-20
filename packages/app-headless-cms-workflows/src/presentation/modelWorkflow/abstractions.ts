import { createAbstraction } from "@webiny/feature/admin";

/*
 * Whether a workflow binds the namespace: "loading" until the app's workflow list is read,
 * "failed" when it could not be read.
 */
export type CmsModelWorkflowStatus = "loading" | "failed" | "bound" | "unbound";

export interface ICmsModelWorkflowViewModel {
    status: CmsModelWorkflowStatus;
}

export interface ICmsModelWorkflowPresenter {
    readonly vm: ICmsModelWorkflowViewModel;
    load(namespace: string): Promise<void>;
}

export const CmsModelWorkflowPresenter = createAbstraction<ICmsModelWorkflowPresenter>(
    "Cms/Workflows/ModelWorkflowPresenter"
);

export namespace CmsModelWorkflowPresenter {
    export type Interface = ICmsModelWorkflowPresenter;
    export type ViewModel = ICmsModelWorkflowViewModel;
    export type Status = CmsModelWorkflowStatus;
}
