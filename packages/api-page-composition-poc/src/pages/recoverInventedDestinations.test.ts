import { describe, expect, it } from "vitest";
import { recoverInventedDestinations } from "./recoverInventedDestinations.js";

const bindings = (inputs: Record<string, string>): Record<string, any> => ({
    root: { inputs: { children: { static: ["el-1"], type: "slot", list: true } } },
    "el-1": {
        inputs: Object.fromEntries(
            Object.entries(inputs).map(([path, value]) => [path, { static: value, type: "text" }])
        )
    }
});

const staticOf = (result: { bindings: Record<string, any> }, path: string) =>
    result.bindings["el-1"].inputs[path].static;

describe("recoverInventedDestinations", () => {
    /*
     * The freehill case: the model wrote /privacy-policy, the site's page is
     * /apartments/tx/houston/privacy-policy, and it was migrated in this very run.
     */
    it("restores a shortened path to the migrated page it was reaching for", () => {
        const result = recoverInventedDestinations({
            bindings: bindings({ "privacyPolicyLink/url": "" }),
            invented: [
                { elementId: "el-1", path: "privacyPolicyLink/url", value: "/privacy-policy" }
            ],
            migratedPaths: new Set(["/", "/apartments/tx/houston/privacy-policy"])
        });

        expect(staticOf(result, "privacyPolicyLink/url")).toBe(
            "/apartments/tx/houston/privacy-policy"
        );
        expect(result.recovered).toEqual([
            {
                elementId: "el-1",
                path: "privacyPolicyLink/url",
                from: "/privacy-policy",
                to: "/apartments/tx/houston/privacy-policy"
            }
        ]);
        expect(result.unrecovered).toHaveLength(0);
    });

    /*
     * A wrong link is worse than an absent one, so two candidates means neither is chosen.
     */
    it("leaves a destination empty when two migrated pages end in the same segment", () => {
        const result = recoverInventedDestinations({
            bindings: bindings({ "cta/href": "" }),
            invented: [{ elementId: "el-1", path: "cta/href", value: "/contact" }],
            migratedPaths: new Set(["/uk/contact", "/us/contact"])
        });

        expect(staticOf(result, "cta/href")).toBe("");
        expect(result.recovered).toHaveLength(0);
        expect(result.unrecovered[0]).toMatchObject({ reason: "ambiguous", value: "/contact" });
    });

    it("leaves a destination empty when no migrated page ends in that segment", () => {
        const result = recoverInventedDestinations({
            bindings: bindings({ "cta/href": "" }),
            invented: [{ elementId: "el-1", path: "cta/href", value: "/privacy-policy" }],
            migratedPaths: new Set(["/", "/amenities"])
        });

        expect(staticOf(result, "cta/href")).toBe("");
        expect(result.unrecovered[0]).toMatchObject({ reason: "no-match" });
    });

    it("cannot match a fragment, which names no page at all", () => {
        const result = recoverInventedDestinations({
            bindings: bindings({ "skip/href": "" }),
            invented: [{ elementId: "el-1", path: "skip/href", value: "#main" }],
            migratedPaths: new Set(["/", "/main"])
        });

        expect(result.recovered).toHaveLength(0);
        expect(result.unrecovered[0]).toMatchObject({ reason: "no-match" });
    });

    it("ignores a query string and a trailing slash when matching", () => {
        const result = recoverInventedDestinations({
            bindings: bindings({ "cta/href": "" }),
            invented: [{ elementId: "el-1", path: "cta/href", value: "/residents/?ref=nav" }],
            migratedPaths: new Set(["/apartments/ct/bridgeport/residents"])
        });

        expect(staticOf(result, "cta/href")).toBe("/apartments/ct/bridgeport/residents");
    });

    it("does not invent a binding for an input that is no longer there", () => {
        const result = recoverInventedDestinations({
            bindings: bindings({ "cta/href": "" }),
            invented: [{ elementId: "el-1", path: "gone/href", value: "/residents" }],
            migratedPaths: new Set(["/residents"])
        });

        expect(result.bindings["el-1"].inputs["gone/href"]).toBeUndefined();
        expect(result.recovered).toHaveLength(0);
        expect(result.unrecovered).toHaveLength(1);
    });

    it("leaves the bindings untouched when there is nothing to recover", () => {
        const original = bindings({ "cta/href": "/amenities" });
        const result = recoverInventedDestinations({
            bindings: original,
            invented: [],
            migratedPaths: new Set(["/amenities"])
        });

        expect(result.bindings).toEqual(original);
        expect(result.recovered).toHaveLength(0);
    });
});
