import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { isReviewSelectable } from "./isReviewSelectable.js";
import { ReviewState } from "./ReviewState.js";

describe("isReviewSelectable", () => {
    it("is true for an approved review", () => {
        expect(isReviewSelectable(ReviewState.Approved)).toBe(true);
    });

    it("is true for a row with no review state (content without a workflow)", () => {
        expect(isReviewSelectable(null)).toBe(true);
    });

    it("is false for every other review state", () => {
        expect(isReviewSelectable(ReviewState.InProgress)).toBe(false);
        expect(isReviewSelectable(ReviewState.Rejected)).toBe(false);
        expect(isReviewSelectable(ReviewState.Cancelled)).toBe(false);
    });
});
