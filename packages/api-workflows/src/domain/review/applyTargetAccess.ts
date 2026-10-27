import type { ReviewTargetAccess, ReviewViewerFlags } from "./types.js";

/**
 * ANDs the app wrapper's target read access into every viewer flag (R33, D133 point 7). Without
 * read access nothing is allowed; otherwise the flags are returned unchanged. Pure.
 */
export const applyTargetAccess = (
    flags: ReviewViewerFlags,
    access: ReviewTargetAccess
): ReviewViewerFlags => {
    if (!access.canRead) {
        return {
            canStart: false,
            canTakeOver: false,
            canApprove: false,
            canReject: false,
            canCancel: false,
            canReassign: false,
            canRestart: false
        };
    }
    return { ...flags };
};
