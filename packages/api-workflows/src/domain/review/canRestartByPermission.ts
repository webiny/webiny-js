import { Review } from "./Review.js";
import type { ReviewData, ReviewPermissionViewer } from "./types.js";

/**
 * Who may restart a failed step (spec 5.1, D34, R153): the requesting user, or a viewer with
 * `reassign` (full access included). Permission only (R41): the review's state is not read. App
 * wrappers authorize restart with it and leave state errors (`Workflows/Review/InvalidState`,
 * transition `"restart"`) to the engine; `getReviewViewerFlags` ANDs it with `Review.checkRestart`.
 * AI and automation actors carry the requester's id (D58) but are not the requester.
 */
export const canRestartByPermission = (
    review: ReviewData,
    viewer: ReviewPermissionViewer
): boolean => {
    if (viewer.permissions.reassign) {
        return true;
    }
    return Review.fromData(review).isRequestedBy(viewer.actor);
};
