import type { ReviewListScope } from "~/review/domain/ReviewListScope.js";
import type { ReviewListState } from "~/review/domain/ReviewListState.js";
import { isEmptyReviewListFilter } from "~/review/domain/isEmptyReviewListFilter.js";

const POOL_REASON = "Team pool only holds open reviews.";
const POOL_FAILED_REASON = "Team pool only holds steps waiting for a person, never failed ones.";
const FAILED_REASON = "Failed steps are AI or automation steps, which no person owns.";

/*
 * Why a state is disabled for a scope (B8): the tooltip of a pair that is empty by definition
 * (`isEmptyReviewListFilter`), `null` for every pair that can list something.
 */
export const getDisabledReviewListStateReason = (
    scope: ReviewListScope,
    state: ReviewListState
): string | null => {
    if (!isEmptyReviewListFilter(scope, state)) {
        return null;
    }
    if (scope === "pool") {
        if (state === "failed") {
            return POOL_FAILED_REASON;
        }
        return POOL_REASON;
    }
    return FAILED_REASON;
};
