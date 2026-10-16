import { createAbstraction } from "@webiny/feature/admin";
import type { StepStateValue } from "~/review/domain/StepState.js";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import type { TargetReviewActionKind } from "../targetReview/abstractions.js";
import type { TargetReviewActionVm } from "../targetReview/abstractions.js";
import type { TargetReviewOpenAction } from "../targetReview/abstractions.js";
import type { TargetReviewTagVariant } from "../targetReview/abstractions.js";

export interface ReviewDetailsInitParams {
    useCases: IReviewUseCases;
    reviewId: string;
    reviewsUrl: string | null;
    onClose: () => void;
    // Called after an action in the drawer changed the review (the editor refreshes its bar).
    onChanged?: () => void;
}

export interface ReviewDetailsHeaderVm {
    title: string;
    stateLabel: string;
    stateVariant: TargetReviewTagVariant;
    contentLine: string;
    requesterLine: string;
    requestedLine: string;
    // The full date and time with timezone, shown on hover (QBZ-54).
    requestedTitle: string;
}

export interface ReviewDetailsSkippedVm {
    id: string;
    name: string;
    reason: string;
}

export interface ReviewDetailsStepVm {
    stepId: string;
    title: string;
    color: string;
    typeLabel: string;
    state: StepStateValue;
    stateLabel: string;
    stateVariant: TargetReviewTagVariant;
    ownerLine: string | null;
    whyOwner: string | null;
    times: string | null;
    // The full date and time of each event with timezone, shown on hover (QBZ-54).
    timesTitle: string | null;
    comment: string | null;
    skipped: ReviewDetailsSkippedVm[] | null;
}

export type ReviewDetailsStatus = "loading" | "failed" | "loaded";

// Render-ready (R234): no review, step or presenter object.
export interface IReviewDetailsViewModel {
    status: ReviewDetailsStatus;
    header: ReviewDetailsHeaderVm | null;
    steps: ReviewDetailsStepVm[];
    cancelledText: string | null;
    actions: TargetReviewActionVm[];
    error: string | null;
    openAction: TargetReviewOpenAction | null;
    reviewId: string | null;
}

export interface IReviewDetailsPresenter {
    readonly vm: IReviewDetailsViewModel;
    init(params: ReviewDetailsInitParams): Promise<void>;
    refresh(): Promise<void>;
    openAction(kind: TargetReviewActionKind, stepId: string | null): void;
    closeAction(): void;
    actionDone(): Promise<void>;
    dispose(): void;
}

export const ReviewDetailsPresenter = createAbstraction<IReviewDetailsPresenter>(
    "Workflows/ReviewDetailsPresenter"
);

export namespace ReviewDetailsPresenter {
    export type Interface = IReviewDetailsPresenter;
    export type ViewModel = IReviewDetailsViewModel;
}
