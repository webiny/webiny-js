import { createAbstraction } from "@webiny/feature/admin";
import { type IWorkflowState, WorkflowStateValue } from "~/types.js";
import type { NonEmptyArray } from "@webiny/app/types.js";

export interface IWorkflowStatesWidgetViewModelValuesItem {
    items: IWorkflowState[];
    total: number;
}

export interface IWorkflowStatesWidgetViewModelValues {
    [key: string]: IWorkflowStatesWidgetViewModelValuesItem;
}

export interface IWorkflowStatesWidgetPresenterViewModel {
    type: "own" | "requested";
    loading: boolean;
    error: string | null;
    actionLoading: boolean;
    actionError: string | null;
    values: IWorkflowStatesWidgetViewModelValues;
    states: NonEmptyArray<WorkflowStateValue>;
    showStartDialog: IWorkflowState | null;
    showStartSuccessDialog: IWorkflowState | null;
    showApproveDialog: IWorkflowState | null;
    showApproveSuccessDialog: IWorkflowState | null;
    showRejectDialog: IWorkflowState | null;
    showRejectSuccessDialog: IWorkflowState | null;
    showTakeOverDialog: IWorkflowState | null;
    showTakeOverSuccessDialog: IWorkflowState | null;
}

export interface IWorkflowStatesWidgetPresenterInitParams {
    type: "own" | "requested";
    states: NonEmptyArray<WorkflowStateValue>;
}

export interface IWorkflowStatesWidgetPresenter {
    vm: IWorkflowStatesWidgetPresenterViewModel;
    init(params: IWorkflowStatesWidgetPresenterInitParams): Promise<void>;
    startStateStep(state: IWorkflowState): Promise<void>;
    takeOverStateStep(state: IWorkflowState): Promise<void>;
    approveStateStep(state: IWorkflowState, comment?: string): Promise<void>;
    rejectStateStep(state: IWorkflowState, comment: string): Promise<void>;
    showStartStateStepDialog(state: IWorkflowState): void;
    showApproveStateStepDialog(state: IWorkflowState): void;
    showRejectStateStepDialog(state: IWorkflowState): void;
    showTakeOverStateStepDialog(state: IWorkflowState): void;
    hideDialog(): void;
}

export const WorkflowStatesWidgetPresenter = createAbstraction<IWorkflowStatesWidgetPresenter>(
    "WorkflowStatesWidgetPresenter"
);

export namespace WorkflowStatesWidgetPresenter {
    export type Interface = IWorkflowStatesWidgetPresenter;
    export type ViewModel = IWorkflowStatesWidgetPresenterViewModel;
}
