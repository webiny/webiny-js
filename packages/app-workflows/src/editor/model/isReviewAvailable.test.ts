import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createEditorStepType } from "~/editor/testing/editorFixtures.js";
import { isReviewAvailable } from "./isReviewAvailable.js";

describe("isReviewAvailable (R290)", () => {
    it("is true when the review row is available", () => {
        expect(isReviewAvailable([createEditorStepType({ type: "review" })])).toBe(true);
    });

    it("is false when the review row is listed as not available", () => {
        const types = [
            createEditorStepType({
                type: "review",
                available: false,
                unavailableReason: "Teams are not enabled."
            })
        ];

        expect(isReviewAvailable(types)).toBe(false);
    });

    it("is true when the list has no review row (the list did not load)", () => {
        expect(isReviewAvailable([])).toBe(true);
        expect(isReviewAvailable([createEditorStepType({ type: "ai", available: false })])).toBe(
            true
        );
    });
});
