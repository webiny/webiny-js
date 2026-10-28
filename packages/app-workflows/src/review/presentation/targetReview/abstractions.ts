import { createAbstraction } from "@webiny/feature/admin";
import type { ReviewTarget } from "~/review/domain/types.js";
import type { IReviewContentReloader } from "~/review/content/IReviewContentReloader.js";
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
    | "progress_activity"
    | "hourglass_empty"
    | "sync_problem"
    | "check_circle"
    | "cancel";

// The icon of a step tag: only the running tag has one (R263).
export type TargetReviewTagIcon = "progress_activity" | "sync_problem";

export interface TargetReviewTag {
    label: string;
    variant: TargetReviewTagVariant;
    icon?: TargetReviewTagIcon;
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
    // The decision comment of the step.
    comment: string | null;
    tag: TargetReviewTag;
    // "{Step} running since {hh:mm}" or "{Step} failed: {reason}", else `null` (R263).
    message: string | null;
    // The tag tooltip of a running or failed step (R264), else `null`.
    tooltip: string | null;
}

export interface TargetReviewProgressVm {
    approved: number;
    total: number;
    segments: TargetReviewSegmentVm[];
}

// The icon of the "Content updated by {step}" notice: AI `auto_awesome`, automation `bolt` (R262).
export type ReviewContentNoticeIcon = "bolt" | "auto_awesome";

export interface ReviewContentNoticeVm {
    text: string;
    icon: ReviewContentNoticeIcon;
}

export interface TargetReviewOpenAction {
    kind: TargetReviewActionKind;
    stepId: string | null;
    /*
     * The review the action was opened on; `null` for "request". Kept with the action, so a
     * refresh that drops the review (a conflict on a cancelled review) keeps the dialog open.
     */
    reviewId: string | null;
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
    // The hover text of the step tag of a running or failed step (R264), else `null`.
    stepStateTooltip: string | null;
    stepMeta: string | null;
    // The colour of the step the review is on, `null` once the review has no current step.
    stepColor: string | null;
    ownerName: string | null;
    progress: TargetReviewProgressVm | null;
    actions: TargetReviewActionVm[];
    allowsEditing: boolean;
    allowsPublishing: boolean;
    publishDisabledReason: string | null;
    moveDisabledReason: string | null;
    reviewId: string | null;
    openAction: TargetReviewOpenAction | null;
    busy: boolean;
    // Set after an AI or automation step changed the locked content and the editor reloaded it.
    contentNotice: ReviewContentNoticeVm | null;
}

// What the editor knows about the content and may change while the editor is open.
export interface TargetReviewContext {
    targetTitle: string;
    canRequest: boolean;
    isPublished: boolean;
    // The revision was published before and is unpublished now (R226, R-h).
    isUnpublished: boolean;
}

// The presenter injects its use cases (R352); the target names the namespace they route by.
export interface TargetReviewInitParams extends TargetReviewContext {
    target: ReviewTarget;
    // How the editor reloads the content after an automated step changed it (R262); `null` for none.
    contentReloader: IReviewContentReloader | null;
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
