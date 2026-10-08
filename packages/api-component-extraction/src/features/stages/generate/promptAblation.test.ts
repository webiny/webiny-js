import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { PlannedComponent } from "~/domain/artifacts.js";
import { buildComponentPrompt, EXTRACTION_PROMPT_LINE_IDS } from "./componentGeneration.js";

// thevibe's Hero Intro as stored: colours with variables, a type scale, left-aligned text.
const hero = JSON.parse(
    readFileSync(new URL("./__fixtures__/thevibe-hero-intro.plan.json", import.meta.url), "utf8")
) as PlannedComponent;
const variables = new Map([["color.text.primary", ["--wby-color-text-primary"]]]);

const removed: Record<string, string> = {
    "extraction.only-variables": "Use ONLY these theme CSS variables"
};

describe("prompt ablation", () => {
    const full = buildComponentPrompt(hero, variables);

    it("builds the deployed prompt when nothing is left out", () => {
        expect(buildComponentPrompt(hero, variables, [], new Set())).toBe(full);
        for (const id of EXTRACTION_PROMPT_LINE_IDS) {
            expect(full).toContain(removed[id]);
        }
    });

    it.each(EXTRACTION_PROMPT_LINE_IDS)("leaves out %s and nothing else", id => {
        const ablated = buildComponentPrompt(hero, variables, [], new Set([id]));
        expect(ablated).not.toContain(removed[id]);
        for (const other of EXTRACTION_PROMPT_LINE_IDS.filter(o => o !== id)) {
            expect(ablated).toContain(removed[other]);
        }
        // Only the lines carrying the prohibition differ.
        const fullLines = full.split("\n");
        const ablatedLines = ablated.split("\n");
        const changed = fullLines.filter(line => !ablatedLines.includes(line));
        expect(changed.length).toBeGreaterThan(0);
        expect(changed.length).toBeLessThanOrEqual(2);
    });

    it("no longer carries the three lines measured dead", () => {
        expect(full).not.toContain("Do not substitute a default heading size");
        expect(full).not.toContain("Do not centre text this section does not centre");
        expect(full).not.toContain("do not write a hex value");
        expect(full).toContain("Do not substitute a different theme colour for one listed here.");
    });
});
