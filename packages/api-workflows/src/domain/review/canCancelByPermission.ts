import { Review } from "./Review.js";
import type { ReviewData, ReviewPermissionViewer } from "./types.js";

/**
 * Who may cancel a review (D25, D54): the requesting user, or a viewer with `reassign` (full
 * access included). Permission only (R41): the review's state is not read. App wrappers authorize
 * cancel with it and leave state errors (`Workflows/Review/InvalidState`) to the engine;
 * `getReviewViewerFlags` ANDs it with `Review.checkCancel`. AI and automation actors carry the
 * requester's id (D58) but are not the requester.
 */
export const canCancelByPermission = (
    review: ReviewData,
    viewer: ReviewPermissionViewer
): boolean => {
    if (viewer.permissions.reassign) {
        return true;
    }
    return Review.fromData(review).isRequestedBy(viewer.actor);
};
