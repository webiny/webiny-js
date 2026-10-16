import type { Review } from "~/review/domain/types.js";
import { REJECT_COMMENT_MIN_LENGTH } from "~/review/domain/constants.js";
import { getStepOwnerLabel } from "../targetReview/getStepOwnerLabel.js";
import type { ReviewActionKind } from "./ReviewActionKind.js";

export interface ActionDialogCopyParams {
    kind: ReviewActionKind;
    review: Review;
    stepId: string | null;
    comment: string;
}

export interface ActionDialogCopy {
    title: string;
    body: string;
    showComment: boolean;
    commentLabel: string;
    commentCounter: string | null;
    showNotify: boolean;
    notifyLabel: string | null;
    confirmLabel: string;
    cancelLabel: string;
    canSubmit: boolean;
}

// The design copy of the five dialogs (README 6, QBZ-5, QBZ-31, QBZ-50, QBZ-51). Pure.
export const getActionDialogCopy = (params: ActionDialogCopyParams): ActionDialogCopy => {
    const { kind, review, stepId, comment } = params;
    const step = review.steps.find(item => item.id === stepId);
    const stepTitle = step ? step.title : "";
    const base: ActionDialogCopy = {
        title: "",
        body: "",
        showComment: false,
        commentLabel: "",
        commentCounter: null,
        showNotify: false,
        notifyLabel: null,
        confirmLabel: "",
        cancelLabel: "Cancel",
        canSubmit: true
    };

    if (kind === "start") {
        return {
            ...base,
            title: `Start “${stepTitle}”?`,
            body: `You become the owner of this step on “${review.title}” and it leaves the team pool.`,
            confirmLabel: "Start"
        };
    }

    if (kind === "takeOver") {
        const owner = step ? getStepOwnerLabel(step) : "";
        const firstName = owner.split(" ")[0];
        const ownerIsPerson =
            step !== undefined && step.owner !== null && step.owner.type === "user";
        let notifyLabel: string | null = null;
        if (ownerIsPerson) {
            notifyLabel = `Notify ${owner} that you took over`;
        }
        return {
            ...base,
            title: "Take over this step?",
            body: `${owner} is reviewing “${stepTitle}”. If you take over, you become the owner and ${firstName} can no longer approve or reject it.`,
            showNotify: ownerIsPerson,
            notifyLabel,
            confirmLabel: "Take over"
        };
    }

    if (kind === "approve") {
        return {
            ...base,
            title: `Approve “${stepTitle}”`,
            showComment: true,
            commentLabel: "Comment (optional)",
            confirmLabel: "Approve"
        };
    }

    if (kind === "reject") {
        const length = comment.trim().length;
        return {
            ...base,
            title: `Reject “${stepTitle}”`,
            body: "Rejection is final for this revision. The requester will need to create a new revision, fix the issues and request a new review.",
            showComment: true,
            commentLabel: "Comment *",
            commentCounter: `${length} / ${REJECT_COMMENT_MIN_LENGTH} min.`,
            confirmLabel: "Reject",
            canSubmit: length >= REJECT_COMMENT_MIN_LENGTH
        };
    }

    if (kind === "cancel") {
        return {
            ...base,
            title: "Cancel review?",
            body: "Review progress is lost. Editing is unlocked, and a new request starts again from the first step.",
            confirmLabel: "Cancel review",
            cancelLabel: "Keep review"
        };
    }

    // "reassign" has its own presenter (Task 16) and never reaches this table.
    return base;
};
