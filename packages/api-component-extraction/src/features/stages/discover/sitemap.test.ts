import { describe, expect, it } from "vitest";
import { extractSameOriginLinks, parseSitemapUrls } from "./sitemap.js";

describe("parseSitemapUrls", () => {
    it("extracts and trims <loc> urls", () => {
        const xml = `<urlset><url><loc>https://x.com/</loc></url><url><loc> https://x.com/pricing </loc></url></urlset>`;
        expect(parseSitemapUrls(xml)).toEqual(["https://x.com/", "https://x.com/pricing"]);
    });

    it("returns nothing for a body with no locs", () => {
        expect(parseSitemapUrls("<html>not a sitemap</html>")).toEqual([]);
    });
});

describe("extractSameOriginLinks", () => {
    it("keeps same-origin links, resolves relative ones, strips fragments, drops cross-origin", () => {
        const html = `<a href="/pricing">p</a><a href="https://x.com/blog#top">b</a><a href="https://other.com/x">o</a>`;
        const links = extractSameOriginLinks(html, "https://x.com/");
        expect(links).toContain("https://x.com/pricing");
        expect(links).toContain("https://x.com/blog");
        expect(links.some(link => link.includes("other.com"))).toBe(false);
    });
});
