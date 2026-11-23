import type { ReviewStateValue } from "~/review/domain/ReviewState.js";

/*
 * What the publish gates of a content list need to know about a row, mapped by each app from its
 * own row (a CMS entry, a Website Builder page).
 */
export interface ListPublishRow {
    // The row's `system.workflow.reviewState`: `null` for no review.
    reviewState: ReviewStateValue | null;
    isPublished: boolean;
    // The revision was published before and is not published now.
    isUnpublished: boolean;
}
