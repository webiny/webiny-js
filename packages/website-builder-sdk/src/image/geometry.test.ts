import { describe, it, expect } from "vitest";
import { getCropRect, getImageRenderData, getVisibleRect, resolveImageEdit } from "./geometry.js";
import type { WebinyImageEdit, WebinyImageValue } from "./types.js";

const image = (edit?: WebinyImageEdit, width = 1000, height = 1000): WebinyImageValue => ({
    id: "1",
    name: "photo.jpg",
    size: 1234,
    mimeType: "image/jpeg",
    src: "https://cdn.test/photo.jpg",
    width,
    height,
    edit
});

describe("resolveImageEdit", () => {
    it("prefers the override per property, falling back to the asset default", () => {
        const assetDefault: WebinyImageEdit = {
            crop: { top: 0.1, left: 0.1, bottom: 0.1, right: 0.1 },
            hotspot: { x: 0.2, y: 0.2, width: 0.5, height: 0.5 },
            alt: "default alt",
            caption: "default caption"
        };
        const override: WebinyImageEdit = {
            hotspot: { x: 0.8, y: 0.8, width: 0.3, height: 0.3 },
            alt: "override alt"
        };

        const result = resolveImageEdit(override, assetDefault);

        // crop + caption inherited, hotspot + alt overridden.
        expect(result.crop).toEqual(assetDefault.crop);
        expect(result.caption).toBe("default caption");
        expect(result.hotspot).toEqual(override.hotspot);
        expect(result.alt).toBe("override alt");
    });

    it("handles null/undefined inputs", () => {
        expect(resolveImageEdit(null, null)).toEqual({
            crop: undefined,
            hotspot: undefined,
            alt: undefined,
            caption: undefined
        });
    });
});

describe("getCropRect", () => {
    it("returns the full image when no crop is set", () => {
        expect(getCropRect()).toEqual({ x: 0, y: 0, width: 1, height: 1 });
    });

    it("converts edge insets into a rectangle", () => {
        const rect = getCropRect({ top: 0.1, left: 0.2, bottom: 0.3, right: 0.05 });
        expect(rect.x).toBeCloseTo(0.2, 10);
        expect(rect.y).toBeCloseTo(0.1, 10);
        expect(rect.width).toBeCloseTo(0.75, 10);
        expect(rect.height).toBeCloseTo(0.6, 10);
    });

    it("does not produce negative dimensions when insets overlap", () => {
        const rect = getCropRect({ top: 0.7, left: 0.7, bottom: 0.7, right: 0.7 });
        expect(rect.width).toBe(0);
        expect(rect.height).toBe(0);
    });

    it("clamps out-of-range values", () => {
        const rect = getCropRect({ top: -1, left: 2, bottom: 0, right: 0 });
        expect(rect.x).toBe(1);
        expect(rect.y).toBe(0);
    });
});

describe("getVisibleRect", () => {
    it("returns the crop rect when no aspect ratio is requested", () => {
        const rect = getVisibleRect(
            image({ crop: { top: 0.1, left: 0.1, bottom: 0.1, right: 0.1 } })
        );
        expect(rect).toEqual({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
    });

    it("fits a 16:9 rect inside a square image, centered by default", () => {
        // 1000x1000, target 16:9 -> width limited, height = 1000 * 9/16 = 562.5px = 0.5625.
        const rect = getVisibleRect(image(), 16 / 9);
        expect(rect.width).toBeCloseTo(1, 5);
        expect(rect.height).toBeCloseTo(0.5625, 5);
        // Centered vertically: y = (1 - 0.5625) / 2.
        expect(rect.y).toBeCloseTo((1 - 0.5625) / 2, 5);
        expect(rect.x).toBeCloseTo(0, 5);
    });

    it("shifts the visible rect toward the hotspot and clamps to bounds", () => {
        // Hotspot near the top -> the 16:9 band should clamp to y = 0 (cannot go negative).
        const rect = getVisibleRect(
            image({ hotspot: { x: 0.5, y: 0.05, width: 0.2, height: 0.2 } }),
            16 / 9
        );
        expect(rect.y).toBeCloseTo(0, 5);
    });

    it("keeps the visible rect within the crop rectangle", () => {
        const rect = getVisibleRect(
            image({
                crop: { top: 0.25, left: 0, bottom: 0.25, right: 0 },
                hotspot: { x: 0.5, y: 0.9, width: 0.2, height: 0.2 }
            }),
            1
        );
        // Crop is 1000x500; a square fit is 500x500 (0.5 tall). It must stay inside [0.25, 0.75].
        expect(rect.y).toBeGreaterThanOrEqual(0.25 - 1e-9);
        expect(rect.y + rect.height).toBeLessThanOrEqual(0.75 + 1e-9);
    });

    it("accepts an explicit width/height aspect ratio", () => {
        const byObject = getVisibleRect(image(), { width: 16, height: 9 });
        const byNumber = getVisibleRect(image(), 16 / 9);
        expect(byObject).toEqual(byNumber);
    });
});

describe("getImageRenderData", () => {
    it("derives objectPosition from the hotspot", () => {
        const data = getImageRenderData(
            image({ hotspot: { x: 0.25, y: 0.75, width: 0.2, height: 0.2 } }),
            1
        );
        expect(data.objectPosition).toBe("25% 75%");
    });

    it("produces an overflow-hidden container with the requested aspect ratio", () => {
        const data = getImageRenderData(image(), 16 / 9);
        expect(data.container.overflow).toBe("hidden");
        expect(data.container.aspectRatio).toBe(`${Math.round((16 / 9) * 1000) / 1000}`);
    });

    it("scales and offsets the image so the visible rect fills the container", () => {
        // Square image, 16:9 target: visible rect is full width, 0.5625 tall.
        const data = getImageRenderData(image(), 16 / 9);
        // width fills (100%), height scales up by 1/0.5625.
        expect(data.image.width).toBe("100%");
        expect(data.image.height).toBe(`${Math.round((100 / 0.5625) * 1000) / 1000}%`);
        // left offset 0 (x=0), top offset negative (centered band).
        expect(parseFloat(data.image.left)).toBe(0);
        expect(parseFloat(data.image.top)).toBeLessThan(0);
    });

    it("stays finite for a degenerate (collapsed) crop", () => {
        const data = getImageRenderData(
            image({ crop: { top: 0.7, left: 0.7, bottom: 0.7, right: 0.7 } }),
            1
        );
        expect(Number.isFinite(parseFloat(data.image.width))).toBe(true);
        expect(Number.isFinite(parseFloat(data.image.height))).toBe(true);
    });

    it("passes through intrinsic dimensions", () => {
        const data = getImageRenderData(image(undefined, 1920, 1080), 16 / 9);
        expect(data.intrinsicWidth).toBe(1920);
        expect(data.intrinsicHeight).toBe(1080);
    });
});
