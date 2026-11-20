import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { ReviewState } from "~/review/domain/ReviewState.js";
import type { ReviewStateValue } from "~/review/domain/ReviewState.js";
import type { ListPublishRow } from "./ListPublishRow.js";
import { getSelectionPublishDisabledReason } from "./getSelectionPublishDisabledReason.js";

// The editor rules' own texts (`getEditorRules`).
const CHECKING = "Checking review status…";
const NEEDS_REVIEW = "Publishing needs an approved review. Request a review first.";

function createRow(reviewState: ReviewStateValue | null): ListPublishRow {
    return { reviewState, isPublished: false, isUnpublished: false };
}

describe("getSelectionPublishDisabledReason", () => {
    it("allows a selection of approved rows of a bound namespace", () => {
        expect(
            getSelectionPublishDisabledReason({
                workflowStatus: "bound",
                rows: [createRow(ReviewState.Approved), createRow(ReviewState.Approved)],
                allSelected: false,
                hasMore: false
            })
        ).toBeNull();
    });

    it("blocks a selection with one row of a bound namespace that has no review", () => {
        expect(
            getSelectionPublishDisabledReason({
                workflowStatus: "bound",
                rows: [createRow(ReviewState.Approved), createRow(null)],
                allSelected: false,
                hasMore: false
            })
        ).toBe(NEEDS_REVIEW);
    });

    it("allows any selection of an unbound namespace, also with every row selected", () => {
        expect(
            getSelectionPublishDisabledReason({
                workflowStatus: "unbound",
                rows: [createRow(null)],
                allSelected: true,
                hasMore: true
            })
        ).toBeNull();
    });

    it("blocks every row selected on a bound namespace, the rows not loaded being unknown", () => {
        expect(
            getSelectionPublishDisabledReason({
                workflowStatus: "bound",
                rows: [createRow(ReviewState.Approved)],
                allSelected: true,
                hasMore: true
            })
        ).toBe(NEEDS_REVIEW);
    });

    it("allows every row selected when all of them are loaded and approved", () => {
        expect(
            getSelectionPublishDisabledReason({
                workflowStatus: "bound",
                rows: [createRow(ReviewState.Approved)],
                allSelected: true,
                hasMore: false
            })
        ).toBeNull();
    });

    it("blocks while the binding is loading", () => {
        expect(
            getSelectionPublishDisabledReason({
                workflowStatus: "loading",
                rows: [createRow(ReviewState.Approved)],
                allSelected: false,
                hasMore: false
            })
        ).toBe(CHECKING);
    });

    it("skips a published row, whose row action is Unpublish", () => {
        const published: ListPublishRow = { ...createRow(null), isPublished: true };
        expect(
            getSelectionPublishDisabledReason({
                workflowStatus: "bound",
                rows: [published, createRow(ReviewState.Approved)],
                allSelected: false,
                hasMore: false
            })
        ).toBeNull();
    });

    it("allows an unpublished row with no review, as the editor does", () => {
        const unpublished: ListPublishRow = { ...createRow(null), isUnpublished: true };
        expect(
            getSelectionPublishDisabledReason({
                workflowStatus: "bound",
                rows: [unpublished],
                allSelected: false,
                hasMore: false
            })
        ).toBeNull();
    });
});
