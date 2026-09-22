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

describe("detectSections — semantic landmarks", () => {
    // A landmark at (48,48) of 1344x66 is webiny.com's real header: five nav links, and well under
    // the 120px floor. Before landmarks were exempt it was dropped, so no migrated page had a nav.
    const landmark = (tag: string, y: number, height: number): CapturedNode => ({
        tag,
        box: { x: 48, y, width: 1344, height },
        styles: {},
        children: []
    });

    it("keeps a short header that the height floor would have discarded", () => {
        const root = block(0, 1400, [landmark("header", 48, 66), block(113, 632)]);

        const detected = detectSections(root, OPTIONS);

        expect(boxes(detected)).toEqual([
            { x: 48, y: 48, width: 1344, height: 66 },
            { x: 0, y: 113, width: 1440, height: 632 }
        ]);
    });

    it("keeps a short footer and a standalone nav rail", () => {
        const root = block(0, 1400, [
            landmark("nav", 0, 48),
            block(48, 900),
            landmark("footer", 948, 90)
        ]);

        expect(detectSections(root, OPTIONS)).toHaveLength(3);
    });

    it("still discards a landmark that is too narrow to be page furniture", () => {
        // An in-page table of contents: semantic, but a sidebar rather than a section.
        const narrow: CapturedNode = {
            tag: "nav",
            box: { x: 0, y: 48, width: 240, height: 60 },
            styles: {},
            children: []
        };
        const root = block(0, 1000, [narrow, block(48, 900)]);

        const detected = detectSections(root, OPTIONS);

        expect(detected).toHaveLength(1);
        expect(detected[0]?.box.width).toBe(1440);
    });

    it("still discards thin non-semantic noise", () => {
        const root = block(0, 1000, [block(0, 8), block(8, 900)]);

        expect(detectSections(root, OPTIONS)).toHaveLength(1);
    });
});

/*
 * The boundaries a section was kept whole across. These are what makes a split correction a choice
 * between candidates the segmenter already computed rather than a drawing exercise — so what matters
 * is that each one is retained with the reason it lost, not merely that some boxes came back.
 *
 * Each fixture gives the root a second child on purpose: with one dominant child, `findContentRoot`
 * descends past the wrapper and the section under test is never the node that gets examined.
 */
describe("detectSections — the boundaries it declined to take", () => {
    it("retains the section-shaped children of a section it kept whole", () => {
        // Two stacked blocks inside a parent below the container height: the under-split shape.
        const parent = block(0, 800, [block(0, 400), block(400, 400)]);
        const root = block(0, 1200, [parent, block(800, 400)]);

        const [section] = detectSections(root, OPTIONS);

        expect(section.candidates).toHaveLength(2);
        expect(section.candidates.map(c => c.rejection)).toEqual([
            "parent-below-max-height",
            "parent-below-max-height"
        ]);
        expect(section.candidates.map(c => c.index)).toEqual([0, 1]);
    });

    /*
     * A boundary on the parent's own top edge divides nothing off, so the first child is retained with
     * its reason but never offered. Offering it would produce an empty section and a no-op correction.
     */
    it("offers only the boundaries that would actually divide the section", () => {
        const parent = block(0, 800, [block(0, 400), block(400, 400)]);
        const root = block(0, 1200, [parent, block(800, 400)]);

        const [section] = detectSections(root, OPTIONS);

        expect(section.candidates.map(c => c.offerable)).toEqual([false, true]);
        expect(section.candidates[1].box.y).toBe(400);
    });

    /*
     * Found on a real run rather than in a fixture: a boundary 24px into a 713px section was offered,
     * which would have shaved a sliver off the top instead of dividing the section. Both halves have to
     * clear the height floor that decides whether anything is a section.
     */
    it("does not offer a boundary that would shave a sliver off either end", () => {
        // The child is section-shaped, but it starts 24px in — the part above it is not a section.
        // Kept under 90% of the parent's height so findContentRoot does not descend past the parent.
        const parent = block(0, 800, [block(24, 600)]);
        const root = block(0, 1200, [parent, block(800, 400)]);

        const [section] = detectSections(root, OPTIONS);

        expect(section.candidates[0].offerable).toBe(false);
        expect(section.candidates[0].rejection).toBe("too-few-siblings");
    });

    it("offers a boundary once both halves clear the height floor", () => {
        const parent = block(0, 800, [block(160, 640)]);
        const root = block(0, 1200, [parent, block(800, 400)]);

        const [section] = detectSections(root, OPTIONS);

        expect(section.candidates[0].offerable).toBe(true);
    });

    it("says when a child was not section-shaped, rather than blaming the parent", () => {
        const narrow: CapturedNode = {
            tag: "div",
            box: { x: 0, y: 400, width: 200, height: 300 },
            styles: {},
            children: []
        };
        const parent = block(0, 800, [block(0, 390), block(390, 8), narrow, block(500, 300)]);
        const root = block(0, 1200, [parent, block(800, 400)]);

        const [section] = detectSections(root, OPTIONS);

        expect(section.candidates.map(c => c.rejection)).toEqual([
            "parent-below-max-height",
            "too-short",
            "too-narrow",
            "parent-below-max-height"
        ]);
        // Only the last one both looks like a section and would divide anything off.
        expect(section.candidates.filter(c => c.offerable).map(c => c.index)).toEqual([3]);
    });

    it("distinguishes a parent kept whole because its children overlap", () => {
        // A hero: a background layer and the text laid over it. Correctly not split, and it says so.
        const parent = block(0, 1800, [block(0, 1800), block(100, 900)]);
        const root = block(0, 2400, [parent, block(1800, 600)]);

        const [section] = detectSections(root, OPTIONS);

        expect(section.candidates.map(c => c.rejection)).toEqual([
            "children-overlap",
            "children-overlap"
        ]);
    });

    it("says when there was only one section-shaped child to split at", () => {
        const parent = block(0, 800, [block(0, 8), block(8, 700)]);
        const root = block(0, 1200, [parent, block(800, 400)]);

        const [section] = detectSections(root, OPTIONS);

        expect(section.candidates.map(c => c.rejection)).toEqual(["too-short", "too-few-siblings"]);
    });

    it("leaves no candidates on a section that was split, since it was not kept whole", () => {
        const wrapper = block(0, 2100, [block(0, 700), block(700, 700), block(1400, 700)]);
        const root = block(0, 2100, [wrapper]);

        const sections = detectSections(root, OPTIONS);

        expect(sections).toHaveLength(3);
        // Each leaf is childless, so there was nothing inside it to decline.
        expect(sections.every(s => s.candidates.length === 0)).toBe(true);
    });
});
