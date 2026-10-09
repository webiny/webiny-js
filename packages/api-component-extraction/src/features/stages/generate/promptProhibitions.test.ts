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
const current = (name: string) =>
    CUT.reduce((prompt, block) => prompt.replace(block, ""), before[name]);

// Each remaining id's line, exactly as the prompt has it, with the blank line before it.
const BLOCKS: Record<string, string> = {
    "extraction.no-other-text":
        "\n\nShow no other text. Do not add a heading, a button, a caption or a sentence the section does\nnot have — not even a plausible one. Where the crop shows only an image or a logo, the\ncomponent shows only that.",
    "extraction.no-invented-urls":
        "\n\nDo NOT invent image URLs. No stock photography, no placeholder services, no URL that is\nnot in the list above — a component that ships one puts it in the customer's library."
};

describe("the content prohibitions", () => {
    it("are the earlier prompt, less the line measured dead", () => {
        let changed = 0;
        for (const [name, component] of Object.entries(PROHIBITION_FIXTURES)) {
            const prompt = buildComponentPrompt(component, new Map());
            changed += prompt === before[name] ? 0 : 1;
            expect(prompt).toBe(current(name));
            expect(prompt).not.toContain("Use these URLs exactly as given");
            expect(prompt).not.toContain("Use the URL exactly as given");
        }
        // The photograph and the see-through pattern.
        expect(changed).toBe(2);
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
        // no-other-text on all four fixtures, no-invented-urls on the logo.
        expect(shown).toBe(5);
    });

    it("adds the candidate link wording only when an experiment includes it", () => {
        const logo = PROHIBITION_FIXTURES.logo;
        const candidate =
            "A link this section shows with no destination in the list above keeps an empty destination";
        expect(buildComponentPrompt(logo, new Map())).not.toContain(candidate);
        const included = buildComponentPrompt(
            logo,
            new Map(),
            [],
            new Set(),
            new Set(["extraction.empty-destination"])
        );
        expect(included).toContain(candidate);
        expect(included).toContain("Do NOT invent image URLs.");
        // Swapped for the current line: the arm that tests the new wording alone.
        const swapped = buildComponentPrompt(
            logo,
            new Map(),
            [],
            new Set(["extraction.no-invented-urls"]),
            new Set(["extraction.empty-destination"])
        );
        expect(swapped).toContain(candidate);
        expect(swapped).not.toContain("Do NOT invent image URLs.");
    });
});
