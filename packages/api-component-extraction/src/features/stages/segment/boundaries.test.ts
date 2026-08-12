import { describe, expect, it } from "vitest";
import { detectSections } from "./boundaries.js";
import type { Box, CapturedNode } from "~/domain/artifacts.js";

const node = (tag: string, box: Box, children: CapturedNode[] = []): CapturedNode => ({
    tag,
    box,
    styles: {},
    children
});

const options = { minHeight: 200, minWidthRatio: 0.5, viewportWidth: 1440 };

describe("detectSections", () => {
    it("returns tall, wide direct children as sections and drops small ones", () => {
        const body = node("body", { x: 0, y: 0, width: 1440, height: 3000 }, [
            node("header", { x: 0, y: 0, width: 1440, height: 80 }), // too short
            node("section", { x: 0, y: 80, width: 1440, height: 900 }), // hero
            node("section", { x: 0, y: 980, width: 1440, height: 1200 }), // features
            node("a", { x: 0, y: 2180, width: 200, height: 40 }) // too small
        ]);
        const sections = detectSections(body, options);
        expect(sections.map(section => section.index)).toEqual([1, 2]);
    });

    it("descends through a single dominant wrapper to the real content root", () => {
        const inner = node("main", { x: 0, y: 0, width: 1440, height: 2000 }, [
            node("section", { x: 0, y: 0, width: 1440, height: 1000 }),
            node("section", { x: 0, y: 1000, width: 1440, height: 1000 })
        ]);
        const body = node("body", { x: 0, y: 0, width: 1440, height: 2000 }, [
            node("div", { x: 0, y: 0, width: 1440, height: 2000 }, [inner])
        ]);
        expect(detectSections(body, options)).toHaveLength(2);
    });
});
