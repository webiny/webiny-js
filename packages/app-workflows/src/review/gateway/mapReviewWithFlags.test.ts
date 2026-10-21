import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { mapReviewWithFlags } from "./mapReviewWithFlags.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlagsDto } from "~/review/testing/reviewFixtures.js";
import { createViewerFlagsDto } from "~/review/testing/reviewFixtures.js";

describe("mapReviewWithFlags", () => {
    it("maps the review and keeps every viewer flag", () => {
        const dto = createReviewWithFlagsDto({
            review: createReviewDto({ id: "review-9" }),
            flags: createViewerFlagsDto({
                canStart: false,
                canTakeOver: true,
                canApprove: true,
                canReject: true,
                canCancel: false,
                canReassign: true,
                canRestart: true
            })
        });

        const result = mapReviewWithFlags(dto);

        expect(result.review.id).toBe("review-9");
        expect(result.review.namespace).toBe("cms.article");
        expect(result.flags).toEqual({
            canStart: false,
            canTakeOver: true,
            canApprove: true,
            canReject: true,
            canCancel: false,
            canReassign: true,
            canRestart: true
        });
    });
});
