import { describe, expect, it } from "vitest";
import { foldHost, pageIdentity } from "./pageIdentity.js";

const BASE = "https://www.webiny.com/";

describe("pageIdentity — the folding table the rewriting pass uses", () => {
    /*
     * These rows are the page-composition rewriting pass's normalisation table, deliberately repeated
     * here against the same expectations. Discover deduping differently from the way rewriting matches
     * would mean capturing one page twice, so if one table changes the other has to change with it.
     */
    it.each([
        ["https://www.webiny.com/pricing", "webiny.com/pricing"],
        ["https://www.webiny.com/pricing/", "webiny.com/pricing"],
        ["https://www.webiny.com/pricing?ref=nav", "webiny.com/pricing"],
        ["https://www.webiny.com/pricing#plans", "webiny.com/pricing"],
        ["https://www.webiny.com/pricing.html", "webiny.com/pricing"],
        ["/pricing", "webiny.com/pricing"],
        ["https://www.webiny.com/about/index.html", "webiny.com/about"],
        ["https://www.webiny.com/", "webiny.com/"],
        ["https://www.webiny.com", "webiny.com/"]
    ])("folds %s to %s", (url, expected) => {
        expect(pageIdentity(url, BASE)).toBe(expected);
    });

    it("folds the spellings of one page together", () => {
        const spellings = [
            "https://www.webiny.com/pricing",
            "http://webiny.com/pricing/",
            "https://WEBINY.com/Pricing?utm_source=x#top",
            "https://www.webiny.com/pricing/index.html"
        ];

        expect(new Set(spellings.map(url => pageIdentity(url)))).toHaveLength(1);
    });

    it("keeps genuinely different paths apart", () => {
        expect(pageIdentity("https://x.com/a/b")).not.toBe(pageIdentity("https://x.com/a"));
        expect(pageIdentity("https://x.com/a")).not.toBe(pageIdentity("https://y.com/a"));
    });
});

describe("pageIdentity — what is not a page", () => {
    it.each(["mailto:hi@webiny.com", "tel:+123", "javascript:void(0)", "not a url", ""])(
        "returns null for %s",
        value => {
            expect(pageIdentity(value)).toBeNull();
        }
    );

    it("needs a base to fold a relative URL", () => {
        expect(pageIdentity("/pricing")).toBeNull();
        expect(pageIdentity("/pricing", BASE)).toBe("webiny.com/pricing");
    });
});

describe("foldHost", () => {
    it("treats www as the same site and is case-insensitive", () => {
        expect(foldHost("www.Example.com")).toBe("example.com");
        expect(foldHost("example.com")).toBe("example.com");
    });

    it("does not strip another subdomain", () => {
        expect(foldHost("blog.example.com")).toBe("blog.example.com");
    });
});
