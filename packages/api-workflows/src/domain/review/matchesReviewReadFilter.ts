import type { ReviewData, ReviewListReadFilter } from "./types.js";

/**
 * Whether a viewer may read a review in a list (Q77). Pure. The repository applies the same
 * conditions in the query; this runs again on the primary row, as every list condition does (R18).
 */
export const matchesReviewReadFilter = (
    review: ReviewData,
    filter: ReviewListReadFilter
): boolean => {
    // The folder captured when the review was requested; it is never updated. A target can move
    // once its review is approved, rejected or cancelled (D84), so for such a review this may be
    // the old folder. Only `myRequests` lists those reviews, and only to their requester; opening
    // one checks read access to the target as it is now. Accepted (second review of #6042).
    const folderId = review.targetContext.folder?.id;
    if (folderId && filter.deniedFolderIds.includes(folderId)) {
        return false;
    }
    if (filter.models.includes(review.model)) {
        return true;
    }
    return (
        filter.ownOnlyModels.includes(review.model) &&
        review.targetContext.author.id === filter.authorId
    );
};
