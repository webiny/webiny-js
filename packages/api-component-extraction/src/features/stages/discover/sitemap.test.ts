import { describe, expect, it } from "vitest";
import { parseSitemap } from "./sitemap.js";

describe("parseSitemap", () => {
    it("reads a urlset's locs, trimmed", () => {
        const xml = `<urlset><url><loc>https://x.com/</loc></url><url><loc> https://x.com/pricing </loc></url></urlset>`;

        expect(parseSitemap(xml)).toEqual({
            kind: "urlset",
            locs: ["https://x.com/", "https://x.com/pricing"]
        });
    });

    it("tolerates a namespaced urlset", () => {
        const xml = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://x.com/a</loc></url></urlset>`;

        expect(parseSitemap(xml).kind).toBe("urlset");
    });

    /*
     * An index's locs are child sitemaps, not pages. Reading them as pages is how a bad sitemap gets
     * through every downstream check: they are same-host and they resolve, so a run captures a few XML
     * documents believing they are the site.
     */
    it("tells a sitemap index apart from a page list", () => {
        const xml = `<sitemapindex><sitemap><loc>https://x.com/sitemap-pages.xml</loc></sitemap></sitemapindex>`;

        expect(parseSitemap(xml)).toEqual({
            kind: "index",
            locs: ["https://x.com/sitemap-pages.xml"]
        });
    });

    it("reports a body that is not a sitemap, and keeps none of its URLs", () => {
        const html = `<html><body><a href="https://x.com/a">not a sitemap</a><loc>https://x.com/b</loc></body></html>`;

        expect(parseSitemap(html)).toEqual({ kind: "not-sitemap", locs: [] });
    });

    it("reports an empty but valid sitemap as a urlset with nothing in it", () => {
        expect(parseSitemap("<urlset></urlset>")).toEqual({ kind: "urlset", locs: [] });
    });
});
