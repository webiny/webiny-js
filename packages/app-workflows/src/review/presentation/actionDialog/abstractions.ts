import { createAbstraction } from "@webiny/feature/admin";
import type { ReviewActionRequest } from "./ReviewActionRequest.js";
import type { ActionDialogConfirmVariant } from "./ActionDialogConfirmVariant.js";

export interface ReviewActionDialogInitParams {
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
    commentRequired: boolean;
    commentPlaceholder: string;
    commentNote: string | null;
    comment: string;
    commentCounter: string | null;
    commentError: string | null;
    showNotify: boolean;
    notify: boolean;
    notifyLabel: string | null;
    confirmLabel: string;
    confirmVariant: ActionDialogConfirmVariant;
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
