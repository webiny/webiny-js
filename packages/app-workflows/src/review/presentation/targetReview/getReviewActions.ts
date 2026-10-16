import type { ReviewViewerFlags } from "~/review/domain/types.js";
import type { TargetReviewActionVm } from "./abstractions.js";

export interface ReviewActionsParams {
    // `null` when there is no active review.
    flags: ReviewViewerFlags | null;
    // The current step of the review; `null` for Request review.
    stepId: string | null;
    canRequest: boolean;
}

/*
 * The actions of the bar and the drawer footer: README 6 labels and icons, ordered ghost,
 * tertiary, secondary, primary. Only server flags decide what is offered (D5, D54); Restart is 8b.
 */
export const getReviewActions = (params: ReviewActionsParams): TargetReviewActionVm[] => {
    const { flags, stepId, canRequest } = params;
    const actions: TargetReviewActionVm[] = [];

    if (flags === null) {
        if (canRequest) {
            actions.push({
                kind: "request",
                label: "Request review",
                icon: "send",
                stepId: null,
                emphasis: "primary"
            });
        }
        return actions;
    }

    if (flags.canCancel) {
        actions.push({
            kind: "cancel",
            label: "Cancel review",
            icon: "block",
            stepId,
            emphasis: "ghost"
        });
    }
    if (flags.canReassign) {
        actions.push({
            kind: "reassign",
            label: "Reassign",
            icon: "swap_horiz",
            stepId,
            emphasis: "tertiary"
        });
    }
    if (flags.canReject) {
        actions.push({
            kind: "reject",
            label: "Reject",
            icon: "close",
            stepId,
            emphasis: "tertiary"
        });
    }
    if (flags.canTakeOver) {
        actions.push({
            kind: "takeOver",
            label: "Take over",
            icon: "front_hand",
            stepId,
            emphasis: "secondary"
        });
    }
    if (flags.canStart) {
        actions.push({
            kind: "start",
            label: "Start",
            icon: "play_arrow",
            stepId,
            emphasis: "primary"
        });
    }
    if (flags.canApprove) {
        actions.push({
            kind: "approve",
            label: "Approve",
            icon: "check",
            stepId,
            emphasis: "primary"
        });
    }

    return actions;
};
