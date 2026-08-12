import { describe, expect, it } from "vitest";
import {
    buildTokenLookup,
    colorToHex,
    geometryClass,
    sectionShape,
    toTypeTree
} from "./sectionShape.js";
import type { Box, CapturedNode } from "~/domain/artifacts.js";
import type { ThemeManifest } from "@webiny/theme-common";

const node = (
    tag: string,
    box: Box,
    styles: Record<string, string> = {},
    children: CapturedNode[] = []
): CapturedNode => ({ tag, box, styles, children });

const box = (x: number, y: number, width: number, height: number): Box => ({ x, y, width, height });

describe("toTypeTree", () => {
    it("keeps tags and structure but drops styles, geometry and text", () => {
        const tree = toTypeTree(
            node("section", box(0, 0, 1440, 500), { color: "red" }, [
                node("h2", box(0, 0, 100, 40), {}, []),
                node("p", box(0, 40, 100, 40), {}, [])
            ])
        );
        expect(tree).toEqual({
            tag: "section",
            children: [
                { tag: "h2", children: [] },
                { tag: "p", children: [] }
            ]
        });
    });
});

describe("colorToHex", () => {
    it("normalises rgb/rgba to lowercase hex", () => {
        expect(colorToHex("rgb(59, 130, 246)")).toBe("#3b82f6");
        expect(colorToHex("rgba(255, 255, 255, 0.5)")).toBe("#ffffff");
        expect(colorToHex("transparent")).toBeNull();
    });
});

describe("geometryClass", () => {
    it("buckets width and counts columns", () => {
        const full = node("section", box(0, 0, 1440, 500), {}, [
            node("div", box(0, 0, 480, 400)),
            node("div", box(480, 0, 480, 400)),
            node("div", box(960, 0, 480, 400))
        ]);
        expect(geometryClass(full, 1440)).toBe("full-cols3");

        const contained = node("section", box(0, 0, 600, 500), {}, [
            node("div", box(0, 0, 600, 400))
        ]);
        expect(geometryClass(contained, 1440)).toBe("contained-cols1");
    });
});

describe("sectionShape", () => {
    it("resolves colors to token paths via the manifest and ignores unmapped colors", () => {
        const manifest = {
            slots: [
                { path: "color.brand.primary", values: { light: "#3b82f6" } },
                { path: "color.surface.base", values: { light: "#ffffff" } }
            ]
        } as unknown as ThemeManifest;

        const section = node(
            "section",
            box(0, 0, 1440, 500),
            { backgroundColor: "rgb(255,255,255)" },
            [
                node("a", box(0, 0, 120, 40), { color: "rgb(59,130,246)" }),
                node("span", box(0, 40, 120, 40), { color: "rgb(1,2,3)" }) // unmapped
            ]
        );

        const shape = sectionShape(section, 1440, buildTokenLookup(manifest));
        expect(shape.tokens.sort()).toEqual(["color.brand.primary", "color.surface.base"]);
        expect(shape.geometryClass).toBe("full-cols1");
    });
});
