import type { ReviewActiveOnTrashAction } from "./errors.js";

export const REVIEW_CANCEL_REASON_CONTENT_TRASHED = "content trashed";
export const REVIEW_CANCEL_REASON_CONTENT_DELETED = "content deleted";

/** The reason recorded when a review is cancelled because its content is trashed or deleted (D134). */
export const getDeleteCancelReason = (action: ReviewActiveOnTrashAction): string => {
    return action === "trash"
        ? REVIEW_CANCEL_REASON_CONTENT_TRASHED
        : REVIEW_CANCEL_REASON_CONTENT_DELETED;
};
