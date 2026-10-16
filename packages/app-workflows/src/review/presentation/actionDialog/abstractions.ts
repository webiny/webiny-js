import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import type { ReviewActionRequest } from "./ReviewActionRequest.js";

export interface ReviewActionDialogInitParams {
    useCases: IReviewUseCases;
    request: ReviewActionRequest;
    reviewsUrl: string | null;
    // Content Reviews refreshes its list behind a conflicting action; the message says so (R220).
    listRefreshed?: boolean;
    // Called once after a conflict, so the host can refresh what it shows.
    onConflict?: () => void;
    onDone: () => void;
    onClose: () => void;
}

export interface ReviewActionConflictVm {
    title: string;
    message: string;
    commentKept: boolean;
}

// Render-ready (R234).
export interface IReviewActionDialogViewModel {
    status: "loading" | "ready" | "failed";
    title: string;
    body: string;
    showComment: boolean;
    commentLabel: string;
    comment: string;
    commentCounter: string | null;
    showNotify: boolean;
    notify: boolean;
    notifyLabel: string | null;
    confirmLabel: string;
    cancelLabel: string;
    canSubmit: boolean;
    submitting: boolean;
    fieldError: string | null;
    dialogError: string | null;
    conflict: ReviewActionConflictVm | null;
}

export interface IReviewActionDialogPresenter {
    readonly vm: IReviewActionDialogViewModel;
    init(params: ReviewActionDialogInitParams): Promise<void>;
    setComment(comment: string): void;
    setNotify(notify: boolean): void;
    submit(): Promise<void>;
    dismiss(): void;
    dispose(): void;
}

export const ReviewActionDialogPresenter = createAbstraction<IReviewActionDialogPresenter>(
    "Workflows/ReviewActionDialogPresenter"
);

export namespace ReviewActionDialogPresenter {
    export type Interface = IReviewActionDialogPresenter;
    export type ViewModel = IReviewActionDialogViewModel;
}
