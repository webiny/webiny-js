import { afterEach, describe, expect, it, vi } from "vitest";
import { crawlSite } from "./crawlSite.js";

/*
 * The HTML here is synthetic, unlike the fixtures behind the derivation rules. What is under test is the
 * shape of a link graph — depth, cycles, cross-host edges, the two spellings of one page — and no single
 * captured page expresses that. A real site's HTML would make the assertions depend on that site's
 * current navigation, which is the opposite of what a crawl test should rest on.
 */
const SITE: Record<string, { status: number; html: string }> = {
    "https://acme.com/": {
        status: 200,
        html: `<title>Home</title>
            <a href="/pricing">Pricing</a>
            <a href="/pricing/">Pricing again</a>
            <a href="/gone">Gone</a>
            <a href="https://other.com/x">Partner</a>
            <a href="/brochure.pdf">Brochure</a>
            <a href="mailto:hi@acme.com">Mail</a>`
    },
    "https://acme.com/pricing": {
        status: 200,
        html: `<title>Pricing</title><a href="/pricing/enterprise">Enterprise</a><a href="/">Home</a>`
    },
    "https://acme.com/gone": { status: 404, html: "" },
    "https://acme.com/pricing/enterprise": {
        status: 200,
        html: `<title>Enterprise</title><a href="/pricing/enterprise/sla">SLA</a>`
    },
    "https://acme.com/pricing/enterprise/sla": { status: 200, html: `<title>SLA</title>` }
};

const stubFetch = () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
        calls.push(url);
        const page = SITE[url];
        if (!page) {
            return { ok: false, status: 404, url, text: async () => "" } as unknown as Response;
        }
        return {
            ok: page.status >= 200 && page.status < 300,
            status: page.status,
            url,
            text: async () => page.html
        } as unknown as Response;
    });
    return calls;
};

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("crawlSite", () => {
    it("walks the site, folds spellings of one page, and stays on the host", async () => {
        stubFetch();

        const result = await crawlSite({ entryUrl: "https://acme.com/" });

        expect([...result.fetched.keys()].sort()).toEqual([
            "acme.com/",
            "acme.com/gone",
            "acme.com/pricing",
            "acme.com/pricing/enterprise",
            "acme.com/pricing/enterprise/sla"
        ]);
        // /pricing and /pricing/ are one page, so the crawl fetched it once.
        expect(result.fetched.get("acme.com/pricing")).toBeDefined();
    });

    it("records what each page returned, so a dead link is a status and not a silence", async () => {
        stubFetch();

        const result = await crawlSite({ entryUrl: "https://acme.com/" });

        expect(result.fetched.get("acme.com/gone")).toMatchObject({ status: 404, ok: false });
        expect(result.fetched.get("acme.com/pricing")).toMatchObject({
            status: 200,
            ok: true,
            title: "Pricing"
        });
    });

    it("never follows a cross-host link or a non-page link", async () => {
        const calls = stubFetch();

        await crawlSite({ entryUrl: "https://acme.com/" });

        expect(calls.some(url => url.includes("other.com"))).toBe(false);
        expect(calls.some(url => url.endsWith(".pdf"))).toBe(false);
        expect(calls.some(url => url.startsWith("mailto:"))).toBe(false);
    });

    it("survives a cycle: /pricing links back to the home page", async () => {
        const calls = stubFetch();

        await crawlSite({ entryUrl: "https://acme.com/" });

        expect(calls.filter(url => url === "https://acme.com/")).toHaveLength(1);
    });

    /*
     * At the depth limit the links are recorded but not walked. Dropping them would make the union
     * short by a level, and a sitemap listing them would then read as orphan pages.
     */
    it("records the level it did not walk instead of losing it", async () => {
        stubFetch();

        const result = await crawlSite({ entryUrl: "https://acme.com/", maxDepth: 2 });

        expect([...result.fetched.keys()]).toContain("acme.com/pricing/enterprise");
        expect([...result.fetched.keys()]).not.toContain("acme.com/pricing/enterprise/sla");
        expect([...result.seen.keys()]).toEqual(["acme.com/pricing/enterprise/sla"]);
        expect(result.depth).toBe(2);
    });

    it("stops on the request ceiling and says it was cut short", async () => {
        stubFetch();

        const result = await crawlSite({ entryUrl: "https://acme.com/", maxFetches: 2 });

        expect(result.fetched.size).toBeLessThanOrEqual(2);
        expect(result.truncated).toBe(true);
    });

    it("stops when the stage is running out of time, rather than dying of a timeout", async () => {
        stubFetch();

        const result = await crawlSite({ entryUrl: "https://acme.com/", shouldStop: () => true });

        expect(result.truncated).toBe(true);
        expect(result.fetched.size).toBe(0);
    });

    it("reports nothing for an entry URL that is not a page URL", async () => {
        stubFetch();

        const result = await crawlSite({ entryUrl: "not a url" });

        expect(result.fetched.size).toBe(0);
        expect(result.truncated).toBe(false);
    });
});
