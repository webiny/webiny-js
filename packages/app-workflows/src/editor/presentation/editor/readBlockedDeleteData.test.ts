import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { readBlockedDeleteData } from "./readBlockedDeleteData.js";

const review = (id: string) => {
    return {
        reviewId: id,
        model: "cms.article",
        targetId: `target-${id}`,
        targetRevisionId: `target-${id}#0001`,
        title: `Title ${id}`,
        stepPosition: 2,
        stepCount: 3,
        stepName: "Legal sign-off"
    };
};

describe("readBlockedDeleteData (R278)", () => {
    it("reads the count and the reviews", () => {
        const result = readBlockedDeleteData({ count: 7, reviews: [review("r1"), review("r2")] });

        expect(result.count).toBe(7);
        expect(result.reviews).toEqual([review("r1"), review("r2")]);
    });

    it("falls back to the number of reviews when the count is missing", () => {
        expect(readBlockedDeleteData({ reviews: [review("r1")] }).count).toBe(1);
    });

    it("skips an entry that is not a review and survives garbage", () => {
        const result = readBlockedDeleteData({
            count: 2,
            reviews: [review("r1"), { reviewId: 5 }, null]
        });

        expect(result.reviews.map(item => item.reviewId)).toEqual(["r1"]);
        expect(readBlockedDeleteData(null)).toEqual({ count: 0, reviews: [] });
        expect(readBlockedDeleteData("x")).toEqual({ count: 0, reviews: [] });
    });
});
