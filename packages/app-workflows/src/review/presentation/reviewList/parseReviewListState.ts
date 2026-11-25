import type { ReviewListState } from "~/review/domain/ReviewListState.js";
import { REVIEW_LIST_STATES } from "./reviewListStates.js";

// Narrows a string (a route parameter, a control value) to a list state, or `null`.
export const parseReviewListState = (value: string | null | undefined): ReviewListState | null => {
    const state = REVIEW_LIST_STATES.find(item => item.value === value);
    if (!state) {
        return null;
    }
    return state.value;
};
