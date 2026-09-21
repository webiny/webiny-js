import { describe, expect, it } from "vitest";
import { validateSitemapLocs } from "./validateSitemapLocs.js";

const ENTRY = "https://www.acme.com/";

const urls = (locs: string[]) => validateSitemapLocs(locs, ENTRY).entries.map(entry => entry.url);

describe("validateSitemapLocs", () => {
    it("drops entries on another host", () => {
        const result = validateSitemapLocs(
            [
                "https://www.acme.com/pricing",
                "https://cdn.acme.com/asset-page",
                "https://acme-partner.com/acme"
            ],
            ENTRY
        );

        expect(result.entries).toHaveLength(1);
        expect(result.offHost).toBe(2);
    });

    /*
     * A sitemap listing www. URLs for a job given the bare domain is common. Dropping the lot as
     * off-host would report a broken sitemap when the sitemap is fine.
     */
    it("treats www and the bare domain as the same host", () => {
        const result = validateSitemapLocs(["https://acme.com/pricing"], "https://www.acme.com/");

        expect(result.entries).toHaveLength(1);
        expect(result.offHost).toBe(0);
    });

    it("drops entries that do not address a page", () => {
        const result = validateSitemapLocs(
            [
                "https://www.acme.com/pricing",
                "https://www.acme.com/sitemap-posts.xml",
                "https://www.acme.com/brochure.pdf",
                "https://www.acme.com/logo.png"
            ],
            ENTRY
        );

        expect(result.entries.map(entry => entry.url)).toEqual(["https://www.acme.com/pricing"]);
        expect(result.nonPage).toBe(3);
    });

    it("folds spellings of one page to a single entry", () => {
        const result = validateSitemapLocs(
            [
                "https://www.acme.com/pricing",
                "https://www.acme.com/pricing/",
                "https://www.acme.com/pricing?utm_source=newsletter",
                "https://www.acme.com/pricing/index.html"
            ],
            ENTRY
        );

        expect(result.entries).toHaveLength(1);
        expect(result.duplicate).toBe(3);
    });

    it("keeps the order the sitemap listed them in", () => {
        expect(
            urls(["https://www.acme.com/c", "https://www.acme.com/a", "https://www.acme.com/b"])
        ).toEqual(["https://www.acme.com/c", "https://www.acme.com/a", "https://www.acme.com/b"]);
    });

    it("reports nothing usable for an entry URL that is not a URL", () => {
        const result = validateSitemapLocs(["https://www.acme.com/a"], "not a url");

        expect(result.entries).toHaveLength(0);
        expect(result.nonPage).toBe(1);
    });
});
