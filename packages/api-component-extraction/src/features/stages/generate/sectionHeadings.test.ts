import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { CapturedNode } from "~/domain/artifacts.js";
import { sectionHeadings } from "./sectionHeadings.js";

/* Real sections, cut from Take 3's and 71 Westland's home-page trees at Segment's section boxes. */
const sections = (
    JSON.parse(
        readFileSync(new URL("./__fixtures__/heading-sections.json", import.meta.url), "utf8")
    ) as { sections: Record<string, CapturedNode> }
).sections;

describe("sectionHeadings", () => {
    it("reads the level from the source's tag", () => {
        expect(sectionHeadings(sections["westland-h1"]!)).toEqual([
            { level: 1, text: "A Refreshing Community: 71 Westland Apartments", inner: [] }
        ]);
        expect(sectionHeadings(sections["westland-h2"]!)).toEqual([
            { level: 2, text: "Explore Fenway Forward", inner: [] }
        ]);
    });

    it("keeps an eyebrow inside the heading apart from its own text", () => {
        // Take 3's h1 holds "Park City Place" and a <span> "A Refreshing Community:".
        expect(sectionHeadings(sections["take3-h1"]!)).toEqual([
            { level: 1, text: "Park City Place", inner: ["A Refreshing Community:"] }
        ]);
    });

    it("lists several headings in document order", () => {
        expect(sectionHeadings(sections["take3-h2"]!).map(h => [h.level, h.text])).toEqual([
            [2, "Floor Plans"],
            [2, "Amenities"],
            [2, "Neighborhood"]
        ]);
    });

    it("finds none in a section the source marks up with no heading", () => {
        expect(sectionHeadings(sections["take3-none"]!)).toEqual([]);
        expect(sectionHeadings(sections["westland-none"]!)).toEqual([]);
    });
});
