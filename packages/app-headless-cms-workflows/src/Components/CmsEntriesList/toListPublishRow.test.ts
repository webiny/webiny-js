import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import type { ReviewStateValue } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { toListPublishRow } from "./toListPublishRow.js";

function createEntry(reviewState: ReviewStateValue | null, status: string): CmsContentEntry {
    const workflow = reviewState === null ? null : { reviewState };

    return {
        id: "entry-1#0001",
        entryId: "entry-1",
        meta: { title: "Hello", status, version: 1, locked: false, system: { workflow } }
    } as unknown as CmsContentEntry;
}

describe("toListPublishRow", () => {
    it("reads the review state and the status of an entry", () => {
        expect(toListPublishRow(createEntry(ReviewState.Approved, "published"))).toEqual({
            reviewState: ReviewState.Approved,
            isPublished: true,
            isUnpublished: false
        });
    });

    it("reads an unpublished entry with no review", () => {
        expect(toListPublishRow(createEntry(null, "unpublished"))).toEqual({
            reviewState: null,
            isPublished: false,
            isUnpublished: true
        });
    });
});
