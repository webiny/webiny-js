import { describe, expect, it } from "vitest";
import { extractSameHostLinks } from "./extractSameHostLinks.js";

describe("extractSameHostLinks", () => {
    it("resolves relative links, strips fragments and drops other hosts", () => {
        const html = `<a href="/pricing">p</a><a href="https://x.com/blog#top">b</a><a href="https://other.com/x">o</a>`;

        const links = extractSameHostLinks(html, "https://x.com/", "x.com");

        expect(links).toContain("https://x.com/pricing");
        expect(links).toContain("https://x.com/blog");
        expect(links.some(link => link.includes("other.com"))).toBe(false);
    });

    /*
     * Same host, not same origin. A site that links to itself over http from an https page, or mixes
     * www. with the bare domain, is one site — treating those as foreign would cut the crawl short at
     * the first such link.
     */
    it("follows the same site across protocol and www", () => {
        const html = `<a href="http://x.com/a">a</a><a href="https://www.x.com/b">b</a>`;

        const links = extractSameHostLinks(html, "https://x.com/", "x.com");

        expect(links).toHaveLength(2);
    });

    it("ignores links that address no page", () => {
        const html = `<a href="mailto:hi@x.com">m</a><a href="tel:+1">t</a><a href="javascript:void(0)">j</a>`;

        expect(extractSameHostLinks(html, "https://x.com/", "x.com")).toHaveLength(0);
    });

    /*
     * The regression that made this an argument. Relative links must resolve against where the
     * response came from, but "same site" is always asked of the site being crawled — otherwise one
     * outbound redirect redefines it and the crawl walks onto the redirect target's site.
     */
    it("judges the site by the site host, not by a base the redirect moved", () => {
        const html = `<a href="/webiny/webiny-js">repo</a><a href="https://x.com/pricing">p</a>`;

        const links = extractSameHostLinks(html, "https://github.com/webiny", "x.com");

        expect(links).toEqual(["https://x.com/pricing"]);
    });

    it("returns nothing for a base that is not a URL", () => {
        expect(extractSameHostLinks(`<a href="/a">a</a>`, "not a url", "x.com")).toEqual([]);
    });
});
