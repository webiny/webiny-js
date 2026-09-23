import { describe, expect, it } from "vitest";
import { stripInventedBindings } from "./stripInventedBindings.js";

const SOURCE_HOST = "www.parkcityplace.org";
const CAPTURED = new Set([
    "https://www.parkcityplace.org/",
    "https://cthousingpartners.org/privacy-policy/"
]);

const bindings = (inputs: Record<string, string>): Record<string, any> => ({
    root: { inputs: { children: { static: ["el-1"], type: "slot", list: true } } },
    "el-1": {
        inputs: Object.fromEntries(
            Object.entries(inputs).map(([path, value]) => [path, { static: value, type: "text" }])
        )
    }
});

const strip = (inputs: Record<string, string>) =>
    stripInventedBindings({
        bindings: bindings(inputs),
        contextByElement: new Map([["el-1", { captured: CAPTURED }]]),
        sourceHost: SOURCE_HOST
    });

const staticOf = (result: { bindings: Record<string, any> }, path: string) =>
    result.bindings["el-1"].inputs[path].static;

describe("stripInventedBindings — checking the page rather than the inputs", () => {
    /*
     * The case the inputs-level check missed. `privacyPolicyLink` was absent from the manifest's
     * `defaults.inputs`, so it was absent from the object being checked — and ElementFactory then
     * filled it from the input's own params.defaultValue, after the check had run. Nine of these
     * reached a live footer.
     */
    it("empties an invented destination that only exists once the element is built", () => {
        const result = strip({ "privacyPolicyLink/url": "/privacy-policy" });

        expect(staticOf(result, "privacyPolicyLink/url")).toBe("");
        expect(result.invented).toEqual([
            { elementId: "el-1", path: "privacyPolicyLink/url", value: "/privacy-policy" }
        ]);
    });

    it("keeps a destination the section actually linked to", () => {
        const result = strip({ "legal/href": "https://cthousingpartners.org/privacy-policy/" });

        expect(staticOf(result, "legal/href")).toBe(
            "https://cthousingpartners.org/privacy-policy/"
        );
        expect(result.invented).toHaveLength(0);
    });

    it("keeps another host and a non-page scheme", () => {
        const result = strip({ "map/url": "https://maps.example.com/x", "call/href": "tel:475" });

        expect(staticOf(result, "map/url")).toBe("https://maps.example.com/x");
        expect(staticOf(result, "call/href")).toBe("tel:475");
        expect(result.invented).toHaveLength(0);
    });

    it("reaches a destination nested inside a list", () => {
        const result = strip({ "columns/0/links/0/url": "/residents" });

        expect(staticOf(result, "columns/0/links/0/url")).toBe("");
        expect(result.invented[0].path).toBe("columns/0/links/0/url");
    });

    it("leaves inputs that are not destinations alone, even when they look like paths", () => {
        const result = strip({ heading: "/not/a/destination", "logo/alt": "/still/not" });

        expect(staticOf(result, "heading")).toBe("/not/a/destination");
        expect(result.invented).toHaveLength(0);
    });

    /*
     * `#` goes nowhere openly and misleads nobody; `/privacy-policy` looks live and 404s. Both are
     * emptied, only the second is a finding — counting placeholders would inflate the number this
     * fix is measured by.
     */
    it("empties a placeholder without recording it as invented", () => {
        const result = strip({ "cta/href": "#" });

        expect(staticOf(result, "cta/href")).toBe("");
        expect(result.invented).toHaveLength(0);
    });

    /*
     * An element with no recorded context is one this page did not build from a captured section.
     * Judging its destinations against an empty captured set would empty every one of them.
     */
    it("leaves an element alone when there is no context for it", () => {
        const result = stripInventedBindings({
            bindings: bindings({ "cta/href": "/somewhere" }),
            contextByElement: new Map(),
            sourceHost: SOURCE_HOST
        });

        expect(staticOf(result, "cta/href")).toBe("/somewhere");
        expect(result.invented).toHaveLength(0);
    });

    it("leaves bindings without inputs untouched", () => {
        const result = stripInventedBindings({
            bindings: { "el-1": { styles: { color: "red" } } },
            contextByElement: new Map([["el-1", { captured: CAPTURED }]]),
            sourceHost: SOURCE_HOST
        });

        expect(result.bindings["el-1"]).toEqual({ styles: { color: "red" } });
    });
});
