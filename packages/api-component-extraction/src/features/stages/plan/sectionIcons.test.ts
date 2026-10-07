import { describe, expect, it } from "vitest";
import type { CapturedNode } from "~/domain/artifacts.js";
import { sectionIcons } from "./sectionIcons.js";

const node = (box: CapturedNode["box"], extra: Partial<CapturedNode> = {}): CapturedNode => ({
    tag: "span",
    box,
    styles: {},
    children: [],
    ...extra
});

// 2424 Tulane's footer social row: a glyph inside each link, the same row repeated in a fixed bar.
const footer = node(
    { x: 0, y: 5000, width: 1440, height: 300 },
    {
        tag: "footer",
        children: [
            node(
                { x: 600, y: 5068, width: 40, height: 40 },
                {
                    tag: "a",
                    href: "https://www.facebook.com/2424tulane",
                    children: [
                        node(
                            { x: 605, y: 5073, width: 30, height: 30 },
                            {
                                icon: { glyph: "f09a", label: "Visit Facebook page" }
                            }
                        )
                    ]
                }
            ),
            node(
                { x: 650, y: 5068, width: 40, height: 40 },
                {
                    tag: "a",
                    href: "https://www.instagram.com/2424tulane",
                    children: [
                        node(
                            { x: 655, y: 5073, width: 30, height: 30 },
                            {
                                icon: { glyph: "f16d", label: "Visit Instagram page" }
                            }
                        )
                    ]
                }
            ),
            node(
                { x: 0, y: 800, width: 60, height: 200 },
                {
                    styles: { position: "fixed" },
                    children: [
                        node(
                            { x: 5, y: 805, width: 30, height: 30 },
                            { icon: { glyph: "f0e7", label: "bolt" } }
                        )
                    ]
                }
            )
        ]
    }
);

describe("sectionIcons", () => {
    it("names each icon with the link it sits in, leaving out fixed chrome", () => {
        expect(sectionIcons(footer)).toEqual([
            { label: "Visit Facebook page", href: "https://www.facebook.com/2424tulane" },
            { label: "Visit Instagram page", href: "https://www.instagram.com/2424tulane" }
        ]);
    });
});
