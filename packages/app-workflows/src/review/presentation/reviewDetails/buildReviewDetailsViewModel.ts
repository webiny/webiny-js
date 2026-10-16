import type { Review } from "~/review/domain/types.js";
import type { ReviewAssignmentEntry } from "~/review/domain/types.js";
import type { ReviewStep } from "~/review/domain/types.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import { formatReviewTime } from "../actionDialog/formatReviewTime.js";
import { getRejectionText } from "../targetReview/getRejectionText.js";
import { getReviewActions } from "../targetReview/getReviewActions.js";
import { getReviewStateTag } from "../targetReview/getReviewStateTag.js";
import { getStepOwnerLabel } from "../targetReview/getStepOwnerLabel.js";
import { getStepStateTag } from "../targetReview/getStepStateTag.js";
import { getStepTypeLabel } from "../requestReview/getStepTypeLabel.js";
import type { ReviewDetailsHeaderVm } from "./abstractions.js";
import type { ReviewDetailsSkippedVm } from "./abstractions.js";
import type { ReviewDetailsStatus } from "./abstractions.js";
import type { ReviewDetailsStepVm } from "./abstractions.js";
import type { TargetReviewOpenAction } from "../targetReview/abstractions.js";
import { getRevisionNumber } from "./getRevisionNumber.js";
import { formatReviewTimeFull } from "./formatReviewTimeFull.js";
import { getStepTimes } from "./getStepTimes.js";
import { getStepTimesTitle } from "./getStepTimesTitle.js";
import { REVIEW_STATE_LABELS } from "../targetReview/reviewStateLabels.js";
import { getWhyOwner } from "./getWhyOwner.js";
import type { ReviewDetailsPresenter } from "./abstractions.js";

export interface ReviewDetailsViewModelInput {
    status: ReviewDetailsStatus;
    review: ReviewWithFlags | null;
    error: string | null;
    openAction: TargetReviewOpenAction | null;
    now: Date;
}

const getComment = (step: ReviewStep): string | null => {
    const comment = step.comment ? step.comment.trim() : "";
    if (comment !== "") {
        const owner = getStepOwnerLabel(step);
        return `${owner}: “${comment}”`;
    }
    if (step.state === StepState.Rejected) {
        return getRejectionText(step);
    }
    return null;
};

/*
 * The lead of a skipped entry while the server could not resolve a name (`userDisplayName` is
 * `null` or blank, R251). A raw user id is never shown.
 */
export const SKIPPED_PERSON_LABEL = "A person";

const getSkippedName = (entry: ReviewAssignmentEntry): string => {
    if (entry.userDisplayName === null) {
        return SKIPPED_PERSON_LABEL;
    }
    const name = entry.userDisplayName.trim();
    if (name === "") {
        return SKIPPED_PERSON_LABEL;
    }
    return name;
};

const getCancelledText = (review: Review, now: Date): string => {
    let who = "Someone";
    if (review.cancelledBy !== null) {
        const name = review.cancelledBy.displayName.trim();
        if (name !== "") {
            who = name;
        }
    }
    const time = formatReviewTime(review.lastChangedOn, now);
    return `${who} cancelled this review at ${time}. The revision has no review now; a new request starts again from the first step.`;
};

const getSkipped = (step: ReviewStep): ReviewDetailsSkippedVm[] | null => {
    if (step.assignments === null) {
        return null;
    }
    const skipped = step.assignments
        .filter(entry => entry.kind === "skip")
        .map(entry => {
            return {
                id: entry.id,
                name: getSkippedName(entry),
                reason: entry.reason ? entry.reason : ""
            };
        });
    if (skipped.length === 0) {
        return null;
    }
    return skipped;
};

const getStepVm = (step: ReviewStep, now: Date): ReviewDetailsStepVm => {
    const tag = getStepStateTag(step.state);
    const reached = step.state !== StepState.Pending;
    let ownerLine: string | null = null;
    if (reached) {
        ownerLine = getStepOwnerLabel(step);
    }
    return {
        stepId: step.id,
        title: step.title,
        color: step.color,
        typeLabel: getStepTypeLabel(step.type),
        state: step.state,
        stateLabel: tag.label,
        stateVariant: tag.variant,
        ownerLine,
        whyOwner: getWhyOwner(step),
        times: getStepTimes(step, now),
        timesTitle: getStepTimesTitle(step),
        comment: getComment(step),
        skipped: getSkipped(step)
    };
};

/*
 * The render-ready view model of the drawer (R234). Pure. `now` is a parameter so times are
 * deterministic. A cancelled review keeps its header and loses timeline and actions (QBZ-1).
 */
export const buildReviewDetailsViewModel = (
    input: ReviewDetailsViewModelInput
): ReviewDetailsPresenter.ViewModel => {
    const { status, review: withFlags, error, openAction, now } = input;

    if (status !== "loaded" || withFlags === null) {
        return {
            status,
            header: null,
            steps: [],
            cancelledText: null,
            actions: [],
            error,
            openAction,
            reviewId: null
        };
    }

    const review = withFlags.review;
    const stateTag = getReviewStateTag(review.state);
    let stateVariant: ReviewDetailsHeaderVm["stateVariant"] = "neutral-base-outline";
    if (stateTag) {
        stateVariant = stateTag.variant;
    }
    const stateLabel = REVIEW_STATE_LABELS[review.state];
    const revision = getRevisionNumber(review.targetRevisionId);
    let contentLine = `Content: ${review.targetContext.title}`;
    if (revision !== null) {
        contentLine = `${contentLine} (#${revision})`;
    }

    const header: ReviewDetailsHeaderVm = {
        title: review.title,
        stateLabel,
        stateVariant,
        contentLine,
        requesterLine: `Requester: ${review.createdBy.displayName}`,
        requestedLine: `Requested: ${formatReviewTime(review.createdOn, now)}`,
        requestedTitle: formatReviewTimeFull(review.createdOn)
    };

    if (review.state === ReviewState.Cancelled) {
        return {
            status,
            header,
            steps: [],
            cancelledText: getCancelledText(review, now),
            actions: [],
            error: null,
            openAction,
            reviewId: review.id
        };
    }

    return {
        status,
        header,
        steps: review.steps.map(step => getStepVm(step, now)),
        cancelledText: null,
        actions: getReviewActions({
            flags: withFlags.flags,
            stepId: review.currentStepId,
            canRequest: false
        }),
        error: null,
        openAction,
        reviewId: review.id
    };
};
