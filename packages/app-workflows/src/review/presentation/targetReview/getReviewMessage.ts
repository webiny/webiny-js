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

export interface ReviewMessageParams {
    status: TargetReviewStatus;
    failureKind: TargetReviewFailureKind | null;
    review: Review | null;
    flags: ReviewViewerFlags | null;
    isPublished: boolean;
    isUnpublished: boolean;
    // The ids of the viewer's own teams (`Identity.teams`), for the QBZ-25 wording (R232, R247).
    viewerTeamIds: string[];
}

export interface ReviewMessage {
    message: string;
    lockText: string | null;
}

const NO_REVIEW: ReviewMessage = {
    message: "This content needs review before publishing",
    lockText: "Publishing needs an approved review."
};

const LEGACY_PUBLISHED: ReviewMessage = {
    message: "This content needs review before publishing (applies to new revisions)",
    lockText:
        "This revision was published before the workflow existed. Create a new revision to change it."
};

const LOCK_IN_REVIEW =
    "Editing, publishing and moving are locked while this revision is in review.";

const LOCK_APPROVED =
    "Editing is locked. To make changes, create a new revision; it needs a new review.";

const LOCK_REJECTED =
    "This revision is locked for good. Create a new revision to fix it, then request a new review.";

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
    viewerTeamIds: string[]
): ReviewMessage => {
    const display = getDisplayStep(review);
    if (!display) {
        return { message: "Review in progress", lockText: LOCK_IN_REVIEW };
    }

    const step = display.step;
    if (step.state === StepState.Awaiting && step.owner === null) {
        const names = getPoolNames(step, viewerTeamIds);
        if (names === "") {
            return { message: "Waiting in the team pool", lockText: LOCK_IN_REVIEW };
        }
        return { message: `Waiting in the ${names} team pool`, lockText: LOCK_IN_REVIEW };
    }

    // A running or failed step says so, before any owner wording (R263).
    const runMessage = getStepRunMessage(step);
    if (runMessage !== null) {
        return { message: runMessage, lockText: LOCK_IN_REVIEW };
    }

    if (step.owner === null) {
        return { message: "Review in progress", lockText: LOCK_IN_REVIEW };
    }

    // Approving is owner-only on the server, so the flag tells us the viewer owns the step.
    if (flags && flags.canApprove) {
        return { message: "You are reviewing this step", lockText: LOCK_IN_REVIEW };
    }

    const ownerLabel = getStepOwnerLabel(step);
    return { message: `${ownerLabel} is reviewing`, lockText: LOCK_IN_REVIEW };
};

/*
 * The bar's message and lock text (README 6, R225, R226, R232, R263). Pure. A running step reads
 * "{Step} running since {hh:mm}" and a failed one "{Step} failed: {reason}".
 */
export const getReviewMessage = (params: ReviewMessageParams): ReviewMessage => {
    const { status, failureKind, review, flags, isPublished, isUnpublished, viewerTeamIds } =
        params;

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
            return { message: "Approved and published", lockText: LOCK_APPROVED };
        }
        if (isUnpublished) {
            return {
                message: "Approved and unpublished. Publishing again needs no new review.",
                lockText: LOCK_APPROVED
            };
        }
        return { message: "Approved, ready to publish", lockText: LOCK_APPROVED };
    }

    if (review.state === ReviewState.Rejected) {
        const display = getDisplayStep(review);
        if (!display) {
            return { message: "Rejected", lockText: LOCK_REJECTED };
        }
        const rejection = getRejectionText(display.step);
        return { message: rejection, lockText: LOCK_REJECTED };
    }

    return getInProgressMessage(review, flags, viewerTeamIds);
};
