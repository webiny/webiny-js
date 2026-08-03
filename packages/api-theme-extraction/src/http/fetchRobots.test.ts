import { describe, expect, it } from "vitest";
import {
    fetchRobotsPolicy,
    MAX_ROBOTS_BYTES,
    robotsUrlFor,
    type FetchLike
} from "./fetchRobots.js";

const respond = (body: string, ok = true, status = 200) => {
    const impl: FetchLike = () =>
        Promise.resolve({ ok, status, text: () => Promise.resolve(body) });
    return impl;
};

const never: FetchLike = () => new Promise(() => {});

describe("robotsUrlFor", () => {
    it("derives the origin's robots.txt from any page on the site", () => {
        expect(robotsUrlFor("https://northbeam.io/pricing?a=1")).toBe(
            "https://northbeam.io/robots.txt"
        );
    });

    it("keeps a non-default port", () => {
        expect(robotsUrlFor("http://localhost:3000/x")).toBe("http://localhost:3000/robots.txt");
    });

    it("gives nothing for input that is not a URL", () => {
        expect(robotsUrlFor("northbeam.io")).toBeUndefined();
    });
});

describe("fetchRobotsPolicy", () => {
    it("applies the rules it finds", async () => {
        const policy = await fetchRobotsPolicy({
            url: "https://northbeam.io/",
            fetchImpl: respond("User-agent: *\nDisallow: /admin")
        });

        expect(policy.isAllowed("https://northbeam.io/admin")).toBe(false);
        expect(policy.isAllowed("https://northbeam.io/pricing")).toBe(true);
    });

    it("honours rules written for our agent specifically", async () => {
        const policy = await fetchRobotsPolicy({
            url: "https://northbeam.io/",
            fetchImpl: respond(
                "User-agent: *\nDisallow: /\nUser-agent: WebinyThemeExtractor\nAllow: /"
            )
        });

        expect(policy.isAllowed("https://northbeam.io/pricing")).toBe(true);
    });

    it("is permissive on a 404", async () => {
        // Absence of rules is not a prohibition.
        const policy = await fetchRobotsPolicy({
            url: "https://northbeam.io/",
            fetchImpl: respond("<html>Not found</html>", false, 404)
        });

        expect(policy.isAllowed("https://northbeam.io/anything")).toBe(true);
    });

    it("is permissive on a server error", async () => {
        const policy = await fetchRobotsPolicy({
            url: "https://northbeam.io/",
            fetchImpl: respond("", false, 500)
        });

        expect(policy.isAllowed("https://northbeam.io/anything")).toBe(true);
    });

    it("is permissive when the request throws", async () => {
        const policy = await fetchRobotsPolicy({
            url: "https://northbeam.io/",
            fetchImpl: () => Promise.reject(new Error("ENOTFOUND"))
        });

        expect(policy.isAllowed("https://northbeam.io/anything")).toBe(true);
    });

    it("does not hang when the server never answers", async () => {
        // Nothing in extraction may hang a task, and this runs before Chromium even launches.
        const policy = await fetchRobotsPolicy({
            url: "https://northbeam.io/",
            fetchImpl: never,
            timeoutMs: 10
        });

        expect(policy.isAllowed("https://northbeam.io/anything")).toBe(true);
    });

    it("is permissive when the URL is unusable", async () => {
        const policy = await fetchRobotsPolicy({ url: "northbeam.io", fetchImpl: never });
        expect(policy.isAllowed("northbeam.io")).toBe(true);
    });

    it("truncates an implausibly large file instead of parsing all of it", async () => {
        // Line-oriented, so a cut-off tail costs at most the last rule rather than corrupting the
        // ones already parsed.
        const padding = "#".repeat(MAX_ROBOTS_BYTES);
        const policy = await fetchRobotsPolicy({
            url: "https://northbeam.io/",
            fetchImpl: respond(`User-agent: *\nDisallow: /admin\n${padding}\nDisallow: /late`)
        });

        expect(policy.isAllowed("https://northbeam.io/admin")).toBe(false);
        expect(policy.isAllowed("https://northbeam.io/late")).toBe(true);
    });

    it("identifies itself when asking", async () => {
        let sent: string | undefined;
        await fetchRobotsPolicy({
            url: "https://northbeam.io/",
            fetchImpl: (_url, init) => {
                sent = init?.headers?.["user-agent"];
                return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve("") });
            }
        });

        expect(sent).toContain("Webiny");
    });

    it("exposes a crawl delay for the crawler to honour", async () => {
        const policy = await fetchRobotsPolicy({
            url: "https://northbeam.io/",
            fetchImpl: respond("User-agent: *\nCrawl-delay: 2")
        });

        expect(policy.crawlDelayMs).toBe(2000);
    });
});
