import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { getRowPublishDisabledReason } from "./getRowPublishDisabledReason.js";
import { CHECKING } from "~/testing/reviewStates.js";
import { FAILED_REASON } from "~/testing/reviewStates.js";
import { IN_REVIEW_REASON } from "~/testing/reviewStates.js";
import { NEEDS_REVIEW } from "~/testing/reviewStates.js";

// The editor rules' own text (the shared test constant is the review bar's shorter one).
const REJECTED_REASON =
    "This revision was rejected. Create a new revision to fix it, then request a new review.";

describe("getRowPublishDisabledReason", () => {
    it.each([
        ["in progress", ReviewState.InProgress, IN_REVIEW_REASON],
        ["rejected", ReviewState.Rejected, REJECTED_REASON],
        ["missing", null, NEEDS_REVIEW],
        ["cancelled", ReviewState.Cancelled, NEEDS_REVIEW]
    ])("blocks a row of a bound model whose review is %s", (_name, reviewState, reason) => {
        expect(
            getRowPublishDisabledReason({
                workflowStatus: "bound",
                reviewState,
                isUnpublished: false
            })
        ).toBe(reason);
    });

    it("allows a row of a bound model whose review is approved", () => {
        expect(
            getRowPublishDisabledReason({
                workflowStatus: "bound",
                reviewState: ReviewState.Approved,
                isUnpublished: false
            })
        ).toBeNull();
    });

    it("allows an unpublished row with no review, as the editor does", () => {
        expect(
            getRowPublishDisabledReason({
                workflowStatus: "bound",
                reviewState: null,
                isUnpublished: true
            })
        ).toBeNull();
    });

    it.each([
        ["no review", null],
        ["a review in progress", ReviewState.InProgress]
    ])("allows a row of an unbound model with %s", (_name, reviewState) => {
        expect(
            getRowPublishDisabledReason({
                workflowStatus: "unbound",
                reviewState,
                isUnpublished: false
            })
        ).toBeNull();
    });

    it.each([
        ["loading", "loading" as const, CHECKING],
        ["failed", "failed" as const, FAILED_REASON]
    ])("blocks while the binding is %s", (_name, workflowStatus, reason) => {
        expect(
            getRowPublishDisabledReason({
                workflowStatus,
                reviewState: ReviewState.Approved,
                isUnpublished: false
            })
        ).toBe(reason);
    });
});
