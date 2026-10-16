import { MOVE_BLOCKED_IN_REVIEW } from "./moveBlockedInReview.js";
import type { TargetReviewKind } from "./abstractions.js";
import type { TargetReviewStatus } from "./abstractions.js";

export interface EditorRulesParams {
    status: TargetReviewStatus;
    reviewKind: TargetReviewKind;
    // The revision was published before and is not published now (R226, Q19).
    isUnpublished: boolean;
}

export interface EditorRules {
    allowsEditing: boolean;
    allowsPublishing: boolean;
    publishDisabledReason: string | null;
    moveDisabledReason: string | null;
}

const CHECKING = "Checking review status…";
const FAILED = "The review status could not be loaded. Try again from the review bar.";
const NEEDS_REVIEW = "Publishing needs an approved review. Request a review first.";
const REJECTED = "This revision was rejected. Create a new revision, then request a new review.";
const IN_REVIEW = "This revision is in review. Publishing is allowed once every step approves.";

/*
 * Who may edit, publish and move (R226, D79, D80, D85, D121). Unknown status locks everything
 * (QBZ-1); no active review (including a cancelled one) unlocks editing (D75). A revision with no
 * review that was published before and is unpublished now may publish again (Q19: it was reviewed
 * before it was published). Switches on `status`, `reviewKind` and `isUnpublished` only. Pure.
 */
export const getEditorRules = (params: EditorRulesParams): EditorRules => {
    const { status, reviewKind, isUnpublished } = params;

    if (status === "loading") {
        return {
            allowsEditing: false,
            allowsPublishing: false,
            publishDisabledReason: CHECKING,
            moveDisabledReason: CHECKING
        };
    }

    if (status === "failed") {
        return {
            allowsEditing: false,
            allowsPublishing: false,
            publishDisabledReason: FAILED,
            moveDisabledReason: FAILED
        };
    }

    if (status === "noWorkflow") {
        return {
            allowsEditing: true,
            allowsPublishing: true,
            publishDisabledReason: null,
            moveDisabledReason: null
        };
    }

    if (reviewKind === "none" && isUnpublished) {
        return {
            allowsEditing: true,
            allowsPublishing: true,
            publishDisabledReason: null,
            moveDisabledReason: null
        };
    }

    if (reviewKind === "none") {
        return {
            allowsEditing: true,
            allowsPublishing: false,
            publishDisabledReason: NEEDS_REVIEW,
            moveDisabledReason: null
        };
    }

    if (reviewKind === "approved") {
        return {
            allowsEditing: false,
            allowsPublishing: true,
            publishDisabledReason: null,
            moveDisabledReason: null
        };
    }

    if (reviewKind === "rejected") {
        return {
            allowsEditing: false,
            allowsPublishing: false,
            publishDisabledReason: REJECTED,
            moveDisabledReason: null
        };
    }

    return {
        allowsEditing: false,
        allowsPublishing: false,
        publishDisabledReason: IN_REVIEW,
        moveDisabledReason: MOVE_BLOCKED_IN_REVIEW
    };
};
