import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { StepState } from "@webiny/app-workflows/review/domain/StepState.js";
import "~/types.js";
import { toListPublishRow } from "./toListPublishRow.js";

describe("toListPublishRow", () => {
    it("reads the review state and the status of a page", () => {
        const row = toListPublishRow({
            status: "published",
            system: {
                workflow: {
                    workflowId: "workflow-1",
                    reviewState: ReviewState.Approved,
                    stepId: "step-1",
                    stepName: "Legal",
                    stepState: StepState.InReview
                }
            }
        });

        expect(row).toEqual({
            reviewState: ReviewState.Approved,
            isPublished: true,
            isUnpublished: false
        });
    });

    it("reads a page with no review", () => {
        expect(toListPublishRow({ status: "unpublished", system: null })).toEqual({
            reviewState: null,
            isPublished: false,
            isUnpublished: true
        });
    });
});
