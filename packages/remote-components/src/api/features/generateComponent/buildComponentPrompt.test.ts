import { describe, expect, it } from "vitest";
import { getTokenCatalog } from "@webiny/theme-common";
import { buildComponentPrompt } from "./buildComponentPrompt.js";

describe("buildComponentPrompt", () => {
    const prompt = buildComponentPrompt();

    it("includes the Theme Tokens catalogue with real --wby- variables", () => {
        expect(prompt).toContain("## Theme Tokens");
        expect(prompt).toContain("--wby-color-action-primary-background");
    });

    it("uses no stale --wb- (non-wby) variable names", () => {
        // Strip the current prefix, then any remaining `--wb-` is the legacy one the hint used to carry.
        expect(prompt.replace(/--wby-/g, "")).not.toMatch(/--wb-/);
    });

    it("only references variables that exist in the theme token catalogue", () => {
        const catalogVariables = new Set(getTokenCatalog().map(entry => entry.variable));
        // Only actual `var(--wby-…)` usages — not prose (e.g. the "never use --wby-color-brand-*" note).
        const referenced = new Set(
            (prompt.match(/var\(--wby-[a-z0-9-]+/g) ?? []).map(match => match.replace("var(", ""))
        );

        expect(referenced.size).toBeGreaterThan(0);
        const unknown = [...referenced].filter(variable => !catalogVariables.has(variable));
        expect(unknown).toEqual([]);
    });

    it("instructs the model to include a fallback in every token reference", () => {
        expect(prompt).toMatch(/var\(--wby-…, <fallback>\)/);
    });
});
