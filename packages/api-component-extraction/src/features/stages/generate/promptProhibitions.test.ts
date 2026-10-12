import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildComponentPrompt } from "./componentGeneration.js";
import { PROHIBITION_FIXTURES } from "./__fixtures__/prohibitionFixtures.js";

// The prompts as built before the three prohibitions got ids
// (scripts/baseline/reports/2026-10-08/prohibitions-design.md).
const before = JSON.parse(
    readFileSync(new URL("./__fixtures__/prohibition-prompts.before.json", import.meta.url), "utf8")
) as Record<string, string>;

// "Use these URLs exactly as given", both wordings: measured dead and cut (prohibitions-result.md).
const CUT = [
    "\n\nUse these URLs exactly as given. Do not substitute a stock photograph, and do not replace the\nimage with a flat background colour.",
    "\n\nUse the URL exactly as given, and keep both the colour and the image over it."
];
// "Do NOT invent image URLs", replaced by the link wording (link-wording-result.md).
const REPLACED =
    "\n\nDo NOT invent image URLs. No stock photography, no placeholder services, no URL that is\nnot in the list above — a component that ships one puts it in the customer's library.";
const EMPTY_DESTINATION =
    "\n\nA link this section shows with no destination in the list above keeps an empty destination\n(`\"\"`). Do not write one for it: not the site's home page, not a social network's home page.";

// "The largest is the section's heading at N px", now said only where the source marks that text up
// as a heading (item4-data-replay.md). These fixtures carry no source headings, so it is gone.
const UNVERIFIED_HEADING = /\n\nThe largest is the section's heading at [\d.]+px\./;

const current = (name: string) =>
    CUT.reduce((prompt, block) => prompt.replace(block, ""), before[name])
        .replace(REPLACED, EMPTY_DESTINATION)
        .replace(UNVERIFIED_HEADING, "");

// Each id's line, exactly as the prompt has it, with the blank line before it.
const BLOCKS: Record<string, string> = {
    "extraction.no-other-text":
        "\n\nShow no other text. Do not add a heading, a button, a caption or a sentence the section does\nnot have — not even a plausible one. Where the crop shows only an image or a logo, the\ncomponent shows only that.",
    "extraction.empty-destination": EMPTY_DESTINATION
};

describe("the content prohibitions", () => {
    it("are the earlier prompt, less the line measured dead, with the link wording", () => {
        let changed = 0;
        for (const [name, component] of Object.entries(PROHIBITION_FIXTURES)) {
            const prompt = buildComponentPrompt(component, new Map());
            changed += prompt === before[name] ? 0 : 1;
            expect(prompt).toBe(current(name));
            expect(prompt).not.toContain("Use these URLs exactly as given");
            expect(prompt).not.toContain("Do NOT invent image URLs");
        }
        // All four: none carries a source heading, so each loses the unverified heading line; the
        // photograph, the see-through pattern and the logo also changed before that.
        expect(changed).toBe(4);
    });

    it("each id removes exactly its own line, where it is shown, and nothing else", () => {
        let shown = 0;
        for (const [id, block] of Object.entries(BLOCKS)) {
            for (const [name, component] of Object.entries(PROHIBITION_FIXTURES)) {
                const expected = current(name).replace(block, "");
                shown += expected === current(name) ? 0 : 1;
                expect(buildComponentPrompt(component, new Map(), [], new Set([id]))).toBe(
                    expected
                );
            }
        }
        // no-other-text on all four fixtures, empty-destination on the logo.
        expect(shown).toBe(5);
    });
});
