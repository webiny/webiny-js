import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { REVIEW_STATE_LABELS } from "./reviewStateLabels.js";
import { getReviewStateTag } from "./getReviewStateTag.js";

describe("REVIEW_STATE_LABELS", () => {
    it("names every review state", () => {
        expect(REVIEW_STATE_LABELS).toEqual({
            [ReviewState.InProgress]: "In progress",
            [ReviewState.Approved]: "Approved",
            [ReviewState.Rejected]: "Rejected",
            [ReviewState.Cancelled]: "Cancelled"
        });
    });

    it("is the source of the state tag labels", () => {
        const states = [ReviewState.InProgress, ReviewState.Approved, ReviewState.Rejected];
        states.forEach(state => {
            const tag = getReviewStateTag(state);
            expect(tag?.label).toBe(`Review: ${REVIEW_STATE_LABELS[state]}`);
        });
        expect(getReviewStateTag(ReviewState.Cancelled)).toBeNull();
    });
});
