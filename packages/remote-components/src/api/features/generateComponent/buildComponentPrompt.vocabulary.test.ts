import { describe, expect, it } from "vitest";
import { buildComponentPrompt } from "./buildComponentPrompt.js";

describe("buildComponentPrompt vocabulary override", () => {
    it("replaces the token catalog with the caller's", () => {
        const prompt = buildComponentPrompt({
            tokenCatalog: "### Spacing\n- `var(--wby-space-gap, 20px)` — The gap between items"
        });
        expect(prompt).toContain("- `var(--wby-space-gap, 20px)` — The gap between items");
        expect(prompt).not.toContain("var(--wby-space-md, 1rem)`");
    });

    it("rewrites the examples' variables and leaves the rest of the prompt alone", () => {
        const full = buildComponentPrompt();
        const rewritten = buildComponentPrompt({
            rewriteExampleVariable: variable =>
                variable.startsWith("--wby-space-") && variable !== "--wby-space-gap"
                    ? "var(--wby-space-gap, 20px)"
                    : null
        });
        const examples = rewritten.slice(rewritten.indexOf("## Examples"));
        expect(examples).not.toMatch(/--wby-space-(3xs|2xs|xs|sm|md|lg|xl|2xl|3xl)\b/);
        expect(examples).toContain("var(--wby-space-gap, 20px)");
        expect(rewritten.slice(0, rewritten.indexOf("## Examples"))).toBe(
            full.slice(0, full.indexOf("## Examples"))
        );
    });
});
