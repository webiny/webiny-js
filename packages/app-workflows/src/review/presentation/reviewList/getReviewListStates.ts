import type { ReviewListScope } from "~/review/domain/ReviewListScope.js";
import { isEmptyReviewListFilter } from "~/review/domain/isEmptyReviewListFilter.js";
import type { ReviewListStateVm } from "./abstractions.js";
import { getDisabledReviewListStateReason } from "./getDisabledReviewListStateReason.js";
import { REVIEW_LIST_STATES } from "./reviewListStates.js";

// Every state, the ones empty by definition for this scope disabled with their reason (B2 design 1, B8).
export const getReviewListStates = (scope: ReviewListScope): ReviewListStateVm[] => {
    return REVIEW_LIST_STATES.map(option => {
        return {
            value: option.value,
            label: option.label,
            disabled: isEmptyReviewListFilter(scope, option.value),
            disabledReason: getDisabledReviewListStateReason(scope, option.value)
        };
    });
};
