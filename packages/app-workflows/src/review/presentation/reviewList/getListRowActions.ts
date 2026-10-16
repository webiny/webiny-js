import type { ReviewListRow } from "~/review/domain/types.js";
import type { TargetReviewActionVm } from "~/review/presentation/targetReview/abstractions.js";
import { getReviewActions } from "~/review/presentation/targetReview/getReviewActions.js";

/*
 * The actions a list row offers: Task 13's `getReviewActions` over the server flags (D5, D54),
 * limited to start, take over, reassign and cancel. Approve and reject are not list actions
 * (design: "Open the content to approve or reject"); request never applies to an existing review.
 */
export const getListRowActions = (row: ReviewListRow): TargetReviewActionVm[] => {
    const actions = getReviewActions({ flags: row.flags, stepId: row.stepId, canRequest: false });

    return actions.filter(action => {
        return (
            action.kind === "start" ||
            action.kind === "takeOver" ||
            action.kind === "reassign" ||
            action.kind === "cancel"
        );
    });
};
