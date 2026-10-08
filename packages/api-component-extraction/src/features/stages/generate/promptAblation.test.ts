import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { PlannedComponent } from "~/domain/artifacts.js";
import { buildComponentPrompt } from "./componentGeneration.js";

// thevibe's Hero Intro as stored: colours with variables, a type scale, left-aligned text.
const hero = JSON.parse(
    readFileSync(new URL("./__fixtures__/thevibe-hero-intro.plan.json", import.meta.url), "utf8")
) as PlannedComponent;
const variables = new Map([["color.text.primary", ["--wby-color-text-primary"]]]);

describe("lines measured dead", () => {
    const prompt = buildComponentPrompt(hero, variables);

    it("are no longer in the extraction prompt", () => {
        // scripts/baseline/reports/2026-10-08/ablation-result.md and line5-result.md
        expect(prompt).not.toContain("Do not substitute a default heading size");
        expect(prompt).not.toContain("Do not centre text this section does not centre");
        expect(prompt).not.toContain("do not write a hex value");
        expect(prompt).not.toContain("Use ONLY these theme CSS variables");
        expect(prompt).toContain("The theme's CSS variables:");
        expect(prompt).toContain("Do not substitute a different theme colour for one listed here.");
    });
});
