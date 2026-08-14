import { describe, expect, it } from "vitest";
import { findNodeByBox } from "./sectionNode.js";
import type { Box, CapturedNode } from "~/domain/artifacts.js";

const node = (box: Box, children: CapturedNode[] = []): CapturedNode => ({
    tag: "div",
    box,
    styles: {},
    children
});

describe("findNodeByBox", () => {
    it("finds a section nested well below the content root (not a direct child)", () => {
        // The regression: Segment splits a page-wrapping container, so sections sit under it — indexing
        // contentRoot.children[i] missed them. Matching by box reaches the nested node.
        const target = node({ x: 0, y: 1500, width: 1440, height: 700 });
        const wrapper = node({ x: 0, y: 800, width: 1440, height: 2100 }, [
            node({ x: 0, y: 800, width: 1440, height: 700 }),
            target,
            node({ x: 0, y: 2200, width: 1440, height: 700 })
        ]);
        const root = node({ x: 0, y: 0, width: 1440, height: 2900 }, [
            node({ x: 0, y: 0, width: 1440, height: 800 }),
            wrapper
        ]);

        expect(findNodeByBox(root, target.box)).toBe(target);
    });

    it("returns the outer node when a single-child wrapper shares its box", () => {
        const inner = node({ x: 0, y: 0, width: 1440, height: 900 });
        const outer = node({ x: 0, y: 0, width: 1440, height: 900 }, [inner]);
        const root = node({ x: 0, y: 0, width: 1440, height: 900 }, [outer]);
        // Parent checked before children, so the outer (what Segment emits for a single-child wrapper) wins.
        expect(findNodeByBox(root, { x: 0, y: 0, width: 1440, height: 900 })).toBe(root);
    });

    it("returns null when no node matches", () => {
        const root = node({ x: 0, y: 0, width: 1440, height: 900 }, [
            node({ x: 0, y: 0, width: 720, height: 400 })
        ]);
        expect(findNodeByBox(root, { x: 10, y: 20, width: 30, height: 40 })).toBeNull();
    });
});
