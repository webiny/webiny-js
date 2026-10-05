import { describe, expect, it } from "vitest";
import type { CapturedNode } from "~/domain/artifacts.js";
import { sectionBackgroundImages } from "./sectionBackgroundImages.js";

const node = (
    box: { x: number; y: number; width: number; height: number },
    background?: CapturedNode["background"],
    children: CapturedNode[] = []
): CapturedNode => ({ tag: "div", box, styles: {}, children, ...(background ? { background } : {}) });

const SECTION = { x: 0, y: 0, width: 1440, height: 484 };

describe("sectionBackgroundImages", () => {
    it("reads the section's own background image with how it covers its box", () => {
        const section = node(SECTION, {
            url: "https://example.com/hero.jpg",
            size: "cover",
            position: "50% 50%",
            repeat: "no-repeat"
        });

        expect(sectionBackgroundImages(section)).toEqual([
            {
                url: "https://example.com/hero.jpg",
                size: "cover",
                position: "50% 50%",
                repeat: "no-repeat",
                area: 696960
            }
        ]);
    });

    it("ignores a decorative tile too small to be the section's backdrop", () => {
        // A background-image is also how a page draws a chevron or a texture swatch.
        const section = node(SECTION, undefined, [
            node({ x: 0, y: 0, width: 24, height: 24 }, { url: "https://example.com/chevron.svg" })
        ]);

        expect(sectionBackgroundImages(section)).toEqual([]);
    });

    it("orders by painted area, so the backdrop outranks a panel", () => {
        const section = node(SECTION, { url: "https://example.com/backdrop.jpg" }, [
            node({ x: 0, y: 0, width: 720, height: 300 }, { url: "https://example.com/panel.jpg" })
        ]);

        expect(sectionBackgroundImages(section).map(i => i.url)).toEqual([
            "https://example.com/backdrop.jpg",
            "https://example.com/panel.jpg"
        ]);
    });

    it("sums the area of one image used in several places", () => {
        const section = node(SECTION, undefined, [
            node({ x: 0, y: 0, width: 720, height: 484 }, { url: "https://example.com/tile.jpg" }),
            node({ x: 720, y: 0, width: 720, height: 484 }, { url: "https://example.com/tile.jpg" })
        ]);

        const images = sectionBackgroundImages(section);
        expect(images).toHaveLength(1);
        expect(images[0].area).toBe(696960);
    });

    it("returns nothing for a section that paints no background image", () => {
        expect(sectionBackgroundImages(node(SECTION))).toEqual([]);
    });
});
