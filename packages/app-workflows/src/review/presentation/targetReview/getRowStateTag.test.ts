import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { StepState } from "~/review/domain/StepState.js";
import { toReviewListRow } from "~/review/domain/toReviewListRow.js";
import { createReviewListItem } from "~/review/testing/createReviewListItem.js";
import { getRowStateTag } from "./getRowStateTag.js";

describe("getRowStateTag", () => {
    it("returns the step-state tag of a row with a step state", () => {
        const row = toReviewListRow(createReviewListItem({ stepState: StepState.InReview }));

        expect(getRowStateTag(row)).toEqual({ label: "In review", variant: "accent-light" });
    });

    it("returns no label and the neutral variant without a step state", () => {
        const row = { ...toReviewListRow(createReviewListItem()), stepState: null };

        expect(getRowStateTag(row)).toEqual({ label: null, variant: "neutral-base-outline" });
    });
});
