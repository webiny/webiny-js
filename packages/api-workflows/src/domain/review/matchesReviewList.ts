import { matchesReviewListScope } from "./matchesReviewListScope.js";
import { matchesReviewListState } from "./matchesReviewListState.js";
import type { ReviewListScope } from "./ReviewListScope.js";
import type { ReviewData, ReviewListWhere } from "./types.js";

export interface ReviewListMatchParams {
    scope: ReviewListScope;
    viewerUserId: string;
    viewerTeamIds: string[];
    /** The viewer holds `reassign`: `all` is every review, not only those involving them (B7). */
    viewerCanReassign: boolean;
    /** Namespace ids the app lists. */
    models: string[];
    where: ReviewListWhere;
}

/**
 * Whether a review belongs to a list for one viewer (spec 11, R91, B2 design 1): active, in a
 * listed namespace, matching the title words, the scope and the state. Pure. Run on the
 * primary-storage row of every listed hit: the storage pre-filter can be stale (R18) or, on a
 * storage that cannot express a condition, missing (A40).
 */
export const matchesReviewList = (review: ReviewData, params: ReviewListMatchParams): boolean => {
    if (!review.isActive || !params.models.includes(review.model)) {
        return false;
    }
    // Storage `title_contains` matches each word anywhere (case-insensitive), so code does too.
    const titleWords = (params.where.titleContains ?? "")
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
    const title = review.title.toLowerCase();
    if (titleWords.length && !titleWords.every(word => title.includes(word))) {
        return false;
    }
    return (
        matchesReviewListScope(review, params) &&
        matchesReviewListState(review, params.where.state ?? "all")
    );
};
