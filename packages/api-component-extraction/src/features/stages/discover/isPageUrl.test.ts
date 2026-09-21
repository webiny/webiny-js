import { describe, expect, it } from "vitest";
import { isPageUrl } from "./isPageUrl.js";

describe("isPageUrl", () => {
    it.each([
        "https://x.com/",
        "https://x.com/pricing",
        "https://x.com/about/index.html",
        "https://x.com/product.php",
        "https://x.com/careers/roles.aspx",
        "https://x.com/search?q=cms"
    ])("accepts %s", url => {
        expect(isPageUrl(url)).toBe(true);
    });

    it.each([
        "https://x.com/sitemap.xml",
        "https://x.com/brochure.pdf",
        "https://x.com/hero.jpg",
        "https://x.com/logo.svg",
        "https://x.com/bundle.js",
        "https://x.com/styles.css",
        "https://x.com/feed.rss",
        "https://x.com/data.json",
        "https://x.com/robots.txt",
        "https://x.com/app.dmg"
    ])("rejects %s", url => {
        expect(isPageUrl(url)).toBe(false);
    });

    it("rejects something that is not a URL", () => {
        expect(isPageUrl("not a url")).toBe(false);
    });

    it("looks at the path, not the query", () => {
        expect(isPageUrl("https://x.com/download?file=brochure.pdf")).toBe(true);
    });
});
