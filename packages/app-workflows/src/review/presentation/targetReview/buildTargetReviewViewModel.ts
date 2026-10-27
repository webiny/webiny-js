import type { ReviewWithFlags } from "~/review/domain/types.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import type { TargetReviewFailureKind } from "./abstractions.js";
import type { ReviewContentNoticeVm } from "./abstractions.js";
import type { TargetReviewOpenAction } from "./abstractions.js";
import type { TargetReviewStatus } from "./abstractions.js";
import type { TargetReviewTag } from "./abstractions.js";
import type { TargetReviewTile } from "./abstractions.js";
import type { TargetReviewPresenter } from "./abstractions.js";
import { getDisplayStep } from "./getDisplayStep.js";
import { getEditorRules } from "./getEditorRules.js";
import { getReviewKind } from "./getReviewKind.js";
import { getReviewActions } from "./getReviewActions.js";
import { getReviewMessage } from "./getReviewMessage.js";
import { getReviewProgress } from "./getReviewProgress.js";
import { getReviewStateTag } from "./getReviewStateTag.js";
import { getStepOwnerLabel } from "./getStepOwnerLabel.js";
import { getStepStateTag } from "./getStepStateTag.js";
import { getStepTagTooltip } from "./getStepTagTooltip.js";
import { isStepRunning } from "./isStepRunning.js";

export interface TargetReviewViewModelInput {
    status: TargetReviewStatus;
    failureKind: TargetReviewFailureKind | null;
    review: ReviewWithFlags | null;
    canRequest: boolean;
    isPublished: boolean;
    isUnpublished: boolean;
    viewerTeamIds: string[];
    targetTitle: string;
    namespace: string;
    targetRevisionId: string;
    busy: boolean;
    openAction: TargetReviewOpenAction | null;
    contentNotice: ReviewContentNoticeVm | null;
}

const getTile = (input: TargetReviewViewModelInput): TargetReviewTile => {
    if (input.status === "failed") {
        return "sync_problem";
    }
    if (input.status !== "active" || input.review === null) {
        return "rule";
    }

    const review = input.review.review;
    if (review.state === ReviewState.Approved) {
        return "check_circle";
    }
    if (review.state === ReviewState.Rejected) {
        return "cancel";
    }

    const display = getDisplayStep(review);
    if (display && display.step.state === StepState.Awaiting) {
        return "hourglass_empty";
    }
    if (display && display.step.state === StepState.Failed) {
        return "sync_problem";
    }
    if (display && isStepRunning(display.step)) {
        return "progress_activity";
    }
    return "rate_review";
};

/*
 * Builds the render-ready view model of the bar from the presenter's private state (R234). Pure:
 * every rule lives in the small functions it calls, so the presenter only holds state.
 */
export const buildTargetReviewViewModel = (
    input: TargetReviewViewModelInput
): TargetReviewPresenter.ViewModel => {
    const withFlags = input.status === "active" ? input.review : null;
    const review = withFlags ? withFlags.review : null;
    const flags = withFlags ? withFlags.flags : null;
    const display = review ? getDisplayStep(review) : null;

    const text = getReviewMessage({
        status: input.status,
        failureKind: input.failureKind,
        review,
        flags,
        isPublished: input.isPublished,
        isUnpublished: input.isUnpublished,
        viewerTeamIds: input.viewerTeamIds
    });
    const reviewKind = getReviewKind(input.status, review);
    const rules = getEditorRules({
        status: input.status,
        reviewKind,
        isUnpublished: input.isUnpublished
    });

    let actions = getReviewActions({ flags, stepId: null, canRequest: false });
    if (input.status === "none") {
        // A published revision with no review was published before the workflow existed: the
        // bar tells the viewer to create a new revision, so it offers no review of this one.
        const canRequest = input.canRequest && !input.isPublished;
        actions = getReviewActions({ flags: null, stepId: null, canRequest });
    }
    if (review) {
        const stepId = display ? display.step.id : null;
        actions = getReviewActions({ flags, stepId, canRequest: false });
    }

    let stepMeta: string | null = null;
    let ownerMeta: string | null = null;
    let stepStateTag: TargetReviewTag | null = null;
    let stepStateTooltip: string | null = null;
    if (display) {
        const ownerLabel = getStepOwnerLabel(display.step);
        const running = isStepRunning(display.step);
        stepMeta = `Step ${display.index + 1} of ${display.total}: ${display.step.title}`;
        ownerMeta = `Owner: ${ownerLabel}`;
        stepStateTag = getStepStateTag(display.step.state, running);
        stepStateTooltip = getStepTagTooltip(display.step);
    }

    return {
        status: input.status,
        failureKind: input.failureKind,
        reviewKind,
        targetTitle: input.targetTitle,
        namespace: input.namespace,
        targetRevisionId: input.targetRevisionId,
        message: text.message,
        lockText: text.lockText,
        tile: getTile(input),
        stateTag: review ? getReviewStateTag(review.state) : null,
        stepStateTag,
        stepStateTooltip,
        stepMeta,
        ownerMeta,
        progress: review ? getReviewProgress(review) : null,
        actions,
        allowsEditing: rules.allowsEditing,
        allowsPublishing: rules.allowsPublishing,
        publishDisabledReason: rules.publishDisabledReason,
        moveDisabledReason: rules.moveDisabledReason,
        reviewId: review ? review.id : null,
        openAction: input.openAction,
        busy: input.busy,
        contentNotice: input.contentNotice
    };
};
