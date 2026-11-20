import type { Review } from "~/review/domain/types.js";
import type { ReviewAssignmentEntry } from "~/review/domain/types.js";
import type { ReviewStep } from "~/review/domain/types.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";
import { formatReviewTime } from "../actionDialog/formatReviewTime.js";
import { getRejectionText } from "../targetReview/getRejectionText.js";
import { getReviewActions } from "../targetReview/getReviewActions.js";
import { getReviewStateTag } from "../targetReview/getReviewStateTag.js";
import { getStepOwnerLabel } from "../targetReview/getStepOwnerLabel.js";
import { getAiIssues } from "./getAiIssues.js";
import { getAttempts } from "./getAttempts.js";
import { getStepStateTag } from "../targetReview/getStepStateTag.js";
import { isStepRunning } from "../targetReview/isStepRunning.js";
import { getStepTypeLabel } from "../requestReview/getStepTypeLabel.js";
import type { ReviewDetailsHeaderVm } from "./abstractions.js";
import type { ReviewDetailsSkippedVm } from "./abstractions.js";
import type { ReviewDetailsStatus } from "./abstractions.js";
import type { ReviewDetailsStepVm } from "./abstractions.js";
import type { ReviewStepRunPanelVm } from "./abstractions.js";
import type { TargetReviewOpenAction } from "../targetReview/abstractions.js";
import type { TargetReviewActionVm } from "../targetReview/abstractions.js";
import type { TargetReviewTag } from "../targetReview/abstractions.js";
import { getRevisionNumber } from "./getRevisionNumber.js";
import { formatReviewTimeFull } from "./formatReviewTimeFull.js";
import { getExpandedStepId } from "./getExpandedStepId.js";
import { getStepTimes } from "./getStepTimes.js";
import { getStepTimesTitle } from "./getStepTimesTitle.js";
import { REVIEW_STATE_LABELS } from "../targetReview/reviewStateLabels.js";
import { getWhyOwner } from "./getWhyOwner.js";
import type { ReviewDetailsPresenter } from "./abstractions.js";
import type { ReviewFieldLabels } from "./abstractions.js";

export interface ReviewDetailsViewModelInput {
    status: ReviewDetailsStatus;
    review: ReviewWithFlags | null;
    error: string | null;
    openAction: TargetReviewOpenAction | null;
    // The viewer may open the background task of an attempt: workflows editor or reassign (R258).
    canViewStepRun: boolean;
    stepRun: ReviewStepRunPanelVm;
    now: Date;
    // Names the fields of AI issues (RD5); empty when the host has none.
    fieldLabels: ReviewFieldLabels;
    // The content type's label and the link to the content; `null` when the host has none.
    contentTypeLabel: string | null;
    contentUrl: string | null;
}

const BARE_TIME = /^\d{2}:\d{2}$/;
const YESTERDAY_TIME = /^Yesterday (\d{2}:\d{2})$/;
const DATE_TIME = /^(.+), (\d{2}:\d{2})$/;

// The reason of a failed step has its own field and box (`failedReason`), not a quoted comment.
const getComment = (step: ReviewStep): string | null => {
    if (step.state === StepState.Failed) {
        return null;
    }
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

// "This review was cancelled by Nina Cole on Tue 6 Oct 2026, 14:20 CEST." The date comes from
// the full formatter of the hover texts; an unparsable date drops the "on" part.
const getCancelledText = (review: Review): string => {
    let who = "Someone";
    if (review.cancelledBy !== null) {
        const name = review.cancelledBy.displayName.trim();
        if (name !== "") {
            who = name;
        }
    }
    const date = formatReviewTimeFull(review.lastChangedOn);
    if (date === "") {
        return `This review was cancelled by ${who}.`;
    }
    return `This review was cancelled by ${who} on ${date}.`;
};

// A step that was not finished when the review was cancelled shows a neutral Cancelled tag.
const UNFINISHED_STATES: StepStateValue[] = [
    StepState.Awaiting,
    StepState.InReview,
    StepState.Failed
];

const CANCELLED_STEP_TAG: TargetReviewTag = {
    label: "Cancelled",
    variant: "neutral-base-outline"
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

// "Failed at 10:05: reason", the time in the format of the Times row (DS 2.0). Without a usable
// time the message reads "Failed: reason".
const getFailedReason = (step: ReviewStep, now: Date): string | null => {
    if (step.state !== StepState.Failed) {
        return null;
    }
    const reason = step.comment ? step.comment.trim() : "";
    if (reason === "") {
        return null;
    }
    const failedOn = step.finishedOn ?? step.startedOn ?? step.reachedOn;
    const time = failedOn === null ? "" : formatReviewTime(failedOn, now);
    if (time === "") {
        return `Failed: ${reason}`;
    }
    return `Failed at ${time}: ${reason}`;
};

const getStepVm = (
    step: ReviewStep,
    now: Date,
    canViewStepRun: boolean,
    fieldLabels: ReviewFieldLabels,
    expandedStepId: string | null,
    cancelled: boolean
): ReviewDetailsStepVm => {
    let running = isStepRunning(step);
    let tag = getStepStateTag(step.state, running);
    if (cancelled && UNFINISHED_STATES.includes(step.state)) {
        running = false;
        tag = CANCELLED_STEP_TAG;
    }
    const reached = step.state !== StepState.Pending;
    let ownerLine: string | null = null;
    if (reached) {
        ownerLine = getStepOwnerLabel(step);
    }
    return {
        stepId: step.id,
        expanded: step.id === expandedStepId,
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
        skipped: getSkipped(step),
        running,
        failedReason: getFailedReason(step, now),
        attempts: getAttempts(step, canViewStepRun),
        issues: getAiIssues(step, fieldLabels)
    };
};

/*
 * The render-ready view model of the drawer (R234). Pure. `now` is a parameter so times are
 * deterministic. A cancelled review keeps its header and keeps its steps read-only and loses actions (QBZ-1).
 */
export const buildReviewDetailsViewModel = (
    input: ReviewDetailsViewModelInput
): ReviewDetailsPresenter.ViewModel => {
    const { status, review: withFlags, error, openAction, canViewStepRun, stepRun, now } = input;
    const { fieldLabels } = input;

    if (status !== "loaded" || withFlags === null) {
        return {
            status,
            header: null,
            steps: [],
            cancelledText: null,
            actions: [],
            error,
            openAction,
            reviewId: null,
            stepRun
        };
    }

    const review = withFlags.review;
    const stateTag = getReviewStateTag(review.state);
    // Only a finished review has a state tag; a cancelled one keeps its own.
    let headerTag: TargetReviewTag | null = stateTag;
    if (review.state === ReviewState.Cancelled) {
        headerTag = {
            label: REVIEW_STATE_LABELS[review.state],
            variant: "neutral-base-outline"
        };
    }
    const revision = getRevisionNumber(review.targetRevisionId);
    let contentLabel = review.targetContext.title;
    if (revision !== null) {
        contentLabel = `${contentLabel} (#${revision})`;
    }
    if (input.contentTypeLabel) {
        contentLabel = `${input.contentTypeLabel} · ${contentLabel}`;
    }
    // The formatter returns a bare clock time, `Yesterday {time}` or `{date}, {time}` (follows the viewer's day boundary);
    // the requested line reads them as "today at", "yesterday at" and "on {date} at".
    let requestedText = formatReviewTime(review.createdOn, now);
    if (BARE_TIME.test(requestedText)) {
        requestedText = `today at ${requestedText}`;
    } else if (YESTERDAY_TIME.test(requestedText)) {
        requestedText = requestedText.replace(YESTERDAY_TIME, "yesterday at $1");
    } else if (DATE_TIME.test(requestedText)) {
        requestedText = requestedText.replace(DATE_TIME, "on $1 at $2");
    }

    const header: ReviewDetailsHeaderVm = {
        title: review.title,
        stateTag: headerTag,
        contentLabel,
        contentUrl: input.contentUrl,
        requesterLine: `Requested by ${review.createdBy.displayName}`,
        requestedLine: `Requested ${requestedText}`,
        requestedTitle: formatReviewTimeFull(review.createdOn)
    };

    // A cancelled review is read-only: no step open by default and no actions.
    const cancelled = review.state === ReviewState.Cancelled;
    let expandedStepId: string | null = null;
    if (!cancelled) {
        expandedStepId = getExpandedStepId(review.steps);
    }
    let actions: TargetReviewActionVm[] = [];
    let cancelledText: string | null = null;
    if (cancelled) {
        cancelledText = getCancelledText(review);
    } else {
        actions = getReviewActions({
            flags: withFlags.flags,
            stepId: review.currentStepId,
            canRequest: false,
            requestBlockReason: null
        });
    }

    return {
        status,
        header,
        steps: review.steps.map(step => {
            return getStepVm(step, now, canViewStepRun, fieldLabels, expandedStepId, cancelled);
        }),
        cancelledText,
        actions,
        error: null,
        openAction,
        reviewId: review.id,
        stepRun
    };
};
