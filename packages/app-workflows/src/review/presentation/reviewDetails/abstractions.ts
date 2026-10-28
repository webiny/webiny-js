import { createAbstraction } from "@webiny/feature/admin";
import type { StepStateValue } from "~/review/domain/StepState.js";
import type { TargetReviewActionKind } from "../targetReview/abstractions.js";
import type { TargetReviewActionVm } from "../targetReview/abstractions.js";
import type { TargetReviewOpenAction } from "../targetReview/abstractions.js";
import type { TargetReviewTagVariant } from "../targetReview/abstractions.js";
import type { AttemptOutcomeTone } from "./AttemptOutcomeTone.js";

// Field id → field label of the reviewed content, so AI issues name the field as the form does.
export type ReviewFieldLabels = Record<string, string>;

export interface ReviewDetailsInitParams {
    // The review's namespace; the injected use cases route by it (R347, R353).
    namespace: string;
    reviewId: string;
    reviewsUrl: string | null;
    onClose: () => void;
    // Called after a conflict made the drawer refresh (the editor refreshes its bar). An action
    // that succeeded reaches the bar through the activity signal (R260), not through this.
    onChanged?: () => void;
    // The app's field labels; absent means AI issues show the field id.
    fieldLabels?: ReviewFieldLabels;
    // The content type's label ("Article"), shown before the content title; absent means none.
    contentTypeLabel?: string | null;
    // Where the reviewed content opens; absent means the title is not a link.
    contentUrl?: string | null;
}

export interface ReviewDetailsHeaderVm {
    title: string;
    stateLabel: string;
    stateVariant: TargetReviewTagVariant;
    // "Article · Summer launch (#3)", or "Summer launch (#3)" without a type label.
    contentLabel: string;
    contentUrl: string | null;
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

// One attempt of an AI or automation step (R261): the parts of the row and the task it can open.
export interface ReviewAttemptVm {
    number: number;
    // "#1".
    numberText: string;
    // "10:00–10:05", "since 10:00", or empty when the start is unparsable.
    span: string;
    // "Failed", "Approved", "Running"; an outcome the app does not know is shown as received.
    outcome: string;
    outcomeTone: AttemptOutcomeTone;
    reason: string | null;
    taskId: string | null;
    // True for an operator (workflows editor or reassign) on a row with a task id (R258).
    showTaskLink: boolean;
}

// One issue an AI step reported, as the cells of the design's table (R264).
export interface ReviewAiIssueVm {
    severityLabel: string;
    // The tag treatment of the severity: a warning is the warning tag, every other one neutral.
    severityVariant: TargetReviewTagVariant;
    field: string;
    message: string;
    suggestion: string;
}

export interface ReviewDetailsStepVm {
    stepId: string;
    // Open by default: the step in review, or for a stopped or finished review the step that
    // stopped it or the last approved one.
    expanded: boolean;
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
    // An AI or automation step is running (R263): the tag reads Running with its icon.
    running: boolean;
    // The reason a failed step failed (its comment); `null` for any other step or without one.
    failedReason: string | null;
    attempts: ReviewAttemptVm[];
    issues: ReviewAiIssueVm[];
}

export interface ReviewStepRunPanelRowVm {
    label: string;
    value: string;
}

// The task panel of the drawer (R264): render-ready values only.
export interface ReviewStepRunPanelVm {
    open: boolean;
    loading: boolean;
    error: string | null;
    // The task record no longer exists.
    gone: boolean;
    rows: ReviewStepRunPanelRowVm[];
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
    stepRun: ReviewStepRunPanelVm;
}

export interface IReviewDetailsPresenter {
    readonly vm: IReviewDetailsViewModel;
    init(params: ReviewDetailsInitParams): Promise<void>;
    refresh(): Promise<void>;
    openAction(kind: TargetReviewActionKind, stepId: string | null): void;
    closeAction(): void;
    openStepRun(stepId: string, taskId: string): Promise<void>;
    closeStepRun(): void;
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
