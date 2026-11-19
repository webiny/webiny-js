import type { Review } from "~/review/domain/types.js";
import type { ReviewStep } from "~/review/domain/types.js";
import type { ReviewViewerFlags } from "~/review/domain/types.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import type { TargetReviewFailureKind } from "./abstractions.js";
import type { TargetReviewStatus } from "./abstractions.js";
import { NO_ACCESS_MESSAGE } from "../noAccessMessage.js";
import { getDisplayStep } from "./getDisplayStep.js";
import { getRejectionText } from "./getRejectionText.js";
import { getStepOwnerLabel } from "./getStepOwnerLabel.js";
import { getStepRunMessage } from "./getStepRunMessage.js";
import { getTeamNames } from "./getTeamNames.js";
import type { ReviewLockCopy } from "./ReviewLockCopy.js";

export interface ReviewMessageParams {
    status: TargetReviewStatus;
    failureKind: TargetReviewFailureKind | null;
    review: Review | null;
    flags: ReviewViewerFlags | null;
    isPublished: boolean;
    isUnpublished: boolean;
    // The ids of the viewer's own teams (`Identity.teams`), for the QBZ-25 wording (R232, R247).
    viewerTeamIds: string[];
    // The app's own lock texts; the default texts apply when it has none.
    lockCopy?: ReviewLockCopy;
}

export interface ReviewMessage {
    message: string;
    lockText: string | null;
}

const NO_REVIEW: ReviewMessage = {
    message: "This content needs a review before it can be published.",
    lockText: "Publishing needs an approved review."
};

const LEGACY_PUBLISHED: ReviewMessage = {
    message: "This content needs review before publishing (applies to new revisions)",
    lockText:
        "This revision was published before the workflow existed. Create a new revision to change it."
};

const DEFAULT_LOCK_COPY: ReviewLockCopy = {
    inReview: "Editing, publishing and moving are locked while this revision is in review.",
    approved: "Editing is locked. To make changes, create a new revision; it needs a new review."
};

const LOCK_REJECTED =
    "This revision is locked. Create a new revision to fix it, then request a new review.";

/*
 * The viewer's own teams among the step's candidate teams joined with " and " (QBZ-25); a viewer
 * outside them gets every candidate team joined with ", " (R232).
 */
const getPoolNames = (step: ReviewStep, viewerTeamIds: string[]): string => {
    const own = step.candidateTeams.filter(team => viewerTeamIds.includes(team.id));
    if (own.length > 0) {
        return own.map(team => team.name).join(" and ");
    }
    return getTeamNames(step);
};

const getInProgressMessage = (
    review: Review,
    flags: ReviewViewerFlags | null,
    viewerTeamIds: string[],
    lockCopy: ReviewLockCopy
): ReviewMessage => {
    const lockInReview = lockCopy.inReview;
    const display = getDisplayStep(review);
    if (!display) {
        return { message: "Review in progress", lockText: lockInReview };
    }

    const step = display.step;
    if (step.state === StepState.Awaiting && step.owner === null) {
        const names = getPoolNames(step, viewerTeamIds);
        if (names === "") {
            return { message: "Waiting in the team pool.", lockText: lockInReview };
        }
        return { message: `Waiting in the ${names} team pool.`, lockText: lockInReview };
    }

    // A running or failed step says so, before any owner wording (R263).
    const runMessage = getStepRunMessage(step);
    if (runMessage !== null) {
        return { message: runMessage, lockText: lockInReview };
    }

    if (step.owner === null) {
        return { message: "Review in progress", lockText: lockInReview };
    }

    // Approving is owner-only on the server, so the flag tells us the viewer owns the step.
    if (flags && flags.canApprove) {
        return { message: "You are reviewing this step.", lockText: lockInReview };
    }

    const ownerLabel = getStepOwnerLabel(step);
    return { message: `${ownerLabel} is reviewing this step.`, lockText: lockInReview };
};

/*
 * The bar's message and lock text (README 6, R225, R226, R232, R263). Pure. A running step reads
 * "{Step} running since {hh:mm}" and a failed one "{Step} failed: {reason}".
 */
export const getReviewMessage = (params: ReviewMessageParams): ReviewMessage => {
    const { status, failureKind, review, flags, isPublished, isUnpublished, viewerTeamIds } =
        params;
    const lockCopy = params.lockCopy ?? DEFAULT_LOCK_COPY;
    const lockApproved = lockCopy.approved;

    if (status === "loading") {
        return { message: "Loading review status…", lockText: null };
    }

    if (status === "failed") {
        if (failureKind === "noAccess") {
            return { message: NO_ACCESS_MESSAGE, lockText: null };
        }
        return {
            message: "Could not load the review status",
            lockText: "Editing and publishing are unavailable until it loads."
        };
    }

    if (status === "noWorkflow") {
        return { message: "", lockText: null };
    }

    if (status === "none" || review === null || review.state === ReviewState.Cancelled) {
        if (isPublished) {
            return LEGACY_PUBLISHED;
        }
        return NO_REVIEW;
    }

    if (review.state === ReviewState.Approved) {
        if (isPublished) {
            return { message: "Approved and published", lockText: lockApproved };
        }
        if (isUnpublished) {
            return {
                message: "Approved and unpublished. Publishing again needs no new review.",
                lockText: lockApproved
            };
        }
        return { message: "Every step approved. Ready to publish.", lockText: lockApproved };
    }

    if (review.state === ReviewState.Rejected) {
        const display = getDisplayStep(review);
        if (!display) {
            return { message: "Rejected", lockText: LOCK_REJECTED };
        }
        const rejection = getRejectionText(display.step);
        return { message: rejection, lockText: LOCK_REJECTED };
    }

    return getInProgressMessage(review, flags, viewerTeamIds, lockCopy);
};
