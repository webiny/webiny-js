import { createAbstraction } from "@webiny/feature/admin";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import type { ReviewTarget } from "~/review/domain/types.js";
import type { StepStateValue } from "~/review/domain/StepState.js";

export type TargetReviewStatus = "loading" | "failed" | "noWorkflow" | "none" | "active";

export type TargetReviewFailureKind = "noAccess" | "error";

// What the review is, once the status is `active` or `none` (cancelled reads as none, D75).
export type TargetReviewKind = "none" | "inProgress" | "approved" | "rejected";

export type TargetReviewActionKind =
    | "request"
    | "start"
    | "takeOver"
    | "reassign"
    | "approve"
    | "reject"
    | "cancel"
    | "restart";

export type TargetReviewActionIcon =
    | "send"
    | "play_arrow"
    | "check"
    | "close"
    | "front_hand"
    | "swap_horiz"
    | "block"
    | "refresh";

export type TargetReviewEmphasis = "ghost" | "tertiary" | "secondary" | "primary";

// The admin-ui `Tag` variants the review view uses.
export type TargetReviewTagVariant =
    | "accent-light"
    | "success-light"
    | "destructive"
    | "warning"
    | "neutral-base-outline"
    | "neutral-dark";

// The state tile of the bar (README 6): the Material icon name that names it.
export type TargetReviewTile =
    | "rule"
    | "rate_review"
    | "hourglass_empty"
    | "sync_problem"
    | "check_circle"
    | "cancel";

export interface TargetReviewTag {
    label: string;
    variant: TargetReviewTagVariant;
}

export interface TargetReviewActionVm {
    kind: TargetReviewActionKind;
    label: string;
    icon: TargetReviewActionIcon;
    stepId: string | null;
    emphasis: TargetReviewEmphasis;
}

export interface TargetReviewSegmentVm {
    stepId: string;
    title: string;
    state: StepStateValue;
    ownerLabel: string;
    comment: string | null;
}

export interface TargetReviewProgressVm {
    approved: number;
    total: number;
    segments: TargetReviewSegmentVm[];
}

export interface TargetReviewOpenAction {
    kind: TargetReviewActionKind;
    stepId: string | null;
}

// Render-ready values only (R234): no domain object, no presenter, no callback.
export interface ITargetReviewViewModel {
    status: TargetReviewStatus;
    failureKind: TargetReviewFailureKind | null;
    reviewKind: TargetReviewKind;
    targetTitle: string;
    namespace: string;
    targetRevisionId: string;
    message: string;
    lockText: string | null;
    tile: TargetReviewTile;
    stateTag: TargetReviewTag | null;
    stepStateTag: TargetReviewTag | null;
    stepMeta: string | null;
    ownerMeta: string | null;
    progress: TargetReviewProgressVm | null;
    actions: TargetReviewActionVm[];
    allowsEditing: boolean;
    allowsPublishing: boolean;
    publishDisabledReason: string | null;
    moveDisabledReason: string | null;
    reviewId: string | null;
    openAction: TargetReviewOpenAction | null;
    busy: boolean;
}

// What the editor knows about the content and may change while the editor is open.
export interface TargetReviewContext {
    targetTitle: string;
    canRequest: boolean;
    isPublished: boolean;
    // The revision was published before and is unpublished now (R226, R-h).
    isUnpublished: boolean;
}

export interface TargetReviewInitParams extends TargetReviewContext {
    useCases: IReviewUseCases;
    target: ReviewTarget;
}

export interface ITargetReviewPresenter {
    readonly vm: ITargetReviewViewModel;
    init(params: TargetReviewInitParams): Promise<void>;
    setContext(context: TargetReviewContext): void;
    refresh(): Promise<void>;
    actionDone(): Promise<void>;
    openAction(kind: TargetReviewActionKind, stepId: string | null): void;
    closeAction(): void;
    dispose(): void;
}

export const TargetReviewPresenter = createAbstraction<ITargetReviewPresenter>(
    "Workflows/TargetReviewPresenter"
);

export namespace TargetReviewPresenter {
    export type Interface = ITargetReviewPresenter;
    export type ViewModel = ITargetReviewViewModel;
}
