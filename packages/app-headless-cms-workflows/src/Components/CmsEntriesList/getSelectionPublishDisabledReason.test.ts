import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import type { ReviewStateValue } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { getSelectionPublishDisabledReason } from "./getSelectionPublishDisabledReason.js";
import { CHECKING } from "~/testing/reviewStates.js";
import { NEEDS_REVIEW } from "~/testing/reviewStates.js";

function createEntry(id: string, reviewState: ReviewStateValue | null): CmsContentEntry {
    const workflow = reviewState === null ? null : { reviewState };

    return {
        id,
        entryId: id,
        meta: { title: id, status: "draft", version: 1, locked: false, system: { workflow } }
    } as unknown as CmsContentEntry;
}

describe("getSelectionPublishDisabledReason", () => {
    it("allows a selection of approved entries of a bound model", () => {
        expect(
            getSelectionPublishDisabledReason({
                workflowStatus: "bound",
                entries: [
                    createEntry("a", ReviewState.Approved),
                    createEntry("b", ReviewState.Approved)
                ],
                allSelected: false,
                hasMore: false
            })
        ).toBeNull();
    });

    it("blocks a selection with one entry of a bound model that has no review", () => {
        expect(
            getSelectionPublishDisabledReason({
                workflowStatus: "bound",
                entries: [createEntry("a", ReviewState.Approved), createEntry("b", null)],
                allSelected: false,
                hasMore: false
            })
        ).toBe(NEEDS_REVIEW);
    });

    it("allows any selection of an unbound model, also with every entry selected", () => {
        expect(
            getSelectionPublishDisabledReason({
                workflowStatus: "unbound",
                entries: [createEntry("a", null)],
                allSelected: true,
                hasMore: true
            })
        ).toBeNull();
    });

    it("blocks every entry selected on a bound model, the entries not loaded being unknown", () => {
        expect(
            getSelectionPublishDisabledReason({
                workflowStatus: "bound",
                entries: [createEntry("a", ReviewState.Approved)],
                allSelected: true,
                hasMore: true
            })
        ).toBe(NEEDS_REVIEW);
    });

    it("allows every entry selected when all of them are loaded and approved", () => {
        expect(
            getSelectionPublishDisabledReason({
                workflowStatus: "bound",
                entries: [createEntry("a", ReviewState.Approved)],
                allSelected: true,
                hasMore: false
            })
        ).toBeNull();
    });

    it("blocks while the binding is loading", () => {
        expect(
            getSelectionPublishDisabledReason({
                workflowStatus: "loading",
                entries: [createEntry("a", ReviewState.Approved)],
                allSelected: false,
                hasMore: false
            })
        ).toBe(CHECKING);
    });

    it("skips a published row, whose row action is Unpublish", () => {
        const published = createEntry("a", null);
        published.meta.status = "published";
        expect(
            getSelectionPublishDisabledReason({
                workflowStatus: "bound",
                entries: [published, createEntry("b", ReviewState.Approved)],
                allSelected: false,
                hasMore: false
            })
        ).toBeNull();
    });
});
