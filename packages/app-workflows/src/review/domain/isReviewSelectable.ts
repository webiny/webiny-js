import { ReviewState } from "./ReviewState.js";
import type { ReviewStateValue } from "./ReviewState.js";

/*
 * Whether a content row may be selected for an action that review blocks (move, schedule): only an
 * approved review allows it, and so does a row with no review state at all (no workflow, D121).
 */
export const isReviewSelectable = (state: ReviewStateValue | null): boolean => {
    return state === null || state === ReviewState.Approved;
};
