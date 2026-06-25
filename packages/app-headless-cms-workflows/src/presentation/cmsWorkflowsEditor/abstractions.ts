import { createAbstraction } from "@webiny/feature/admin";

export interface WorkflowApp {
    id: string;
    name: string;
    modelId: string;
    icon: string;
}

export interface ICmsWorkflowsEditorPresenterViewModel {
    loading: boolean;
    apps: WorkflowApp[];
}

export interface ICmsWorkflowsEditorPresenter {
    readonly vm: ICmsWorkflowsEditorPresenterViewModel;
    init(): void;
}

export const CmsWorkflowsEditorPresenter = createAbstraction<ICmsWorkflowsEditorPresenter>(
    "CmsWorkflowsEditor/Presenter"
);

export namespace CmsWorkflowsEditorPresenter {
    export type Interface = ICmsWorkflowsEditorPresenter;
    export type ViewModel = ICmsWorkflowsEditorPresenterViewModel;
}
