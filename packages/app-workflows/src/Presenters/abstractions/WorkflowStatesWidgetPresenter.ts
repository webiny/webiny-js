import { type IGenericError, type IWorkflowState, WorkflowStateValue } from "~/types.js";
import type { NonEmptyArray } from "@webiny/app/types.js";

export interface IWorkflowStatesWidgetPresenterViewModelValuesItem {
    items: IWorkflowState[];
    total: number;
}

export interface IWorkflowStatesWidgetPresenterViewModelValues {
    [key: string]: IWorkflowStatesWidgetPresenterViewModelValuesItem;
}

export interface IWorkflowStatesWidgetPresenterViewModel {
    type: "own" | "requested";
    loading: boolean;
    error: IGenericError | null;
    dialogLoading: boolean;
    dialogError: IGenericError | null;
    values: IWorkflowStatesWidgetPresenterViewModelValues;
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

export interface IWorkflowStatesWidgetPresenter {
    vm: IWorkflowStatesWidgetPresenterViewModel;
    takeOverStateStep(state: IWorkflowState): Promise<void>;
    startStateStep(state: IWorkflowState): Promise<void>;
    approveStateStep(state: IWorkflowState, comment?: string): Promise<void>;
    rejectStateStep(state: IWorkflowState, comment: string): Promise<void>;
    showStartStateStepDialog(state: IWorkflowState): void;
    showApproveStateStepDialog(state: IWorkflowState): void;
    showRejectStateStepDialog(state: IWorkflowState): void;
    showTakeOverStateStepDialog(state: IWorkflowState): void;
    hideDialog(): void;
}
