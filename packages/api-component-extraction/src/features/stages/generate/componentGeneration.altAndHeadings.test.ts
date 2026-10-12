import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { CapturedNode, PlannedComponent } from "~/domain/artifacts.js";
import { buildComponentPrompt, QUALITY_PROMPT_LINE_IDS } from "./componentGeneration.js";
import { sectionHeadings } from "./sectionHeadings.js";

const fixture = <T>(name: string): T =>
    JSON.parse(readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), "utf8")) as T;

/* 71 Westland rehearsal's Property Listings Gallery as stored: four cards, each an image and a link. */
const gallery = fixture<{ component: PlannedComponent }>(
    "westland-listings-gallery.plan.json"
).component;
const galleryAlts = [
    "Brick building with rounded corners at 71 Westland Apartments in Boston, Massachusetts",
    "Decorative building facade with multiple windows at 71 Westland Apartments in Boston, Massachusetts",
    "Red brick building with green awning at 71 Westland Apartments in Boston, Massachusetts",
    "Exterior view of the apartment with surrounded by trees at 71 Westland Apartments in Boston, Massachusetts"
];

/* Real sections from Take 3's and 71 Westland's home pages. */
const sections = fixture<{ sections: Record<string, CapturedNode> }>(
    "heading-sections.json"
).sections;

describe("alt text in the prompt", () => {
    const lines = buildComponentPrompt(gallery, new Map()).split("\n");

    it("carries each list item's image alt beside its image", () => {
        const items = lines.filter(line => line.includes("items[]: {"));
        expect(items).toHaveLength(4);
        for (const alt of galleryAlts) {
            expect(items.some(line => line.includes(`(alt: "${alt}")`))).toBe(true);
        }
    });

    it("carries each picture's alt in the lines that size the section's pictures", () => {
        const facts = lines.filter(line => line.includes("% of the section)"));
        expect(facts).toHaveLength(4);
        for (const alt of galleryAlts) {
            expect(facts.some(line => line.includes(`(alt: "${alt}")`))).toBe(true);
        }
    });
});

describe("the source's headings in the prompt", () => {
    const withHeadings = (section: string) =>
        buildComponentPrompt(
            { ...gallery, headings: sectionHeadings(sections[section]!) },
            new Map()
        );

    it("lists each heading with the level the source marks it up at", () => {
        const prompt = withHeadings("take3-h2");
        expect(prompt).toContain(
            [
                "The section's headings, as the source page marks them up, in page order:",
                '- h2 "Floor Plans"',
                '- h2 "Amenities"',
                '- h2 "Neighborhood"'
            ].join("\n")
        );
    });

    it("names an eyebrow inside a heading without claiming its order", () => {
        expect(withHeadings("take3-h1")).toContain(
            '- h1 "Park City Place", with "A Refreshing Community:" inside it'
        );
    });

    it("says nothing about headings for a section the source marks up with none", () => {
        expect(withHeadings("westland-none")).not.toContain("The section's headings");
    });
});

/*
 * Real planned components with the headings read from their sections: Take 3's Property Description
 * (largest text is its h2), 71 Westland's Hero Banner (largest text is the display word "Awaits", its
 * h1 is smaller), a 2424 Tulane stats block (largest text is "80"), Take 3's navigation (no heading).
 */
const headingLine = fixture<{
    components: Record<string, { component: PlannedComponent; headings: PlannedComponent["headings"] }>;
}>("heading-line-components.json").components;
const promptFor = (key: string) => {
    const { component, headings } = headingLine[key]!;
    return buildComponentPrompt({ ...component, headings }, new Map());
};

describe("the largest-text line", () => {
    it("names the largest text the heading where the source marks it up as one", () => {
        expect(promptFor("verified")).toContain("The largest is the section's heading at 52px.");
    });

    it("does not call a display word or a statistic the heading", () => {
        expect(promptFor("heading")).not.toContain("The largest is the section's heading");
        expect(promptFor("stats")).not.toContain("The largest is the section's heading");
    });

    it("does not name a heading in a section the source marks up with none", () => {
        expect(promptFor("none")).not.toContain("The largest is the section's heading");
    });
});

describe("the quality instructions", () => {
    const all = new Set<string>(QUALITY_PROMPT_LINE_IDS);
    const quality = (key: string, include: Set<string>) => {
        const { component, headings } = headingLine[key]!;
        return buildComponentPrompt({ ...component, headings }, new Map(), [], new Set(), include);
    };

    it("are not in the prompt unless a run includes them", () => {
        for (const key of Object.keys(headingLine)) {
            const prompt = quality(key, new Set());
            expect(prompt).not.toContain("headingLevel");
            expect(prompt).not.toContain(":focus-visible");
            expect(prompt).not.toContain("takes its alt text from an input");
        }
    });

    it("default the heading input to the level this section's source gives its main heading", () => {
        // Take 3's Property Description: its source heading is the h1 "Park City Place"; the 2424
        // Tulane stats block's is the h2 "Every Day".
        expect(quality("verified", all)).toContain('`const Heading = inputs.headingLevel || "h1"`');
        expect(quality("stats", all)).toContain('`const Heading = inputs.headingLevel || "h2"`');
    });

    it("say there is no heading where the source marks up none", () => {
        const prompt = quality("none", all);
        expect(prompt).toContain("The source marks up no heading in this section");
        expect(prompt).not.toContain("headingLevel");
    });
});
