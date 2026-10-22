import type { ReviewData, ReviewListReadFilter } from "./types.js";

/**
 * Whether a viewer may read a review in a list (Q77). Pure. The repository applies the same
 * conditions in the query; this runs again on the primary row, as every list condition does (R18).
 */
export const matchesReviewReadFilter = (
    review: ReviewData,
    filter: ReviewListReadFilter
): boolean => {
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
