import { describe, it, expect } from "vitest";
import { getCropRect, getImageRenderData, getVisibleRect, resolveAssetImage } from "./geometry.js";
import type { AssetImage } from "@webiny/sdk";

const image = (overrides?: Partial<AssetImage>): AssetImage => ({
    width: 1000,
    height: 1000,
    ...overrides
});

describe("resolveAssetImage", () => {
    it("prefers the override per property, falling back to the asset default", () => {
        const assetDefault: AssetImage = {
            crop: { top: 0.1, left: 0.1, bottom: 0.1, right: 0.1 },
            focalPoint: { x: 0.2, y: 0.2 },
            alt: "default alt",
            caption: "default caption"
        };
        const override: AssetImage = {
            focalPoint: { x: 0.8, y: 0.8 },
            alt: "override alt"
        };

        const result = resolveAssetImage(override, assetDefault);

        expect(result.crop).toEqual(assetDefault.crop);
        expect(result.caption).toBe("default caption");
        expect(result.focalPoint).toEqual(override.focalPoint);
        expect(result.alt).toBe("override alt");
    });

    it("handles null/undefined inputs", () => {
        expect(resolveAssetImage(null, null)).toEqual({
            crop: undefined,
            focalPoint: undefined,
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
        const rect = getVisibleRect(image(), 16 / 9);
        expect(rect.width).toBeCloseTo(1, 5);
        expect(rect.height).toBeCloseTo(0.5625, 5);
        expect(rect.y).toBeCloseTo((1 - 0.5625) / 2, 5);
        expect(rect.x).toBeCloseTo(0, 5);
    });

    it("shifts the visible rect toward the focal point and clamps to bounds", () => {
        const rect = getVisibleRect(image({ focalPoint: { x: 0.5, y: 0.05 } }), 16 / 9);
        expect(rect.y).toBeCloseTo(0, 5);
    });

    it("keeps the visible rect within the crop rectangle", () => {
        const rect = getVisibleRect(
            image({
                crop: { top: 0.25, left: 0, bottom: 0.25, right: 0 },
                focalPoint: { x: 0.5, y: 0.9 }
            }),
            1
        );
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
    it("derives objectPosition from the focal point", () => {
        const data = getImageRenderData(image({ focalPoint: { x: 0.25, y: 0.75 } }), 1);
        expect(data.objectPosition).toBe("25% 75%");
    });

    it("produces an overflow-hidden container with the requested aspect ratio", () => {
        const data = getImageRenderData(image(), 16 / 9);
        expect(data.container.overflow).toBe("hidden");
        expect(data.container.aspectRatio).toBe(`${Math.round((16 / 9) * 1000) / 1000}`);
    });

    it("scales and offsets the image so the visible rect fills the container", () => {
        const data = getImageRenderData(image(), 16 / 9);
        expect(data.image.width).toBe("100%");
        expect(data.image.height).toBe(`${Math.round((100 / 0.5625) * 1000) / 1000}%`);
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
        const data = getImageRenderData(image({ width: 1920, height: 1080 }), 16 / 9);
        expect(data.intrinsicWidth).toBe(1920);
        expect(data.intrinsicHeight).toBe(1080);
    });
});
