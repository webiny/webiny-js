import { describe, expect, it } from "vitest";
import { pathGroup, sampleAcrossGroups } from "./grouping.js";

describe("pathGroup", () => {
    it("uses the first path segment, or root for the homepage", () => {
        expect(pathGroup("https://x.com/")).toBe("root");
        expect(pathGroup("https://x.com/blog/post-1")).toBe("blog");
        expect(pathGroup("https://x.com/Pricing")).toBe("pricing");
    });
});

describe("sampleAcrossGroups", () => {
    it("spreads across groups rather than taking the first N", () => {
        const urls = [
            "https://x.com/blog/a",
            "https://x.com/blog/b",
            "https://x.com/blog/c",
            "https://x.com/pricing",
            "https://x.com/"
        ];

        const sampled = sampleAcrossGroups(urls, 3);

        expect(sampled).toHaveLength(3);
        // The first round pulls one from each of blog, pricing, root — pricing is not drowned by blog.
        expect(new Set(sampled.map(s => s.group))).toEqual(new Set(["blog", "pricing", "root"]));
    });

    it("dedupes and respects the cap", () => {
        const urls = ["https://x.com/a", "https://x.com/a", "https://x.com/b"];

        expect(sampleAcrossGroups(urls, 10)).toHaveLength(2);
        expect(sampleAcrossGroups(urls, 1)).toHaveLength(1);
    });

    it("returns nothing for a non-positive cap", () => {
        expect(sampleAcrossGroups(["https://x.com/a"], 0)).toHaveLength(0);
    });

    /*
     * The paginated-archive case a custom CMS produces: one template with forty instances of itself,
     * which between them are worth one page of the cap. Without this the budget goes on /news/page/2
     * through /news/page/8 and the pages a human would have picked never get captured.
     */
    it("gives a paginated archive one slot until every other template has had one", () => {
        const urls = [
            "https://x.com/news/page/2",
            "https://x.com/news/page/3",
            "https://x.com/news/page/4",
            "https://x.com/news/page/5",
            "https://x.com/news/our-series-launch",
            "https://x.com/news/hiring-update"
        ];

        const sampled = sampleAcrossGroups(urls, 3);
        const paginated = sampled.filter(item => /\/page\/\d+$/.test(item.url));

        expect(sampled).toHaveLength(3);
        expect(paginated).toHaveLength(1);
    });

    it("collapses dated archive paths to one template too", () => {
        const urls = [
            "https://x.com/news/2024/05",
            "https://x.com/news/2024/06",
            "https://x.com/news/2023/11",
            "https://x.com/news/a-real-story"
        ];

        const sampled = sampleAcrossGroups(urls, 2);
        const dated = sampled.filter(item => /\/\d{4}\/\d{2}$/.test(item.url));

        expect(dated).toHaveLength(1);
    });

    it("still fills the cap once every template is represented", () => {
        const urls = [
            "https://x.com/news/page/2",
            "https://x.com/news/page/3",
            "https://x.com/news/page/4"
        ];

        // One template, three instances: diversity has nothing left to prefer, so the cap wins.
        expect(sampleAcrossGroups(urls, 3)).toHaveLength(3);
    });

    it("prefers shallower paths within a group", () => {
        const urls = [
            "https://x.com/docs/guides/advanced/tuning",
            "https://x.com/docs/overview",
            "https://x.com/docs/guides/intro"
        ];

        const sampled = sampleAcrossGroups(urls, 1);

        expect(sampled[0].url).toBe("https://x.com/docs/overview");
    });
});
