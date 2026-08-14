import { describe, expect, it } from "vitest";
import { detectSections, type SegmentOptions } from "./boundaries.js";
import type { Box, CapturedNode } from "~/domain/artifacts.js";

const OPTIONS: SegmentOptions = {
    minHeight: 120,
    minWidthRatio: 0.5,
    viewportWidth: 1440,
    maxSectionHeight: 1600,
    minChildrenToSplit: 2
};

// A full-width block at (0, y) of the given height, with optional children.
const block = (y: number, height: number, children: CapturedNode[] = []): CapturedNode => ({
    tag: "div",
    box: { x: 0, y, width: 1440, height },
    styles: {},
    children
});

const boxes = (sections: { box: Box }[]): Box[] => sections.map(s => s.box);

describe("detectSections", () => {
    it("splits a page-wrapping container into its real sections instead of one giant block", () => {
        // The reported failure: content root is [hero, wrapper], where wrapper holds all the real
        // sections. The one-level detector took wrapper whole (one 90% section + the hero); the wrapper
        // must instead be descended into its three stacked children.
        const hero = block(0, 800);
        const wrapper = block(800, 2100, [block(800, 700), block(1500, 700), block(2200, 700)]);
        const root = block(0, 2900, [hero, wrapper]);

        const sections = detectSections(root, OPTIONS);

        expect(sections).toHaveLength(4);
        expect(boxes(sections).map(b => b.y)).toEqual([0, 800, 1500, 2200]);
        expect(sections.map(s => s.index)).toEqual([0, 1, 2, 3]);
    });

    it("keeps a short page's sections whole — does not collapse the page into one block", () => {
        // Both children are under maxSectionHeight, so neither is a container even though the page has
        // several: a short page must still yield its top-level sections.
        const root = block(0, 1500, [block(0, 800), block(800, 700)]);

        const sections = detectSections(root, OPTIONS);

        expect(boxes(sections).map(b => b.y)).toEqual([0, 800]);
    });

    it("does not split a tall hero whose background and content layers overlap", () => {
        // A tall (> maxSectionHeight) hero with two full-width children that sit on top of each other,
        // not stacked. Overlapping layers are not a container, so the hero stays one section.
        const hero = block(0, 1800, [block(0, 1800), block(0, 1800)]);
        const footer = block(1800, 400);
        const root = block(0, 2200, [hero, footer]);

        const sections = detectSections(root, OPTIONS);

        expect(boxes(sections).map(b => b.y)).toEqual([0, 1800]);
    });

    it("ignores children too short or too narrow to be sections", () => {
        const nav = block(0, 60); // too short
        const sidebar: CapturedNode = {
            tag: "aside",
            box: { x: 0, y: 60, width: 400, height: 600 }, // too narrow
            styles: {},
            children: []
        };
        const content = block(60, 700);
        const root = block(0, 760, [nav, sidebar, content]);

        const sections = detectSections(root, OPTIONS);

        expect(boxes(sections).map(b => b.y)).toEqual([60]);
        expect(sections[0].box.height).toBe(700);
    });

    it("descends past a single full-width wrapper to reach the sections", () => {
        // content root -> main (single full-width child) -> [section, section, section].
        const inner = block(800, 2100, [block(800, 700), block(1500, 700), block(2200, 700)]);
        const main = block(800, 2100, [inner]); // single full-width, full-height wrapper
        const hero = block(0, 800);
        const root = block(0, 2900, [hero, main]);

        const sections = detectSections(root, OPTIONS);

        expect(boxes(sections).map(b => b.y)).toEqual([0, 800, 1500, 2200]);
    });

    it("keeps a full-width section whole when its only child is a centred, max-width column", () => {
        // A section wrapping a centred container: the inner column is not full-width, so we keep the
        // section's own full-width box rather than collapsing to the narrow column.
        const column: CapturedNode = {
            tag: "div",
            box: { x: 220, y: 800, width: 1000, height: 760 }, // centred, < minWidthRatio * viewport
            styles: {},
            children: []
        };
        const section = block(800, 800, [column]);
        const hero = block(0, 800);
        const root = block(0, 1600, [hero, section]);

        const sections = detectSections(root, OPTIONS);

        expect(boxes(sections)).toEqual([
            { x: 0, y: 0, width: 1440, height: 800 },
            { x: 0, y: 800, width: 1440, height: 800 }
        ]);
    });
});
