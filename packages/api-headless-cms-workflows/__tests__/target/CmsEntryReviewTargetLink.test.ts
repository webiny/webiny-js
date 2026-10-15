import { beforeAll, describe, expect, it } from "vitest";
import { ReviewTargetLink } from "@webiny/api-workflows/features/notifications/ReviewTargetLink/index.js";
import { createTestContext } from "~tests/__helpers/testContext.js";

let links: ReviewTargetLink.Interface[] = [];

beforeAll(async () => {
    const context = await createTestContext({ withWorkflow: false });
    links = context.container.resolveAll(ReviewTargetLink);
});

const getLink = (model: string): ReviewTargetLink.Interface => {
    return links.find(item => item.canLink(model))!;
};

describe("CmsEntryReviewTargetLink (R195)", () => {
    it("claims cms namespaces only, with exactly one adapter per cms namespace", () => {
        expect(links.filter(item => item.canLink("cms.article"))).toHaveLength(1);
        expect(links.filter(item => item.canLink("cms.blogPost"))).toHaveLength(1);
        expect(links.some(item => item.canLink("wb.page"))).toBe(false);
        expect(links.some(item => item.canLink("cms"))).toBe(false);
        expect(links.some(item => item.canLink("cms."))).toBe(false);
        expect(links.some(item => item.canLink("cms.a.b"))).toBe(false);
        expect(links.some(item => item.canLink("article"))).toBe(false);
    });

    it("builds the content entries path with the model id of the namespace and the encoded revision id", () => {
        const path = getLink("cms.article").getPath({
            model: "cms.article",
            targetId: "article-1",
            targetRevisionId: "article-1#0001"
        });

        expect(path).toBe("/cms/content-entries/article?id=article-1%230001");
    });

    it("takes the model id from the namespace", () => {
        const path = getLink("cms.blogPost").getPath({
            model: "cms.blogPost",
            targetId: "post-1",
            targetRevisionId: "post-1#0002"
        });

        expect(path).toBe("/cms/content-entries/blogPost?id=post-1%230002");
    });

    it("encodes every reserved character of the revision id", () => {
        const path = getLink("cms.article").getPath({
            model: "cms.article",
            targetId: "a",
            targetRevisionId: "a b/c#1&x=2?"
        });

        expect(path).toBe("/cms/content-entries/article?id=a%20b%2Fc%231%26x%3D2%3F");
    });

    it("is tenant-free and has no host (the link service adds both)", () => {
        const path = getLink("cms.article").getPath({
            model: "cms.article",
            targetId: "article-1",
            targetRevisionId: "article-1#0001"
        });

        expect(path.startsWith("/")).toBe(true);
        expect(path).not.toContain("tenantId");
        expect(path).not.toContain("://");
    });
});
