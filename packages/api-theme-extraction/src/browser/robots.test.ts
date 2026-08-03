import { describe, expect, it } from "vitest";
import {
    createRobotsPolicy,
    isPathAllowed,
    MAX_CRAWL_DELAY_MS,
    parseRobotsTxt,
    selectRobotsGroup
} from "./robots.js";

const groupFor = (text: string, agent = "webinythemeextractor") => {
    return selectRobotsGroup(parseRobotsTxt(text), agent);
};

describe("parseRobotsTxt", () => {
    it("groups consecutive user-agent lines together", () => {
        const robots = parseRobotsTxt(`
            User-agent: alpha
            User-agent: beta
            Disallow: /private
        `);

        expect(robots.groups).toHaveLength(1);
        expect(robots.groups[0].agents).toEqual(["alpha", "beta"]);
        expect(robots.groups[0].rules).toEqual([{ type: "disallow", pattern: "/private" }]);
    });

    it("starts a new group when an agent line follows a rule", () => {
        const robots = parseRobotsTxt(`
            User-agent: alpha
            Disallow: /a
            User-agent: beta
            Disallow: /b
        `);

        expect(robots.groups).toHaveLength(2);
        expect(robots.groups[1].agents).toEqual(["beta"]);
    });

    it("strips inline comments", () => {
        const robots = parseRobotsTxt("User-agent: * # everyone\nDisallow: /x # nope");

        expect(robots.groups[0].agents).toEqual(["*"]);
        expect(robots.groups[0].rules[0].pattern).toBe("/x");
    });

    it("drops an empty Disallow rather than treating it as a pattern", () => {
        // `Disallow:` with no value means "nothing is disallowed" — storing it as a rule would make
        // it match every path.
        const robots = parseRobotsTxt("User-agent: *\nDisallow:");

        expect(robots.groups[0].rules).toEqual([]);
        expect(isPathAllowed(robots.groups[0], "/anything")).toBe(true);
    });

    it("ignores rules that appear before any user-agent line", () => {
        const robots = parseRobotsTxt("Disallow: /orphan\nUser-agent: *\nDisallow: /real");

        expect(robots.groups).toHaveLength(1);
        expect(robots.groups[0].rules).toEqual([{ type: "disallow", pattern: "/real" }]);
    });

    it("caps an unreasonable crawl delay", () => {
        const robots = parseRobotsTxt("User-agent: *\nCrawl-delay: 3600");
        expect(robots.groups[0].crawlDelayMs).toBe(MAX_CRAWL_DELAY_MS);
    });

    it("keeps a reasonable crawl delay", () => {
        const robots = parseRobotsTxt("User-agent: *\nCrawl-delay: 2");
        expect(robots.groups[0].crawlDelayMs).toBe(2000);
    });

    it("survives junk without throwing", () => {
        expect(() => parseRobotsTxt("<!DOCTYPE html><html>404</html>")).not.toThrow();
        expect(parseRobotsTxt("").groups).toEqual([]);
    });
});

describe("selectRobotsGroup", () => {
    it("prefers a group naming us over the wildcard, wherever it appears", () => {
        // The named group is deliberately last: honouring only the first match would apply the
        // wildcard rules and ignore the ones written for us.
        const group = groupFor(`
            User-agent: *
            Disallow: /
            User-agent: WebinyThemeExtractor
            Disallow: /admin
        `);

        expect(group?.rules).toEqual([{ type: "disallow", pattern: "/admin" }]);
        expect(isPathAllowed(group, "/pricing")).toBe(true);
    });

    it("matches the agent case-insensitively", () => {
        const group = groupFor("User-agent: webinythemeextractor\nDisallow: /x");
        expect(group?.rules).toHaveLength(1);
    });

    it("merges split groups naming the same agent", () => {
        const group = groupFor(`
            User-agent: WebinyThemeExtractor
            Disallow: /a
            User-agent: WebinyThemeExtractor
            Disallow: /b
        `);

        expect(group?.rules).toHaveLength(2);
    });

    it("takes the strictest delay when merged groups disagree", () => {
        const group = groupFor(`
            User-agent: WebinyThemeExtractor
            Crawl-delay: 1
            User-agent: WebinyThemeExtractor
            Crawl-delay: 3
        `);

        expect(group?.crawlDelayMs).toBe(3000);
    });

    it("falls back to the wildcard group", () => {
        const group = groupFor("User-agent: *\nDisallow: /nope");
        expect(group?.agents).toEqual(["*"]);
    });

    it("returns nothing when no group applies", () => {
        expect(groupFor("User-agent: googlebot\nDisallow: /")).toBeUndefined();
    });
});

describe("isPathAllowed", () => {
    it("allows everything when there is no group", () => {
        expect(isPathAllowed(undefined, "/anything")).toBe(true);
    });

    it("honours a prefix disallow", () => {
        const group = groupFor("User-agent: *\nDisallow: /private");

        expect(isPathAllowed(group, "/private")).toBe(false);
        expect(isPathAllowed(group, "/private/deep")).toBe(false);
        expect(isPathAllowed(group, "/public")).toBe(true);
    });

    it("lets the longest matching pattern win", () => {
        const group = groupFor(`
            User-agent: *
            Disallow: /docs
            Allow: /docs/public
        `);

        expect(isPathAllowed(group, "/docs/internal")).toBe(false);
        expect(isPathAllowed(group, "/docs/public/a")).toBe(true);
    });

    it("gives Allow the tie on an equal-length pattern", () => {
        // A deliberate carve-out written at the same specificity would otherwise be unreachable.
        const group = groupFor("User-agent: *\nDisallow: /search\nAllow: /search");
        expect(isPathAllowed(group, "/search")).toBe(true);
    });

    it("expands a wildcard", () => {
        const group = groupFor("User-agent: *\nDisallow: /*.pdf");

        expect(isPathAllowed(group, "/files/report.pdf")).toBe(false);
        expect(isPathAllowed(group, "/files/report.html")).toBe(true);
    });

    it("honours an end anchor", () => {
        const group = groupFor("User-agent: *\nDisallow: /page$");

        expect(isPathAllowed(group, "/page")).toBe(false);
        expect(isPathAllowed(group, "/pages")).toBe(true);
    });

    it("treats regex characters in a pattern literally", () => {
        const group = groupFor("User-agent: *\nDisallow: /a+b(c)");

        expect(isPathAllowed(group, "/a+b(c)")).toBe(false);
        expect(isPathAllowed(group, "/aaab")).toBe(true);
    });

    it("blocks the whole site on a bare slash", () => {
        const group = groupFor("User-agent: *\nDisallow: /");
        expect(isPathAllowed(group, "/")).toBe(false);
        expect(isPathAllowed(group, "/anything")).toBe(false);
    });
});

describe("createRobotsPolicy", () => {
    it("is permissive when there is no robots.txt", () => {
        // Absence of rules is not a prohibition, and the alternative makes every site without a
        // robots.txt un-extractable.
        const policy = createRobotsPolicy(undefined, "WebinyThemeExtractor");

        expect(policy.isAllowed("https://northbeam.io/pricing")).toBe(true);
        expect(policy.crawlDelayMs).toBe(0);
    });

    it("is permissive when the file is unparseable", () => {
        const policy = createRobotsPolicy("<html>not robots</html>", "WebinyThemeExtractor");
        expect(policy.isAllowed("https://northbeam.io/")).toBe(true);
    });

    it("applies rules to a full URL's path and query", () => {
        const policy = createRobotsPolicy(
            "User-agent: *\nDisallow: /admin\nDisallow: /*?preview=",
            "WebinyThemeExtractor"
        );

        expect(policy.isAllowed("https://northbeam.io/admin/users")).toBe(false);
        expect(policy.isAllowed("https://northbeam.io/page?preview=1")).toBe(false);
        expect(policy.isAllowed("https://northbeam.io/pricing")).toBe(true);
    });

    it("exposes the crawl delay", () => {
        const policy = createRobotsPolicy("User-agent: *\nCrawl-delay: 1", "WebinyThemeExtractor");
        expect(policy.crawlDelayMs).toBe(1000);
    });

    it("does not reject a malformed URL on robots' behalf", () => {
        // Let the fetch fail with a real error rather than reporting it as a robots restriction.
        const policy = createRobotsPolicy("User-agent: *\nDisallow: /", "WebinyThemeExtractor");
        expect(policy.isAllowed("not-a-url")).toBe(true);
    });
});
