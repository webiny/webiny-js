import type { Review } from "~/review/domain/types.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import { getStepOwnerLabel } from "../targetReview/getStepOwnerLabel.js";
import { isStepRunning } from "../targetReview/isStepRunning.js";
import { formatReviewTime } from "./formatReviewTime.js";
import type { ReviewActionKind } from "./ReviewActionKind.js";

export interface ConflictMessageParams {
    kind: ReviewActionKind;
    stepId: string | null;
    // The review re-read after the conflict; `null` when the re-read failed.
    review: Review | null;
    now: Date;
    // Content Reviews refreshes its list behind a conflicting action (R220, QBZ-31).
    listRefreshed: boolean;
}

export interface ConflictMessage {
    title: string;
    message: string;
}

const TITLE = "Someone else acted first";
const LIST_REFRESHED = "The list has been refreshed.";

// `{action}` of QBZ-2: the user's action as a noun.
const ACTION_NOUNS: Record<ReviewActionKind, string> = {
    start: "start",
    takeOver: "take-over",
    reassign: "reassignment",
    approve: "approval",
    reject: "rejection",
    cancel: "cancellation",
    restart: "restart"
};

/*
 * One message per cause (QBZ-2), read from the re-read review. Pure. The time is the review's
 * `lastChangedOn`; a review that cannot be re-read gets a generic text.
 */
export const getConflictMessage = (params: ConflictMessageParams): ConflictMessage => {
    const result = getCauseMessage(params);
    if (!params.listRefreshed) {
        return result;
    }
    // R220: a conflict on any action started from Content Reviews ends with the list note.
    return { title: result.title, message: `${result.message} ${LIST_REFRESHED}` };
};

const getCauseMessage = (params: ConflictMessageParams): ConflictMessage => {
    const { kind, stepId, review, now } = params;
    const noun = ACTION_NOUNS[kind];

    if (review === null) {
        return {
            title: TITLE,
            message: `Someone else changed this review, so your ${noun} was not saved.`
        };
    }

    const time = formatReviewTime(review.lastChangedOn, now);

    if (review.state === ReviewState.Cancelled || !review.isActive) {
        return {
            title: TITLE,
            message: `Someone cancelled this review at ${time}, so your ${noun} was not saved. The revision has no review now.`
        };
    }

    const step = review.steps.find(item => item.id === stepId);
    if (!step) {
        return {
            title: TITLE,
            message: `Someone else changed this review, so your ${noun} was not saved.`
        };
    }

    const name = getStepOwnerLabel(step);

    // R266: a restart that lost a race with another restart. The review does not store who
    // restarted, so the text says "Someone" (the design names the person).
    if (kind === "restart" && isStepRunning(step)) {
        return {
            title: TITLE,
            message: `Someone restarted “${step.title}” at ${time}. It is running again, so your ${noun} was not saved.`
        };
    }

    if (step.state === StepState.Approved) {
        return {
            title: TITLE,
            message: `${name} approved “${step.title}” at ${time}, so your ${noun} was not saved. The review moved on to the next step.`
        };
    }
    if (step.state === StepState.Rejected) {
        return {
            title: TITLE,
            message: `${name} rejected “${step.title}” at ${time}, so your ${noun} was not saved. This revision is now rejected.`
        };
    }

    const assignment = step.assignment;
    if (assignment && assignment.source === "reassign") {
        const operator = assignment.by ? assignment.by.displayName : "Someone";
        return {
            title: TITLE,
            message: `${operator} reassigned “${step.title}” to ${name} at ${time}, so your ${noun} was not saved.`
        };
    }
    if (kind === "start" && step.owner !== null) {
        return {
            title: TITLE,
            message: `${name} started “${step.title}” at ${time}. You can still take it over.`
        };
    }
    if (assignment && assignment.source === "takeOver") {
        return {
            title: TITLE,
            message: `${name} took over “${step.title}” at ${time}, so your ${noun} was not saved.`
        };
    }

    return {
        title: TITLE,
        message: `Someone else changed “${step.title}” at ${time}, so your ${noun} was not saved.`
    };
};
