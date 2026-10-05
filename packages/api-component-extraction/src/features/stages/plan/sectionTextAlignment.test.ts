import { describe, expect, it } from "vitest";
import type { CapturedNode } from "~/domain/artifacts.js";
import { sectionTextAlignment } from "./sectionTextAlignment.js";

const node = (
    styles: Record<string, string>,
    extra: Partial<CapturedNode> = {},
    children: CapturedNode[] = []
): CapturedNode => ({
    tag: "div",
    box: { x: 0, y: 0, width: 100, height: 100 },
    styles,
    children,
    ...extra
});

describe("sectionTextAlignment", () => {
    it("reads the alignment of each text-bearing element", () => {
        const section = node({}, {}, [
            node({ textAlign: "right" }, { text: "Contact" }),
            node({ textAlign: "left" }, { text: "1070 Main St" })
        ]);

        expect(sectionTextAlignment(section).map(a => a.align).sort()).toEqual(["left", "right"]);
    });

    it("normalises the logical values the capture records", () => {
        const section = node({}, {}, [
            node({ textAlign: "start" }, { text: "Left" }),
            node({ textAlign: "end" }, { text: "Right" })
        ]);

        expect(sectionTextAlignment(section).map(a => a.align).sort()).toEqual(["left", "right"]);
    });

    it("orders by area, so the dominant alignment covers the most text", () => {
        // A footer's six right-aligned links outnumber one left-aligned address block, and the
        // address block is still the larger share of the footer.
        const section = node({}, {}, [
            node(
                { textAlign: "left" },
                { text: "1070 Main Street, Bridgeport", box: { x: 0, y: 0, width: 600, height: 80 } }
            ),
            ...Array.from({ length: 6 }, (_, i) =>
                node(
                    { textAlign: "right" },
                    { text: `Link ${i}`, box: { x: 0, y: 0, width: 60, height: 20 } }
                )
            )
        ]);

        const alignments = sectionTextAlignment(section);
        expect(alignments[0]).toMatchObject({ align: "left", elements: 1 });
        expect(alignments[1]).toMatchObject({ align: "right", elements: 6 });
    });

    it("counts only elements with their own text", () => {
        // Every node inherits `text-align`; counting wrappers would make a section's outermost
        // container the loudest voice about alignment while saying nothing about the text.
        const section = node({ textAlign: "center" }, {}, [
            node({ textAlign: "center" }, {}, [node({ textAlign: "left" }, { text: "Body" })])
        ]);

        expect(sectionTextAlignment(section)).toEqual([
            { align: "left", elements: 1, areaShare: 1 }
        ]);
    });

    it("ignores a node with no alignment rather than assuming one", () => {
        const section = node({}, { text: "No alignment recorded" });
        expect(sectionTextAlignment(section)).toEqual([]);
    });

    it("reports area shares that sum to one", () => {
        const section = node({}, {}, [
            node({ textAlign: "left" }, { text: "a", box: { x: 0, y: 0, width: 100, height: 100 } }),
            node({ textAlign: "center" }, { text: "b", box: { x: 0, y: 0, width: 100, height: 300 } })
        ]);

        const alignments = sectionTextAlignment(section);
        expect(alignments.map(a => a.areaShare)).toEqual([0.75, 0.25]);
    });
});
