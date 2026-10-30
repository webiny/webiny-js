import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import type { ActiveReviewOnTrashData } from "~/review/domain/types.js";
import { parseActiveReviewOnTrash } from "./parseActiveReviewOnTrash.js";
import { createBlockingReview } from "~/review/testing/reviewFixtures.js";

const data: ActiveReviewOnTrashData = {
    model: "cms.article",
    action: "trash",
    reviews: [createBlockingReview()]
};

function refusal(payload: unknown, code: string = ReviewErrorCode.ActiveReviewOnTrash) {
    return new GraphQLOperationError({ message: "Refused.", code, data: payload });
}

describe("parseActiveReviewOnTrash", () => {
    it("returns the data of an ActiveReviewOnTrash refusal", () => {
        expect(parseActiveReviewOnTrash(refusal(data))).toEqual(data);
    });

    it("accepts the delete action", () => {
        const deleteData = { ...data, action: "delete" };
        expect(parseActiveReviewOnTrash(refusal(deleteData))).toEqual(deleteData);
    });

    it("returns null for a plain Error and for non-errors", () => {
        expect(parseActiveReviewOnTrash(new Error("boom"))).toBeNull();
        expect(parseActiveReviewOnTrash("boom")).toBeNull();
        expect(parseActiveReviewOnTrash(null)).toBeNull();
        expect(parseActiveReviewOnTrash(undefined)).toBeNull();
    });

    it("returns null for a GraphQLOperationError with another code", () => {
        expect(parseActiveReviewOnTrash(refusal(data, ReviewErrorCode.NotFound))).toBeNull();
        expect(parseActiveReviewOnTrash(refusal(data, ReviewErrorCode.NotAuthorized))).toBeNull();
    });

    it("returns null for malformed data", () => {
        expect(parseActiveReviewOnTrash(refusal(null))).toBeNull();
        expect(parseActiveReviewOnTrash(refusal("text"))).toBeNull();
        expect(parseActiveReviewOnTrash(refusal({ ...data, reviews: "none" }))).toBeNull();
        expect(parseActiveReviewOnTrash(refusal({ ...data, reviews: [] }))).toBeNull();
        expect(parseActiveReviewOnTrash(refusal({ ...data, action: "move" }))).toBeNull();
        expect(parseActiveReviewOnTrash(refusal({ ...data, model: 5 }))).toBeNull();
        expect(
            parseActiveReviewOnTrash(refusal({ ...data, reviews: [{ reviewId: "review-1" }] }))
        ).toBeNull();
        const withoutRevision = { ...data.reviews[0], targetRevisionId: undefined };
        expect(
            parseActiveReviewOnTrash(refusal({ ...data, reviews: [withoutRevision] }))
        ).toBeNull();
    });
});
