import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { CapturedNode } from "~/domain/artifacts.js";
import { findNodeByBox } from "./sectionNode.js";
import { backdropColour, resolveSectionColours } from "./resolvedColours.js";

// Real page trees, pruned to the header and the ancestors above it.
const fixture = (name: string): CapturedNode =>
    JSON.parse(readFileSync(new URL(`./__fixtures__/${name}.json`, import.meta.url), "utf8"));

describe("backdropColour", () => {
    it("is the ancestor's teal behind Freehill's transparent header", () => {
        const root = fixture("freehill-header-path");
        const header = findNodeByBox(root, { x: 0, y: 43, width: 1440, height: 70 })!;
        expect(resolveSectionColours(header, null).filter(c => c.role === "background")).toEqual(
            []
        );
        const backdrop = backdropColour(root, header);
        expect(backdrop).toBe("#26464b");
        expect(resolveSectionColours(header, null, backdrop)[0]).toMatchObject({
            role: "background",
            hex: "#26464b"
        });
    });

    it("is nothing for 2424 Tulane's header, which floats over the hero photograph", () => {
        const root = fixture("tulane-header-path");
        const header = findNodeByBox(root, { x: 70, y: 0, width: 1300, height: 255 })!;
        expect(backdropColour(root, header)).toBeNull();
    });

    it("is nothing where a picture covers the section from outside it", () => {
        const section: CapturedNode = {
            tag: "div",
            box: { x: 0, y: 6237, width: 1440, height: 531 },
            styles: { backgroundColor: "rgba(0, 0, 0, 0)" },
            children: []
        };
        // thevibe's "Like what you see?" band, over a lawn photo painted by a sibling layer.
        const root: CapturedNode = {
            tag: "body",
            box: { x: 0, y: 0, width: 1440, height: 7654 },
            styles: { backgroundColor: "rgb(0, 0, 0)" },
            children: [
                {
                    tag: "div",
                    box: { x: 0, y: 5672, width: 1440, height: 1096 },
                    styles: {},
                    background: {
                        url: "https://capi.myleasestar.com/v2/dimg/154711800/1900x1200/154711800.jpg"
                    },
                    children: []
                },
                section
            ]
        };
        expect(backdropColour(root, section)).toBeNull();
    });
});
