import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildComponentPrompt } from "./componentGeneration.js";
import { PROHIBITION_FIXTURES } from "./__fixtures__/prohibitionFixtures.js";

// The prompts as built before the three prohibitions got ids
// (scripts/baseline/reports/2026-10-08/prohibitions-design.md).
const before = JSON.parse(
    readFileSync(new URL("./__fixtures__/prohibition-prompts.before.json", import.meta.url), "utf8")
) as Record<string, string>;

// Each id's line, exactly as the prompt has it, with the blank line before it.
const BLOCKS: Record<string, string[]> = {
    "extraction.no-other-text": [
        "\n\nShow no other text. Do not add a heading, a button, a caption or a sentence the section does\nnot have — not even a plausible one. Where the crop shows only an image or a logo, the\ncomponent shows only that."
    ],
    "extraction.no-invented-urls": [
        "\n\nDo NOT invent image URLs. No stock photography, no placeholder services, no URL that is\nnot in the list above — a component that ships one puts it in the customer's library."
    ],
    "extraction.urls-exactly": [
        "\n\nUse these URLs exactly as given. Do not substitute a stock photograph, and do not replace the\nimage with a flat background colour.",
        "\n\nUse the URL exactly as given, and keep both the colour and the image over it."
    ]
};

describe("the content prohibitions' ids", () => {
    it("leave the default prompt byte-identical", () => {
        for (const [name, component] of Object.entries(PROHIBITION_FIXTURES)) {
            expect(buildComponentPrompt(component, new Map())).toBe(before[name]);
        }
    });

    it("each remove exactly their own line, where it is shown, and nothing else", () => {
        let shown = 0;
        for (const [id, blocks] of Object.entries(BLOCKS)) {
            for (const [name, component] of Object.entries(PROHIBITION_FIXTURES)) {
                const expected = blocks.reduce(
                    (prompt, block) => prompt.replace(block, ""),
                    before[name]
                );
                shown += expected === before[name] ? 0 : 1;
                expect(buildComponentPrompt(component, new Map(), [], new Set([id]))).toBe(
                    expected
                );
            }
        }
        // no-other-text on all four fixtures, no-invented-urls on the logo, urls-exactly on two.
        expect(shown).toBe(7);
    });
});
