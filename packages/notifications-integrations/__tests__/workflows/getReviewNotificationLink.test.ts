import { describe, expect, it } from "vitest";
import { getReviewNotificationLink } from "~/api/workflows/getReviewNotificationLink.js";

describe("getReviewNotificationLink", () => {
    it("links a CMS entry as <modelId>:<entryId>, which the inbox opens", () => {
        expect(getReviewNotificationLink({ app: "cms", modelId: "article" }, "entry-1")).toEqual({
            app: "cms",
            contentId: "article:entry-1"
        });
    });

    it("links another app's content by its app and bare target id", () => {
        expect(getReviewNotificationLink({ app: "wb", modelId: "wbyWbPage" }, "page-1")).toEqual({
            app: "wb",
            contentId: "page-1"
        });
    });

    it("gives no link for a model no app knows", () => {
        expect(getReviewNotificationLink(null, "target-1")).toBeNull();
    });
});
