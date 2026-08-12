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
});
