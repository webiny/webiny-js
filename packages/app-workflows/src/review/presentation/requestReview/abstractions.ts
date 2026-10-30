import { createAbstraction } from "@webiny/feature/admin";
import type { ReviewTarget } from "~/review/domain/types.js";
import type { StepTypeIconName } from "./getStepTypeIcon.js";
import type { ReviewerPickerPresenter } from "../reviewerPicker/abstractions.js";

export interface RequestReviewInitParams {
    target: ReviewTarget;
    targetTitle: string;
    reviewsUrl: string | null;
    // Called once after a conflict, so the host can refresh what it shows.
    onConflict?: () => void;
    onDone: () => void;
    onClose: () => void;
}

export type RequestReviewMode = "automatic" | "pick";

export interface RequestReviewStepVm {
    stepId: string;
    index: number;
    title: string;
    color: string;
    typeLabel: string;
    typeIcon: StepTypeIconName;
    labelTag: string;
    description: string | null;
    allowManualPick: boolean;
    mode: RequestReviewMode;
    hasPicker: boolean;
    noCandidates: boolean;
}

export interface RequestReviewConflictVm {
    title: string;
    message: string;
}

// Render-ready (R234): the pickers are reached through `getPickerPresenter`, not the view model.
export interface IRequestReviewViewModel {
    status: "loadingSteps" | "stepsFailed" | "ready" | "submitting";
    title: string;
    titleError: string | null;
    steps: RequestReviewStepVm[];
    dialogError: string | null;
    conflict: RequestReviewConflictVm | null;
    canSubmit: boolean;
}

export interface IRequestReviewPresenter {
    readonly vm: IRequestReviewViewModel;
    init(params: RequestReviewInitParams): Promise<void>;
    setTitle(title: string): void;
    setMode(stepId: string, mode: RequestReviewMode): void;
    getPickerPresenter(stepId: string): ReviewerPickerPresenter.Interface | null;
    retrySteps(): Promise<void>;
    submit(): Promise<void>;
    dismiss(): void;
    dispose(): void;
}

export const RequestReviewPresenter = createAbstraction<IRequestReviewPresenter>(
    "Workflows/RequestReviewPresenter"
);

export namespace RequestReviewPresenter {
    export type Interface = IRequestReviewPresenter;
    export type ViewModel = IRequestReviewViewModel;
}
