import { beforeEach, describe, expect, it } from "vitest";
import { useGraphQlHandler } from "./utils/useGraphQlHandler.js";

/**
 * The `properties` field of the page model is a `searchableJson` field, which means the values
 * stored within it (`title`, `path`, ...) must be usable via the full-text search (`search` arg).
 */
const searchPageMocks = {
    alpha: {
        properties: {
            title: "Alpha Landing Page",
            path: "/alpha-landing"
        },
        metadata: {},
        bindings: {},
        elements: [],
        location: {
            folderId: "root"
        }
    },
    beta: {
        properties: {
            title: "Beta Pricing Page",
            path: "/beta-pricing"
        },
        metadata: {},
        bindings: {},
        elements: [],
        location: {
            folderId: "root"
        }
    },
    gamma: {
        properties: {
            title: "Gamma Contact Page",
            path: "/gamma-contact"
        },
        metadata: {},
        bindings: {},
        elements: [],
        location: {
            folderId: "root"
        }
    }
};

describe("Pages Search", () => {
    let handler: ReturnType<typeof useGraphQlHandler>;

    const listPages = async (variables: Record<string, any>) => {
        const [response] = await handler.wb.listPages(variables);
        const { data, error, meta } = response.data.websiteBuilder.listPages;

        if (error) {
            throw new Error(`${error.code}: ${error.message}`);
        }

        return { titles: data.map((page: any) => page.properties.title).sort(), meta };
    };

    beforeEach(async () => {
        handler = useGraphQlHandler({});

        for (const data of Object.values(searchPageMocks)) {
            const [response] = await handler.wb.createPage({ data });
            expect(response.data.websiteBuilder.createPage.error).toBeNull();
        }

        // Storage is eventually consistent, so wait until all the pages become listable.
        await handler.until(
            () => handler.wb.listPages({ where: {} }),
            ([response]: [any]) => response.data.websiteBuilder.listPages.data.length === 3
        );
    });

    it("should list all pages when no search term is given", async () => {
        const { titles, meta } = await listPages({ where: {} });

        expect(titles).toEqual(["Alpha Landing Page", "Beta Pricing Page", "Gamma Contact Page"]);
        expect(meta.totalCount).toBe(3);
    });

    it("should find a page by a word contained in the page title", async () => {
        const { titles, meta } = await listPages({ where: {}, search: "Pricing" });

        expect(titles).toEqual(["Beta Pricing Page"]);
        expect(meta.totalCount).toBe(1);
    });

    it("should find a page by a partial word contained in the page title", async () => {
        const { titles, meta } = await listPages({ where: {}, search: "Land" });

        expect(titles).toEqual(["Alpha Landing Page"]);
        expect(meta.totalCount).toBe(1);
    });

    it("should find a page by multiple words contained in the page title", async () => {
        const { titles, meta } = await listPages({ where: {}, search: "Gamma Contact" });

        expect(titles).toEqual(["Gamma Contact Page"]);
        expect(meta.totalCount).toBe(1);
    });

    it("should find a page by a term contained in the page path", async () => {
        const { titles, meta } = await listPages({ where: {}, search: "beta-pricing" });

        expect(titles).toEqual(["Beta Pricing Page"]);
        expect(meta.totalCount).toBe(1);
    });

    it("should find all pages by a term shared by all of them", async () => {
        const { titles, meta } = await listPages({ where: {}, search: "Page" });

        expect(titles).toEqual(["Alpha Landing Page", "Beta Pricing Page", "Gamma Contact Page"]);
        expect(meta.totalCount).toBe(3);
    });

    it("should not find any page when the term matches nothing", async () => {
        const { titles, meta } = await listPages({ where: {}, search: "zzz-no-such-page" });

        expect(titles).toEqual([]);
        expect(meta.totalCount).toBe(0);
    });
});
