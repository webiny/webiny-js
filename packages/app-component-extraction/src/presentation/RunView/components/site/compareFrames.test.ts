import { describe, expect, it } from "vitest";
import { CAPTURE_WIDTH, UNKNOWN_HEIGHT, compareFrames } from "./compareFrames.js";

describe("the page comparison's frames", () => {
    it("renders each page at the capture width, as tall as the source page, scaled into two columns", () => {
        // A 1440 x 5212 capture compared in a 1376px-wide area with a 16px gap.
        const frames = compareFrames(1376, 16, { width: 1440, height: 5212 });
        expect(frames.frameWidth).toBe(CAPTURE_WIDTH);
        expect(frames.frameHeight).toBe(5212);
        expect(frames.columnWidth).toBe(680);
        expect(frames.scale).toBeCloseTo(680 / 1440);
        expect(frames.columnHeight).toBe(Math.round(5212 * (680 / 1440)));
    });

    it("reads a resized capture at the capture width", () => {
        expect(compareFrames(1376, 16, { width: 720, height: 2606 }).frameHeight).toBe(5212);
    });

    it("falls back to a fixed height when the source page's height is not known", () => {
        expect(compareFrames(1376, 16, null).frameHeight).toBe(UNKNOWN_HEIGHT);
    });
});
