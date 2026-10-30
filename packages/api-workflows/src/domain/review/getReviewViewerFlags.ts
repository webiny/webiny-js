import { Review, type ReviewActorCheckParams } from "./Review.js";
import { canCancelByPermission } from "./canCancelByPermission.js";
import { canReassignByPermission } from "./canReassignByPermission.js";
import { canRestartByPermission } from "./canRestartByPermission.js";
import type { ReviewData, ReviewViewer, ReviewViewerFlags } from "./types.js";

/**
 * Viewer flags for one review and one reading user (spec 5.3, D5, D54). Pure.
 *
 * Start, take over, approve, reject, the reassign step rule and the restart step rule ask the
 * aggregate's own checks (R31), so a flag is true exactly when the transition would pass its
 * domain rules. Cancel, reassign and restart add the permission-only predicates (R41) the app
 * wrappers also authorize with, so the flag and the wrapper's check cannot drift. The wrappers
 * AND their target read access into every flag (R33, D133 point 7), through `applyTargetAccess`.
 *
 * `canRestart` is "the current step failed, and requester or `reassign`" (D34, R153): a rejected
 * step is final (D10) and `checkRestart` refuses it.
 */
export const getReviewViewerFlags = (data: ReviewData, viewer: ReviewViewer): ReviewViewerFlags => {
    const review = Review.fromData(data);
    const canCancel = review.checkCancel().isOk() && canCancelByPermission(data, viewer);

    const stepId = review.actionableStepId;
    if (!stepId) {
        // Every step is approved: nothing is left to act on.
        return {
            canStart: false,
            canTakeOver: false,
            canApprove: false,
            canReject: false,
            canCancel,
            canReassign: false,
            canRestart: false
        };
    }

    const params: ReviewActorCheckParams = {
        stepId,
        actor: viewer.actor,
        actorTeamIds: viewer.teamIds
    };
    return {
        canStart: review.checkStart(params).isOk(),
        canTakeOver: review.checkTakeOver(params).isOk(),
        canApprove: review.checkApprove(params).isOk(),
        canReject: review.checkReject(params).isOk(),
        canCancel,
        canReassign: canReassignByPermission(viewer) && review.checkReassign({ stepId }).isOk(),
        canRestart: canRestartByPermission(data, viewer) && review.checkRestart({ stepId }).isOk()
    };
};
