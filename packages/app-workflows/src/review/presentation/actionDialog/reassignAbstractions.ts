import { createAbstraction } from "@webiny/feature/admin";
import type { ReviewerPickerPresenter } from "../reviewerPicker/abstractions.js";
import type { ReviewActionConflictVm } from "./abstractions.js";
import type { ReviewActionRequest } from "./ReviewActionRequest.js";

export interface ReassignDialogInitParams {
    // The review's namespace; the injected use cases route by it (R347, R353).
    namespace: string;
    request: ReviewActionRequest;
    reviewsUrl: string | null;
    // Content Reviews refreshes its list behind a conflicting action; the message says so (R220).
    listRefreshed?: boolean;
    // Called once after a conflict, so the host can refresh what it shows.
    onConflict?: () => void;
    onDone: () => void;
    onClose: () => void;
}

export interface ReassignNobodyVm {
    text: string;
    // “Review title” · currently Owner.
    detail: string;
}

// Render-ready (R234); the picker is reached through `getPickerPresenter`, not the view model.
export interface IReassignDialogViewModel {
    status: "loading" | "ready" | "failed";
    title: string;
    hint: string;
    nobody: ReassignNobodyVm | null;
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
