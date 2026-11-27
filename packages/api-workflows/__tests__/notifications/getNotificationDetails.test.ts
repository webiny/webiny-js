import { describe, expect, it } from "vitest";
import { getNotificationDetails } from "~/domain/notifications/getNotificationDetails.js";
import { createNotificationReview } from "~tests/__helpers/notificationReviews.js";
import { requester } from "~tests/__helpers/fixtures.js";

describe("getNotificationDetails (B2 design 10)", () => {
    it("names the content type, the content, the step's position and the requester", () => {
        const review = createNotificationReview();

        expect(getNotificationDetails(review, "editorial")).toEqual({
            contentType: "Article",
            contentTitle: "Article 1",
            stepNumber: 2,
            stepCount: 2,
            stepTitle: "Editorial review",
            requester: "Rita Requester"
        });
        expect(getNotificationDetails(review, "legal")).toMatchObject({
            stepNumber: 1,
            stepCount: 2,
            stepTitle: "Legal review"
        });
    });

    it.each([null, "", "   "])(
        "has no content type for a review requested before it was kept (%j)",
        contentTypeName => {
            const review = createNotificationReview();
            review.targetContext.contentTypeName = contentTypeName;

            expect(getNotificationDetails(review, "legal")?.contentType).toBeNull();
        }
    );

    it("names a requester with a blank display name `A user`", () => {
        const review = createNotificationReview();
        review.createdBy = { ...requester, displayName: " " };

        expect(getNotificationDetails(review, "legal")?.requester).toBe("A user");
    });

    it.each([null, "gone"])("has no details for a step that is not in the review (%j)", stepId => {
        expect(getNotificationDetails(createNotificationReview(), stepId)).toBeUndefined();
    });
});
