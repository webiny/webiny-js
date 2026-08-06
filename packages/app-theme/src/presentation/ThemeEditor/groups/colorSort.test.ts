import { describe, expect, it } from "vitest";
import { sortByColor } from "./colorSort.js";

const order = (colors: string[]): string[] => sortByColor(colors, color => color);

describe("sortByColor", () => {
    it("puts greys first, ordered light to dark", () => {
        expect(order(["#000000", "#FFFFFF", "#808080"])).toEqual(["#FFFFFF", "#808080", "#000000"]);
    });

    it("orders chromatic colors by hue", () => {
        // red (~0°) → green (~120°) → blue (~240°)
        expect(order(["#3B82F6", "#E74C3C", "#22C55E"])).toEqual(["#E74C3C", "#22C55E", "#3B82F6"]);
    });

    it("groups greys ahead of chromatic colors", () => {
        const result = order(["#E74C3C", "#CCCCCC", "#3B82F6"]);
        expect(result[0]).toBe("#CCCCCC");
    });

    it("treats pale tints and dark slates as neutral, not scattered by hue", () => {
        // #FEF2F2 is a near-white 'red' tint and #1E293B a dark blue slate — both low-chroma, so
        // they group with the greys (light → dark) ahead of the saturated red and blue.
        expect(order(["#E74C3C", "#FEF2F2", "#3B82F6", "#1E293B"])).toEqual([
            "#FEF2F2",
            "#1E293B",
            "#E74C3C",
            "#3B82F6"
        ]);
    });

    it("lines shades of one hue up together, light to dark", () => {
        // Two blues and a red: the blues stay adjacent, lighter blue before darker.
        expect(order(["#1E3A8A", "#E74C3C", "#93C5FD"])).toEqual(["#E74C3C", "#93C5FD", "#1E3A8A"]);
    });

    it("keeps a vivid orange between red and gold, not split by near-black warm colors", () => {
        // #450A0A (dark maroon) is near-black with real chroma; it must not wedge between the vivid
        // orange and gold. It groups with the neutrals, leaving orange (~25°) before gold (~37°).
        expect(order(["#F5A623", "#450A0A", "#F97316", "#E74C3C"])).toEqual([
            "#450A0A",
            "#E74C3C",
            "#F97316",
            "#F5A623"
        ]);
    });

    it("reads rgb() the same as hex", () => {
        expect(order(["rgb(59, 130, 246)", "#E74C3C"])).toEqual(["#E74C3C", "rgb(59, 130, 246)"]);
    });

    it("keeps identical unparseable values adjacent", () => {
        // In a DOM-less test there is no canvas, so named colors are unparseable; they still
        // cluster by their raw string rather than scattering.
        const result = order(["rebeccapurple", "#E74C3C", "rebeccapurple"]);
        expect(result[1]).toBe("rebeccapurple");
        expect(result[2]).toBe("rebeccapurple");
    });
});
