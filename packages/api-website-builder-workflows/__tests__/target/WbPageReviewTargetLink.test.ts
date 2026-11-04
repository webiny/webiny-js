import { beforeAll, describe, expect, it } from "vitest";
import { ReviewTargetLink } from "@webiny/api-workflows/features/notifications/ReviewTargetLink/index.js";
import { createUserContext } from "~tests/__helpers/userContext.js";

let links: ReviewTargetLink.Interface[] = [];

beforeAll(async () => {
    const context = await createUserContext();
    links = context.container.resolveAll(ReviewTargetLink);
});

describe("WbPageReviewTargetLink (R195)", () => {
    it("claims the wb.page namespace only, beside the CMS adapter", () => {
        expect(links.filter(item => item.canLink("wb.page"))).toHaveLength(1);
        expect(links.filter(item => item.canLink("cms.article"))).toHaveLength(1);
        expect(links.some(item => item.canLink("wb.pages"))).toBe(false);
        expect(links.some(item => item.canLink("wb"))).toBe(false);
        expect(links.some(item => item.canLink("page"))).toBe(false);
    });

    it("builds the page editor path with the encoded revision id", () => {
        const link = links.find(item => item.canLink("wb.page"))!;

        const path = link.getPath({
            model: "wb.page",
            targetId: "page-1",
            targetRevisionId: "page-1#0002"
        });

        expect(path).toBe("/website-builder/pages/editor/page-1%230002");
    });

    it("encodes every reserved character of the revision id", () => {
        const link = links.find(item => item.canLink("wb.page"))!;

        const path = link.getPath({
            model: "wb.page",
            targetId: "p",
            targetRevisionId: "p q/r#1?x=2"
        });

        expect(path).toBe("/website-builder/pages/editor/p%20q%2Fr%231%3Fx%3D2");
    });

    it("is tenant-free and has no host (the link service adds both)", () => {
        const link = links.find(item => item.canLink("wb.page"))!;

        const path = link.getPath({
            model: "wb.page",
            targetId: "page-1",
            targetRevisionId: "page-1#0002"
        });

        expect(path.startsWith("/")).toBe(true);
        expect(path).not.toContain("tenantId");
        expect(path).not.toContain("://");
    });
});
