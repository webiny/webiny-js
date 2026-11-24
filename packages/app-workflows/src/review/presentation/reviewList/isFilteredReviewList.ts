import type { ReviewListState } from "~/review/domain/ReviewListState.js";

/*
 * Whether the list is narrowed by a filter the viewer can clear: a title search or a content model
 * (`hasFilters`), or the state Approved or Rejected. The scope's own states (In review, All) and
 * Failed have their own empty copy and are not a filter. The empty state shows the filtered copy
 * and "Clear filters" exactly then.
 */
export const isFilteredReviewList = (hasFilters: boolean, state: ReviewListState): boolean => {
    return hasFilters || state === "approved" || state === "rejected";
};
