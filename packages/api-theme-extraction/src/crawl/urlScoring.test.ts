import { describe, expect, it } from "vitest";
import { DEFAULT_CRAWL_LIMIT, normaliseUrl, selectCrawlUrls } from "./urlScoring.js";

const nav = (...paths: string[]) => paths.map(href => ({ href, source: "nav" as const }));

const select = (paths: string[], entryUrl = "https://northbeam.io/") =>
    selectCrawlUrls({ entryUrl, links: nav(...paths) }).map(entry => entry.url);

describe("normaliseUrl", () => {
    it("drops the query and fragment, so links differing only by query collapse", () => {
        expect(normaliseUrl("/pricing?ref=nav#plans", "https://northbeam.io/")).toBe(
            "https://northbeam.io/pricing"
        );
    });

    it("normalises the trailing slash but keeps the root", () => {
        expect(normaliseUrl("/platform/", "https://northbeam.io/")).toBe(
            "https://northbeam.io/platform"
        );
        expect(normaliseUrl("/", "https://northbeam.io/")).toBe("https://northbeam.io/");
    });

    it("rejects non-http schemes", () => {
        expect(normaliseUrl("mailto:hi@northbeam.io", "https://northbeam.io/")).toBeNull();
        expect(normaliseUrl("javascript:void(0)", "https://northbeam.io/")).toBeNull();
        expect(normaliseUrl("tel:+441234", "https://northbeam.io/")).toBeNull();
    });

    it("rejects an unusable base", () => {
        expect(normaliseUrl("/pricing", "not a url")).toBeNull();
    });
});

describe("selectCrawlUrls", () => {
    it("always includes the entry URL first", () => {
        const urls = select(["/platform"]);
        expect(urls[0]).toBe("https://northbeam.io/");
    });

    it("stops at five pages", () => {
        const urls = select([
            "/platform",
            "/pricing",
            "/about",
            "/blog",
            "/customers",
            "/contact",
            "/docs"
        ]);

        expect(urls).toHaveLength(DEFAULT_CRAWL_LIMIT);
    });

    it("ranks a distinct section above a second page from one already chosen", () => {
        // The brief asks us to *prefer* distinct first segments, not to forbid repeats: with budget
        // to spare a second blog page is better than crawling nothing. What matters is the order.
        const urls = select(["/blog/route-density", "/blog/lane-planning", "/pricing"]);

        expect(urls[1]).toBe("https://northbeam.io/pricing");
        expect(urls.indexOf("https://northbeam.io/pricing")).toBeLessThan(
            urls.findIndex(url => url.includes("/blog/lane-planning"))
        );
    });

    it("drops same-section repeats first when the budget is tight", () => {
        const urls = selectCrawlUrls({
            entryUrl: "https://northbeam.io/",
            links: nav("/blog/route-density", "/blog/lane-planning", "/pricing"),
            limit: 2
        }).map(entry => entry.url);

        expect(urls).toEqual(["https://northbeam.io/", "https://northbeam.io/pricing"]);
    });

    it("penalises utility and legal pages out of the running", () => {
        const urls = select(["/login", "/cart", "/privacy", "/terms", "/search", "/account"]);

        expect(urls).toEqual(["https://northbeam.io/"]);
    });

    it("penalises anything that looks like a file", () => {
        const urls = select(["/brochure.pdf", "/logo.svg", "/platform"]);

        expect(urls).toEqual(["https://northbeam.io/", "https://northbeam.io/platform"]);
    });

    it("treats links differing only by query string as one page", () => {
        const urls = select(["/pricing?ref=nav", "/pricing?ref=footer", "/pricing"]);

        expect(urls).toEqual(["https://northbeam.io/", "https://northbeam.io/pricing"]);
    });

    it("ignores other origins", () => {
        const urls = select([
            "https://docs.northbeam.io/start",
            "https://twitter.com/northbeam",
            "/platform"
        ]);

        expect(urls).toEqual(["https://northbeam.io/", "https://northbeam.io/platform"]);
    });

    it("ranks nav links above footer links", () => {
        const result = selectCrawlUrls({
            entryUrl: "https://northbeam.io/",
            links: [
                { href: "/imprint-ish", source: "footer" },
                { href: "/platform", source: "nav" }
            ],
            limit: 2
        });

        expect(result[1].url).toBe("https://northbeam.io/platform");
    });

    it("prefers shallow pages over deeply nested ones", () => {
        const result = selectCrawlUrls({
            entryUrl: "https://northbeam.io/",
            links: nav("/solutions/freight/europe/nordics", "/pricing"),
            limit: 2
        });

        expect(result[1].url).toBe("https://northbeam.io/pricing");
    });

    it("explains every choice, so a surprising crawl list can be debugged", () => {
        const result = selectCrawlUrls({
            entryUrl: "https://northbeam.io/",
            links: nav("/pricing")
        });

        expect(result[0].reasons).toEqual(["the URL you gave us"]);
        expect(result[1].reasons).toContain("linked from the nav");
        expect(result[1].reasons).toContain("content-looking path");
    });

    it("is deterministic, so a re-run picks the same pages", () => {
        const paths = ["/platform", "/pricing", "/about", "/blog", "/contact"];
        expect(select(paths)).toEqual(select(paths));
    });

    it("returns nothing for an unusable entry URL", () => {
        expect(selectCrawlUrls({ entryUrl: "not a url", links: [] })).toEqual([]);
    });
});
