import { describe, expect, it } from "vitest";
import { rewriteDestinations, tally } from "./rewriteDestinations.js";

const SOURCE_HOST = "www.webiny.com";

/** Bindings in the shape Website Builder stores them: flat input paths under an element id. */
const bindings = (inputs: Record<string, string>): Record<string, any> => ({
    root: { inputs: { children: { static: ["el-1"], type: "slot", list: true } } },
    "el-1": {
        inputs: Object.fromEntries(
            Object.entries(inputs).map(([path, value]) => [path, { static: value, type: "text" }])
        )
    }
});

const rewrite = (inputs: Record<string, string>, migrated: string[]) =>
    rewriteDestinations({
        bindings: bindings(inputs),
        migratedPaths: new Set(migrated),
        sourceHost: SOURCE_HOST
    });

const staticOf = (result: { bindings: Record<string, any> }, path: string) =>
    result.bindings["el-1"].inputs[path].static;

describe("rewriteDestinations — the three-way rule", () => {
    it("rewrites a destination pointing at a migrated page", () => {
        const result = rewrite({ "links/0/url": "https://www.webiny.com/pricing" }, ["/pricing"]);

        expect(staticOf(result, "links/0/url")).toBe("/pricing");
        expect(result.outcomes[0]).toMatchObject({ kind: "rewritten", to: "/pricing" });
    });

    it("leaves another host exactly as it was", () => {
        const href = "https://github.com/webiny/webiny-js";
        const result = rewrite({ "links/0/url": href }, ["/pricing"]);

        expect(staticOf(result, "links/0/url")).toBe(href);
        expect(result.outcomes[0]).toMatchObject({ kind: "external" });
    });

    it("leaves a same-host page that was not migrated absolute, and flags it", () => {
        const href = "https://www.webiny.com/headless-cms";
        const result = rewrite({ "links/0/url": href }, ["/pricing"]);

        expect(staticOf(result, "links/0/url")).toBe(href);
        expect(result.outcomes[0]).toMatchObject({ kind: "unmigrated", href });
    });

    it("treats a scheme that is not a page reference as external", () => {
        const result = rewrite({ "links/0/url": "mailto:hi@webiny.com" }, ["/"]);

        expect(result.outcomes[0]).toMatchObject({ kind: "external" });
    });
});

describe("rewriteDestinations — normalisation before matching", () => {
    const migrated = ["/", "/pricing", "/about"];

    it.each([
        ["https://www.webiny.com/pricing", "/pricing"],
        ["https://www.webiny.com/pricing/", "/pricing"],
        ["https://www.webiny.com/pricing?ref=nav", "/pricing"],
        ["https://www.webiny.com/pricing#plans", "/pricing"],
        ["https://www.webiny.com/pricing.html", "/pricing"],
        ["/pricing", "/pricing"],
        ["https://www.webiny.com/about/index.html", "/about"],
        ["https://www.webiny.com/", "/"],
        ["https://www.webiny.com", "/"]
    ])("matches %s to %s", (href, expected) => {
        const result = rewrite({ "cta/url": href }, migrated);

        expect(staticOf(result, "cta/url")).toBe(expected);
        expect(result.outcomes[0]?.kind).toBe("rewritten");
    });
});

describe("rewriteDestinations — which inputs count as destinations", () => {
    it("rewrites every destination-shaped field name, nested or not", () => {
        const result = rewrite(
            {
                "columns/0/links/0/url": "https://www.webiny.com/pricing",
                "navItems/0/href": "https://www.webiny.com/pricing",
                "cta/link": "https://www.webiny.com/pricing",
                "button/to": "https://www.webiny.com/pricing"
            },
            ["/pricing"]
        );

        expect(tally(result.outcomes)).toMatchObject({ destinations: 4, rewritten: 4 });
    });

    it("does not touch a field that merely contains a URL-like string", () => {
        const result = rewrite(
            { "columns/0/label": "https://www.webiny.com/pricing", heading: "Pricing" },
            ["/pricing"]
        );

        expect(staticOf(result, "columns/0/label")).toBe("https://www.webiny.com/pricing");
        expect(result.outcomes).toHaveLength(0);
    });
});

describe("rewriteDestinations — the count must hold", () => {
    it("accounts for every destination exactly once and preserves them all", () => {
        const inputs = {
            "columns/0/links/0/url": "https://www.webiny.com/pricing",
            "columns/0/links/1/url": "https://www.webiny.com/headless-cms",
            "columns/1/links/0/url": "https://github.com/webiny/webiny-js",
            "socialLinks/0/url": "mailto:hi@webiny.com",
            "cta/href": "/about"
        };
        const result = rewrite(inputs, ["/pricing", "/about"]);
        const counts = tally(result.outcomes);

        // Before and after must match: a drop means normalisation lost a link.
        const before = Object.keys(inputs).length;
        const after = Object.values(result.bindings["el-1"].inputs).filter(
            (binding: any) => typeof binding.static === "string" && binding.static
        ).length;

        expect(before).toBe(5);
        expect(after).toBe(before);
        expect(counts.destinations).toBe(before);
        expect(counts.rewritten + counts.external + counts.unmigrated).toBe(counts.destinations);
        expect(counts).toEqual({ destinations: 5, rewritten: 2, external: 2, unmigrated: 1 });
    });

    it("leaves bindings without inputs untouched", () => {
        const result = rewriteDestinations({
            bindings: { "el-1": { styles: { color: "red" } } },
            migratedPaths: new Set(["/"]),
            sourceHost: SOURCE_HOST
        });

        expect(result.bindings["el-1"]).toEqual({ styles: { color: "red" } });
        expect(result.outcomes).toHaveLength(0);
    });
});
