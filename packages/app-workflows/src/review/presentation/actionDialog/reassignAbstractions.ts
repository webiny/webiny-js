import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import type { ReviewerPickerPresenter } from "../reviewerPicker/abstractions.js";
import type { ReviewActionConflictVm } from "./abstractions.js";
import type { ReviewActionRequest } from "./ReviewActionRequest.js";

export interface ReassignDialogInitParams {
    useCases: IReviewUseCases;
    request: ReviewActionRequest;
    reviewsUrl: string | null;
    onDone: () => void;
    onClose: () => void;
}

/** Render-ready (R234); the picker is reached through `getPickerPresenter`, not the view model. */
export interface IReassignDialogViewModel {
    status: "loading" | "ready" | "failed";
    title: string;
    hint: string;
    message: string;
    nobodyEligible: boolean;
    showPicker: boolean;
    closeOnly: boolean;
    confirmLabel: string;
    cancelLabel: string;
    canSubmit: boolean;
    submitting: boolean;
    fieldError: string | null;
    dialogError: string | null;
    conflict: ReviewActionConflictVm | null;
}

export interface IReassignDialogPresenter {
    readonly vm: IReassignDialogViewModel;
    init(params: ReassignDialogInitParams): Promise<void>;
    getPickerPresenter(): ReviewerPickerPresenter.Interface;
    submit(): Promise<void>;
    dismiss(): void;
    dispose(): void;
}

export const ReassignDialogPresenter = createAbstraction<IReassignDialogPresenter>(
    "Workflows/ReassignDialogPresenter"
);

export namespace ReassignDialogPresenter {
    export type Interface = IReassignDialogPresenter;
    export type ViewModel = IReassignDialogViewModel;
}
