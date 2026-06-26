import { createAbstraction } from "@webiny/feature/admin";
import type {
    IWorkflow,
    IWorkflowApplication,
    IWorkflowNotificationType,
    IWorkflowStep
} from "~/types.js";
import type { NonEmptyArray } from "@webiny/app/types.js";
import type { IWorkflowModel } from "~/domain/index.js";

export interface IWorkflowErrorDataInvalidFieldData {
    path: NonEmptyArray<string>;
}

export interface IWorkflowErrorDataInvalidField {
    code: string;
    message: string;
    data: IWorkflowErrorDataInvalidFieldData;
}

export interface IWorkflowErrorDataInvalidFields {
    [key: string]: IWorkflowErrorDataInvalidField;
}

export interface IWorkflowErrorData {
    invalidFields: IWorkflowErrorDataInvalidFields;
}

export interface IWorkflowError {
    code: string | null;
    message: string;
    data?: IWorkflowErrorData;
    stack?: string;
}

export interface IWorkflowsEditorPresenterViewModel {
    dirty: boolean;
    workflows: IWorkflow[];
    notifications: IWorkflowNotificationType[];
    workflow: IWorkflow | null;
    loading: boolean;
    error: IWorkflowError | null;
    app: IWorkflowApplication;
}

export interface IWorkflowsEditorPresenterInitParams {
    app: IWorkflowApplication;
    defaultWorkflow: IWorkflow;
}

export interface IWorkflowsEditorPresenter {
    vm: IWorkflowsEditorPresenterViewModel;
    init(params: IWorkflowsEditorPresenterInitParams): Promise<void>;
    getWorkflow(): IWorkflowModel;
    updateWorkflow(workflow: IWorkflow): void;
    deleteWorkflow(workflow: IWorkflow): void;
    removeStep(step: Pick<IWorkflowStep, "id">): void;
    updateStep(step: IWorkflowStep): void;
    addStep(step: IWorkflowStep): void;
    canMoveStepUp(step: Pick<IWorkflowStep, "id">): boolean;
    moveStepUp(step: Pick<IWorkflowStep, "id">): void;
    canMoveStepDown(step: Pick<IWorkflowStep, "id">): boolean;
    moveStepDown(step: Pick<IWorkflowStep, "id">): void;
}

export const WorkflowsEditorPresenter = createAbstraction<IWorkflowsEditorPresenter>(
    "WorkflowsEditorPresenter"
);

export namespace WorkflowsEditorPresenter {
    export type Interface = IWorkflowsEditorPresenter;
    export type ViewModel = IWorkflowsEditorPresenterViewModel;
}
