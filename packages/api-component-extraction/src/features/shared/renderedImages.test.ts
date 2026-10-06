import { describe, expect, it } from "vitest";
import type { CapturedNode } from "~/domain/artifacts.js";
import { renderedImageCount, visibleSectionImageCount } from "./renderedImages.js";

const node = (
    box: { x: number; y: number; width: number; height: number },
    extra: Partial<CapturedNode> = {},
    children: CapturedNode[] = []
): CapturedNode => ({ tag: "div", box, styles: {}, children, ...extra }) as CapturedNode;

describe("renderedImageCount", () => {
    it("counts each image once, however it was referenced", () => {
        expect(
            renderedImageCount(
                [
                    "https://cdn.example.com/a/pool.jpg?w=800",
                    "https://cdn.example.com/a/pool.jpg?w=1600",
                    "https://cdn.example.com/a/gym.jpg"
                ],
                []
            )
        ).toBe(2);
    });

    it("does not count an image that failed to load", () => {
        expect(
            renderedImageCount(
                ["https://cdn.example.com/a/pool.jpg", "https://cdn.example.com/a/gym.jpg"],
                ["https://cdn.example.com/a/gym.jpg"]
            )
        ).toBe(1);
    });

    it("does not count an object written where a URL belongs", () => {
        expect(
            renderedImageCount(
                ["https://site.test/[object Object]", "https://site.test/[object%20Object]"],
                []
            )
        ).toBe(0);
    });

    it("does not count inline data images or empty sources", () => {
        expect(renderedImageCount(["data:image/png;base64,AAAA", ""], [])).toBe(0);
    });
});

describe("visibleSectionImageCount", () => {
    const section = { x: 0, y: 0, width: 1440, height: 600 };

    it("counts a carousel's one visible slide, not every slide in the DOM", () => {
        const track = node(section, {}, [
            node({ x: 0, y: 0, width: 1440, height: 600 }, { src: "https://cdn.test/a/1.jpg" }),
            node({ x: 1440, y: 0, width: 1440, height: 600 }, { src: "https://cdn.test/a/2.jpg" }),
            node({ x: 2880, y: 0, width: 1440, height: 600 }, { src: "https://cdn.test/a/3.jpg" })
        ]);
        expect(visibleSectionImageCount(track, section)).toBe(1);
    });

    it("counts a picture's image once, and CSS backgrounds alongside media", () => {
        const tree = node(section, { background: { url: "https://cdn.test/a/bg.jpg" } }, [
            node(
                { x: 0, y: 0, width: 400, height: 300 },
                { src: "https://cdn.test/a/hero.jpg?w=800" }
            ),
            node(
                { x: 0, y: 0, width: 400, height: 300 },
                { src: "https://cdn.test/a/hero.jpg?w=1600" }
            )
        ]);
        expect(visibleSectionImageCount(tree, section)).toBe(2);
    });

    it("ignores images with no area and inline data images", () => {
        const tree = node(section, {}, [
            node({ x: 0, y: 0, width: 0, height: 0 }, { src: "https://cdn.test/a/pixel.gif" }),
            node({ x: 0, y: 0, width: 40, height: 40 }, { src: "data:image/png;base64,AAAA" })
        ]);
        expect(visibleSectionImageCount(tree, section)).toBe(0);
    });
});
